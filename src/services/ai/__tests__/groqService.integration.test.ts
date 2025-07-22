import { groqService } from '../groqService';

describe('GroqService Integration', () => {
  // Skip these tests if no API key is provided
  const hasApiKey = process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== '';

  beforeAll(() => {
    if (!hasApiKey) {
      console.log('Skipping Groq integration tests - no API key provided');
    }
  });

  describe('when API key is provided', () => {
    it('should be available', () => {
      if (!hasApiKey) {
        expect(groqService.isAvailable()).toBe(false);
      } else {
        expect(groqService.isAvailable()).toBe(true);
      }
    });

    it('should return service configuration', () => {
      const config = groqService.getConfig();
      
      expect(config).toHaveProperty('model');
      expect(config).toHaveProperty('maxTokens');
      expect(config).toHaveProperty('temperature');
      expect(config).toHaveProperty('streamingEnabled');
      expect(config).not.toHaveProperty('apiKey');
    });

    it.skip('should test connection successfully', async () => {
      // Skip this test unless we have a real API key
      if (!hasApiKey) return;

      const result = await groqService.testConnection();
      expect(result).toBe(true);
    }, 10000);

    it.skip('should enhance job description text', async () => {
      // Skip this test unless we have a real API key
      if (!hasApiKey) return;

      const request = {
        content: 'We need someone to help with front desk work.',
        type: 'job-description' as const,
      };

      let enhancedText = '';
      for await (const chunk of groqService.enhanceText(request)) {
        enhancedText += chunk;
      }

      expect(enhancedText).toBeTruthy();
      expect(enhancedText.length).toBeGreaterThan(request.content.length);
    }, 15000);
  });

  describe('request queuing', () => {
    it('should provide queue status information', () => {
      const status = groqService.getQueueStatus();
      
      expect(status).toHaveProperty('pending');
      expect(status).toHaveProperty('processing');
      expect(status).toHaveProperty('maxConcurrent');
      expect(typeof status.pending).toBe('number');
      expect(typeof status.processing).toBe('number');
      expect(typeof status.maxConcurrent).toBe('number');
    });

    it('should allow configuring max concurrent requests', () => {
      const originalMax = groqService.getQueueStatus().maxConcurrent;
      
      groqService.setMaxConcurrentRequests(5);
      expect(groqService.getQueueStatus().maxConcurrent).toBe(5);
      
      // Reset to original value
      groqService.setMaxConcurrentRequests(originalMax);
    });
  });

  describe('error handling', () => {
    it('should handle empty content gracefully', async () => {
      const request = {
        content: '',
        type: 'job-description' as const,
      };

      const generator = groqService.enhanceText(request);
      await expect(generator.next()).rejects.toThrow('Content cannot be empty');
    });

    it('should handle content that is too long', async () => {
      const request = {
        content: 'a'.repeat(5000),
        type: 'job-description' as const,
      };

      const generator = groqService.enhanceText(request);
      await expect(generator.next()).rejects.toThrow('Content is too long');
    });

    it('should handle invalid enhancement types', async () => {
      const request = {
        content: 'Valid content',
        type: 'invalid-type' as any,
      };

      const generator = groqService.enhanceText(request);
      await expect(generator.next()).rejects.toThrow('Invalid enhancement type');
    });
  });
});