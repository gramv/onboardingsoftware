import { GroqService } from '../groqService';

// Mock the Groq SDK
jest.mock('groq-sdk', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      chat: {
        completions: {
          create: jest.fn(),
        },
      },
    })),
  };
});

// Mock the config
jest.mock('../../../config/environment', () => ({
  config: {
    groq: {
      apiKey: 'test-api-key',
      model: 'llama3-8b-8192',
      maxTokens: 1024,
      temperature: 0.7,
      streamingEnabled: true,
    },
  },
}));

describe('GroqService', () => {
  let groqService: GroqService;

  beforeEach(() => {
    groqService = new GroqService();
  });

  describe('constructor', () => {
    it('should initialize with valid configuration', () => {
      expect(groqService).toBeInstanceOf(GroqService);
      expect(groqService.isAvailable()).toBe(true);
    });
  });

  describe('isAvailable', () => {
    it('should return true when API key is provided', () => {
      expect(groqService.isAvailable()).toBe(true);
    });
  });

  describe('getConfig', () => {
    it('should return configuration without API key', () => {
      const config = groqService.getConfig();
      
      expect(config).toEqual({
        model: 'llama3-8b-8192',
        maxTokens: 1024,
        temperature: 0.7,
        streamingEnabled: true,
      });
      
      expect(config).not.toHaveProperty('apiKey');
    });
  });

  describe('testConnection', () => {
    it('should return true for successful connection', async () => {
      const mockCreate = jest.fn().mockResolvedValue({
        choices: [{
          message: {
            content: 'Connection successful',
          },
        }],
      });

      (groqService as any).client.chat.completions.create = mockCreate;

      const result = await groqService.testConnection();
      expect(result).toBe(true);
      expect(mockCreate).toHaveBeenCalledWith({
        messages: [{
          role: 'user',
          content: 'Hello, this is a connection test. Please respond with "Connection successful".',
        }],
        model: 'llama3-8b-8192',
        max_tokens: 50,
        temperature: 0.1,
      });
    });

    it('should return false for failed connection', async () => {
      const mockCreate = jest.fn().mockRejectedValue(new Error('Network error'));
      (groqService as any).client.chat.completions.create = mockCreate;

      const result = await groqService.testConnection();
      expect(result).toBe(false);
    });
  });

  describe('enhanceText', () => {
    it('should throw error for empty content', async () => {
      const request = {
        content: '',
        type: 'job-description' as const,
      };

      const generator = groqService.enhanceText(request);
      await expect(generator.next()).rejects.toThrow('Content cannot be empty');
    });

    it('should throw error for content too long', async () => {
      const request = {
        content: 'a'.repeat(5000),
        type: 'job-description' as const,
      };

      const generator = groqService.enhanceText(request);
      await expect(generator.next()).rejects.toThrow('Content is too long. Please limit to 4000 characters.');
    });

    it('should throw error for invalid enhancement type', async () => {
      const request = {
        content: 'Test content',
        type: 'invalid-type' as any,
      };

      const generator = groqService.enhanceText(request);
      await expect(generator.next()).rejects.toThrow('Invalid enhancement type. Must be job-description, requirements, or benefits.');
    });

    it('should throw error when service is not available', async () => {
      // Mock service as unavailable
      jest.spyOn(groqService, 'isAvailable').mockReturnValue(false);

      const request = {
        content: 'Test content',
        type: 'job-description' as const,
      };

      const generator = groqService.enhanceText(request);
      await expect(generator.next()).rejects.toThrow('Groq service is not available. Please check API key configuration.');
    });
  });

  describe('request queuing', () => {
    it('should return initial queue status', () => {
      const status = groqService.getQueueStatus();
      expect(status).toEqual({
        pending: 0,
        processing: 0,
        maxConcurrent: 3,
      });
    });

    it('should allow setting max concurrent requests', () => {
      groqService.setMaxConcurrentRequests(5);
      const status = groqService.getQueueStatus();
      expect(status.maxConcurrent).toBe(5);
    });

    it('should throw error for invalid max concurrent requests', () => {
      expect(() => groqService.setMaxConcurrentRequests(0)).toThrow('Maximum concurrent requests must be at least 1');
      expect(() => groqService.setMaxConcurrentRequests(-1)).toThrow('Maximum concurrent requests must be at least 1');
    });

    it('should handle multiple concurrent requests', async () => {
      // Mock streaming disabled for simpler testing
      (groqService as any).config.streamingEnabled = false;

      // Mock the API call to return a simple response
      const mockCreate = jest.fn().mockImplementation(() => {
        return Promise.resolve({
          choices: [{
            message: {
              content: 'Enhanced text response',
            },
          }],
        });
      });

      (groqService as any).client.chat.completions.create = mockCreate;

      // Set max concurrent to 2 for testing
      groqService.setMaxConcurrentRequests(2);

      const requests = [
        { content: 'Test content 1', type: 'job-description' as const },
        { content: 'Test content 2', type: 'requirements' as const },
        { content: 'Test content 3', type: 'benefits' as const },
      ];

      // Start multiple requests simultaneously
      const generators = requests.map(req => groqService.enhanceText(req));

      // Process first chunk from each generator
      const results = await Promise.all(
        generators.map(async gen => {
          const { value } = await gen.next();
          return value;
        })
      );

      expect(results).toHaveLength(3);
      expect(mockCreate).toHaveBeenCalledTimes(3);
    });
  });

  describe('request validation', () => {
    it('should validate content is not empty', () => {
      const request = {
        content: '   ',
        type: 'job-description' as const,
      };

      const generator = groqService.enhanceText(request);
      expect(generator.next()).rejects.toThrow('Content cannot be empty');
    });

    it('should validate content length', () => {
      const request = {
        content: 'a'.repeat(4001),
        type: 'job-description' as const,
      };

      const generator = groqService.enhanceText(request);
      expect(generator.next()).rejects.toThrow('Content is too long. Please limit to 4000 characters.');
    });

    it('should validate enhancement type', () => {
      const request = {
        content: 'Valid content',
        type: 'invalid' as any,
      };

      const generator = groqService.enhanceText(request);
      expect(generator.next()).rejects.toThrow('Invalid enhancement type. Must be job-description, requirements, or benefits.');
    });
  });
});