import { createClient } from 'redis';
import { config } from './environment';

// In-memory store for development when Redis is not available
class MemoryStore {
  private storage: Map<string, string> = new Map();
  private expirations: Map<string, number> = new Map();
  
  async set(key: string, value: string): Promise<void> {
    this.storage.set(key, value);
    return Promise.resolve();
  }
  
  async get(key: string): Promise<string | null> {
    const value = this.storage.get(key);
    
    // Check if key has expired
    const expiration = this.expirations.get(key);
    if (expiration && Date.now() > expiration) {
      this.del(key);
      return null;
    }
    
    return value || null;
  }
  
  async del(key: string | string[]): Promise<void> {
    if (Array.isArray(key)) {
      key.forEach(k => {
        this.storage.delete(k);
        this.expirations.delete(k);
      });
    } else {
      this.storage.delete(key);
      this.expirations.delete(key);
    }
    return Promise.resolve();
  }
  
  async expireAt(key: string, timestamp: number): Promise<void> {
    this.expirations.set(key, timestamp * 1000); // Convert to milliseconds
    return Promise.resolve();
  }
  
  async keys(pattern: string): Promise<string[]> {
    const regex = new RegExp(pattern.replace('*', '.*'));
    return Array.from(this.storage.keys()).filter(key => regex.test(key));
  }
}

// Create a client interface that works with both Redis and memory store
class RedisClient {
  private client: any;
  private useMemoryStore: boolean = false;
  private connected: boolean = false;
  
  constructor() {
    try {
      this.client = createClient({
        url: config.redis.url,
        socket: {
          reconnectStrategy: (retries: number) => {
            if (config.isDevelopment && retries >= 2) {
              console.log('⚠️ Redis connection failed, switching to in-memory store');
              this.switchToMemoryStore();
              return false; // Stop reconnecting
            }
            // Exponential backoff with max delay of 10 seconds
            const delay = Math.min(Math.pow(2, retries) * 100, 10000);
            console.log(`Redis reconnect attempt ${retries}, retrying in ${delay}ms`);
            return delay;
          }
        }
      });
      
      this.client.on('error', (err: Error) => {
        console.error('Redis Client Error:', err);
        if (config.isDevelopment && !this.useMemoryStore) {
          console.log('⚠️ Redis error occurred, switching to in-memory store');
          this.switchToMemoryStore();
        }
      });
      
      this.client.on('connect', () => {
        console.log('✅ Connected to Redis');
        this.connected = true;
      });
      
      this.client.on('ready', () => {
        console.log('✅ Redis client ready');
      });
      
      this.client.on('disconnect', () => {
        console.log('❌ Disconnected from Redis');
        this.connected = false;
      });
    } catch (error) {
      console.error('Failed to create Redis client:', error);
      if (config.isDevelopment) {
        this.switchToMemoryStore();
      } else {
        throw error;
      }
    }
  }
  
  private switchToMemoryStore() {
    if (this.useMemoryStore) return;
    
    console.log('🔄 Switching to in-memory store for development');
    this.client = new MemoryStore();
    this.useMemoryStore = true;
    this.connected = true;
  }
  
  async connect(): Promise<void> {
    try {
      if (this.useMemoryStore) {
        console.log('🔄 Using in-memory store (Redis alternative)');
        return;
      }
      
      await this.client.connect();
      console.log('🔗 Redis connection established');
      this.connected = true;
    } catch (error) {
      console.error('Failed to connect to Redis:', error);
      if (config.isDevelopment) {
        this.switchToMemoryStore();
      } else {
        throw error;
      }
    }
  }
  
  async disconnect(): Promise<void> {
    if (this.useMemoryStore) return;
    
    try {
      await this.client.disconnect();
      console.log('🔌 Redis connection closed');
      this.connected = false;
    } catch (error) {
      console.error('Error disconnecting from Redis:', error);
    }
  }
  
  async set(key: string, value: string): Promise<void> {
    return this.client.set(key, value);
  }
  
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }
  
  async del(key: string | string[]): Promise<void> {
    return this.client.del(key);
  }
  
  async expireAt(key: string, timestamp: number): Promise<void> {
    return this.client.expireAt(key, timestamp);
  }
  
  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern);
  }
  
  isConnected(): boolean {
    return this.connected;
  }
  
  isUsingMemoryStore(): boolean {
    return this.useMemoryStore;
  }
}

// Create a singleton instance
export const redisClient = new RedisClient();

// Connect to Redis with proper error handling
export const connectRedis = async () => {
  await redisClient.connect();
};

// Disconnect from Redis
export const disconnectRedis = async () => {
  await redisClient.disconnect();
};