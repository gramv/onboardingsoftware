import { Response } from 'express';
import { translationService } from '../../utils/i18n/translationService';

export interface NotificationData {
  type: 'announcement' | 'message' | 'schedule' | 'system';
  title: string;
  content: string;
  priority?: 'normal' | 'high' | 'urgent';
  data?: any;
  timestamp: Date;
  id: string;
}

export interface NotificationConnection {
  userId: string;
  response: Response;
  language: string;
  lastPing: Date;
}

export class NotificationService {
  private connections: Map<string, NotificationConnection> = new Map();
  private heartbeatInterval: NodeJS.Timeout;

  constructor() {
    // Clean up stale connections every 30 seconds
    this.heartbeatInterval = setInterval(() => {
      this.cleanupStaleConnections();
    }, 30000);
  }

  /**
   * Add a new SSE connection for a user
   */
  addConnection(userId: string, response: Response, language: string = 'en'): void {
    // Remove existing connection if any
    this.removeConnection(userId);

    const connection: NotificationConnection = {
      userId,
      response,
      language,
      lastPing: new Date()
    };

    this.connections.set(userId, connection);

    // Set up SSE headers
    response.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    // Send initial connection confirmation
    this.sendToConnection(connection, {
      type: 'system',
      id: this.generateId(),
      title: translationService.t('notifications.connected', {}, language),
      content: translationService.t('notifications.connectedMessage', {}, language),
      priority: 'normal',
      timestamp: new Date()
    });

    // Set up heartbeat
    const heartbeat = setInterval(() => {
      if (this.connections.has(userId)) {
        try {
          response.write(`: heartbeat\n\n`);
          connection.lastPing = new Date();
        } catch (error) {
          console.error('Error sending heartbeat:', error);
          this.removeConnection(userId);
          clearInterval(heartbeat);
        }
      } else {
        clearInterval(heartbeat);
      }
    }, 15000);

    // Handle connection close
    response.on('close', () => {
      this.removeConnection(userId);
      clearInterval(heartbeat);
    });

    response.on('error', (error) => {
      console.error('SSE connection error:', error);
      this.removeConnection(userId);
      clearInterval(heartbeat);
    });
  }

  /**
   * Remove a connection for a user
   */
  removeConnection(userId: string): void {
    const connection = this.connections.get(userId);
    if (connection) {
      try {
        connection.response.end();
      } catch (error) {
        // Connection already closed
      }
      this.connections.delete(userId);
    }
  }

  /**
   * Send notification to a specific user
   */
  async notifyUser(userId: string, notification: Omit<NotificationData, 'id' | 'timestamp'>): Promise<void> {
    const connection = this.connections.get(userId);
    if (!connection) {
      // User not connected, could store for later or send email
      console.log(`User ${userId} not connected for notification:`, notification.title);
      return;
    }

    const fullNotification: NotificationData = {
      ...notification,
      id: this.generateId(),
      timestamp: new Date()
    };

    // Translate notification content
    const translatedNotification = await this.translateNotification(fullNotification, connection.language);

    this.sendToConnection(connection, translatedNotification);
  }

  /**
   * Send notification to multiple users
   */
  async notifyUsers(userIds: string[], notification: Omit<NotificationData, 'id' | 'timestamp'>): Promise<void> {
    const promises = userIds.map(userId => this.notifyUser(userId, notification));
    await Promise.all(promises);
  }

  /**
   * Send notification to all connected users
   */
  async notifyAll(notification: Omit<NotificationData, 'id' | 'timestamp'>): Promise<void> {
    const connectedUserIds = Array.from(this.connections.keys());
    await this.notifyUsers(connectedUserIds, notification);
  }

  /**
   * Get count of active connections
   */
  getActiveConnectionCount(): number {
    return this.connections.size;
  }

  /**
   * Get list of connected user IDs
   */
  getConnectedUsers(): string[] {
    return Array.from(this.connections.keys());
  }

  /**
   * Send data to a specific connection
   */
  private sendToConnection(connection: NotificationConnection, notification: NotificationData): void {
    try {
      const data = JSON.stringify(notification);
      connection.response.write(`id: ${notification.id}\n`);
      connection.response.write(`event: notification\n`);
      connection.response.write(`data: ${data}\n\n`);
    } catch (error) {
      console.error('Error sending notification to connection:', error);
      this.removeConnection(connection.userId);
    }
  }

  /**
   * Clean up stale connections
   */
  private cleanupStaleConnections(): void {
    const now = new Date();
    const staleThreshold = 2 * 60 * 1000; // 2 minutes

    this.connections.forEach((connection, userId) => {
      if (now.getTime() - connection.lastPing.getTime() > staleThreshold) {
        console.log(`Cleaning up stale connection for user ${userId}`);
        this.removeConnection(userId);
      }
    });
  }

  /**
   * Translate notification content
   */
  private async translateNotification(notification: NotificationData, language: string): Promise<NotificationData> {
    // For now, return as-is. In the future, we could translate dynamic content
    return notification;
  }

  /**
   * Generate unique ID for notifications
   */
  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cleanup when service is destroyed
   */
  destroy(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    // Close all connections
    const userIds = Array.from(this.connections.keys());
    userIds.forEach(userId => this.removeConnection(userId));
  }
}

// Export singleton instance
export const notificationService = new NotificationService();