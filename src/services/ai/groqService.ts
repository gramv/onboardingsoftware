import Groq from 'groq-sdk';
import { config } from '../../config/environment';

export type EnhancementType = 'job-description' | 'requirements' | 'benefits';

export interface EnhancementRequest {
  content: string;
  type: EnhancementType;
  language?: string;
  id?: string;
  context?: {
    title?: string;
    department?: string;
    position?: string;
    salaryRange?: string;
    motelName?: string;
  };
}

export interface QueuedRequest {
  id: string;
  request: EnhancementRequest;
  timestamp: Date;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  resolve?: (value: AsyncGenerator<string>) => void;
  reject?: (error: Error) => void;
}

export interface GroqConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
  streamingEnabled: boolean;
  retryAttempts: number;
  retryDelay: number;
  timeout: number;
}

export interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
  backoffMultiplier: number;
}

export interface RateLimitInfo {
  isRateLimited: boolean;
  resetTime?: Date;
  remainingRequests?: number;
  retryAfter?: number;
}

export interface ServiceStatus {
  isAvailable: boolean;
  lastError?: string;
  lastErrorTime?: Date;
  consecutiveFailures: number;
  rateLimitInfo?: RateLimitInfo;
}

export class GroqService {
  private client: Groq;
  private config: GroqConfig;
  private requestQueue: QueuedRequest[] = [];
  private activeRequests: Set<string> = new Set();
  private maxConcurrentRequests: number = 3;
  private isProcessingQueue: boolean = false;
  private serviceStatus: ServiceStatus = {
    isAvailable: true,
    consecutiveFailures: 0,
  };
  private retryConfig: RetryConfig = {
    maxAttempts: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffMultiplier: 2,
  };

  constructor() {
    this.config = {
      apiKey: config.groq.apiKey,
      model: config.groq.model,
      maxTokens: config.groq.maxTokens,
      temperature: config.groq.temperature,
      streamingEnabled: config.groq.streamingEnabled,
      retryAttempts: 3,
      retryDelay: 1000,
      timeout: 30000,
    };

    if (!this.config.apiKey) {
      this.serviceStatus = {
        isAvailable: false,
        lastError: 'GROQ_API_KEY is required but not provided in environment variables',
        lastErrorTime: new Date(),
        consecutiveFailures: 1,
      };
      console.error('GroqService initialization failed: Missing API key');
      return;
    }

    try {
      this.client = new Groq({
        apiKey: this.config.apiKey,
      });
      this.serviceStatus.isAvailable = true;
    } catch (error) {
      this.serviceStatus = {
        isAvailable: false,
        lastError: error instanceof Error ? error.message : 'Failed to initialize Groq client',
        lastErrorTime: new Date(),
        consecutiveFailures: 1,
      };
      console.error('GroqService initialization failed:', error);
    }
  }

  /**
   * Test the connection to Groq API
   */
  async testConnection(): Promise<boolean> {
    if (!this.isAvailable()) {
      return false;
    }

    try {
      await this.retryOperation(async () => {
        const response = await this.client.chat.completions.create({
          messages: [
            {
              role: 'user',
              content: 'Hello, this is a connection test. Please respond with "Connection successful".',
            },
          ],
          model: this.config.model,
          max_tokens: 50,
          temperature: 0.1,
        });

        const content = response.choices[0]?.message?.content;
        if (!content?.toLowerCase().includes('connection successful')) {
          throw new Error('Invalid response from API');
        }
        return response;
      }, 'Connection test');

      this.serviceStatus.isAvailable = true;
      return true;
    } catch (error) {
      console.error('Groq connection test failed:', error);
      this.serviceStatus.isAvailable = false;
      return false;
    }
  }

  /**
   * Check if the Groq service is available
   */
  isAvailable(): boolean {
    return this.serviceStatus.isAvailable && !!this.config.apiKey && this.config.apiKey !== '';
  }

  /**
   * Get current service status
   */
  getServiceStatus(): ServiceStatus {
    return { ...this.serviceStatus };
  }

  /**
   * Handle API errors and update service status
   */
  private handleApiError(error: any): Error {
    this.serviceStatus.consecutiveFailures += 1;
    this.serviceStatus.lastErrorTime = new Date();

    // Parse different types of errors
    if (error?.status === 429 || error?.message?.includes('rate limit')) {
      const retryAfter = error?.headers?.['retry-after'] ? parseInt(error.headers['retry-after']) : 60;
      const resetTime = new Date(Date.now() + retryAfter * 1000);

      this.serviceStatus.rateLimitInfo = {
        isRateLimited: true,
        resetTime,
        retryAfter,
      };

      const rateLimitError = new Error(`Rate limit exceeded. Please try again in ${retryAfter} seconds.`);
      rateLimitError.name = 'RateLimitError';
      this.serviceStatus.lastError = rateLimitError.message;
      return rateLimitError;
    }

    if (error?.status === 401 || error?.message?.includes('invalid api key')) {
      this.serviceStatus.isAvailable = false;
      const authError = new Error('Invalid API key. Please check your Groq configuration.');
      authError.name = 'AuthenticationError';
      this.serviceStatus.lastError = authError.message;
      return authError;
    }

    if (error?.status === 404 || error?.message?.includes('model not found')) {
      const modelError = new Error(`The specified model "${this.config.model}" is not available.`);
      modelError.name = 'ModelNotFoundError';
      this.serviceStatus.lastError = modelError.message;
      return modelError;
    }

    if (error?.code === 'ECONNREFUSED' || error?.code === 'ENOTFOUND' || error?.message?.includes('network')) {
      const networkError = new Error('Network error. Please check your internet connection.');
      networkError.name = 'NetworkError';
      this.serviceStatus.lastError = networkError.message;
      return networkError;
    }

    if (error?.code === 'ETIMEDOUT' || error?.message?.includes('timeout')) {
      const timeoutError = new Error('Request timed out. Please try again.');
      timeoutError.name = 'TimeoutError';
      this.serviceStatus.lastError = timeoutError.message;
      return timeoutError;
    }

    // Generic error
    const genericError = new Error(error?.message || 'An unexpected error occurred with the AI service.');
    genericError.name = 'AIServiceError';
    this.serviceStatus.lastError = genericError.message;
    return genericError;
  }

  /**
   * Reset service status on successful operation
   */
  private resetServiceStatus(): void {
    this.serviceStatus.consecutiveFailures = 0;
    this.serviceStatus.lastError = undefined;
    this.serviceStatus.lastErrorTime = undefined;

    // Clear rate limit info if enough time has passed
    if (this.serviceStatus.rateLimitInfo?.resetTime && new Date() > this.serviceStatus.rateLimitInfo.resetTime) {
      this.serviceStatus.rateLimitInfo = undefined;
    }
  }

  /**
   * Check if service should be temporarily disabled due to consecutive failures
   */
  private shouldDisableService(): boolean {
    return this.serviceStatus.consecutiveFailures >= 5;
  }

  /**
   * Calculate retry delay with exponential backoff
   */
  private calculateRetryDelay(attempt: number): number {
    const delay = this.retryConfig.baseDelay * Math.pow(this.retryConfig.backoffMultiplier, attempt - 1);
    return Math.min(delay, this.retryConfig.maxDelay);
  }

  /**
   * Retry operation with exponential backoff
   */
  private async retryOperation<T>(
    operation: () => Promise<T>,
    context: string,
    maxAttempts: number = this.retryConfig.maxAttempts
  ): Promise<T> {
    let lastError: Error;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const result = await operation();
        this.resetServiceStatus();
        return result;
      } catch (error) {
        lastError = this.handleApiError(error);

        // Don't retry for certain error types
        if (lastError.name === 'AuthenticationError' || lastError.name === 'ModelNotFoundError') {
          throw lastError;
        }

        // Don't retry on last attempt
        if (attempt === maxAttempts) {
          break;
        }

        // Calculate delay for next attempt
        const delay = this.calculateRetryDelay(attempt);
        console.warn(`${context} failed (attempt ${attempt}/${maxAttempts}). Retrying in ${delay}ms...`, lastError.message);

        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }

    throw lastError!;
  }

  /**
   * Get context-aware prompt for different enhancement types
   */
  private getPromptForType(type: EnhancementType, content: string, context?: any): string {
    const contextInfo = context ? `
Job Context:
- Industry: Hospitality/Motel Operations
- Position: ${context.title || 'Not specified'} in ${context.department || 'Not specified'}
- Level: ${context.position || 'Not specified'}
- Work Environment: Professional motel/hotel setting focused on guest satisfaction
` : `
Industry Context: Hospitality/Motel Operations
`;

    const basePrompts = {
      'job-description': `You are an AI assistant tasked with rewriting job-related content for a motel operation in the hospitality industry. Your goal is to create clear, factual, and professional text with minimal marketing language.

${contextInfo}

Rewrite this job description to be professional and well-structured. Start with a brief 1-2 sentence introduction about the role, then list the main responsibilities. Use minimal marketing language - avoid excessive words like "dynamic", "award-winning", "world-class", "cutting-edge". Focus on actual job duties and responsibilities while maintaining a professional tone. Keep it under 100 words.

Content to rewrite: "${content}"

Return ONLY the rewritten content without any prefixes, labels, or explanations.`,

      'requirements': `You are an AI assistant tasked with rewriting job-related content for a motel operation in the hospitality industry. Your goal is to create clear, factual, and straightforward text without using marketing language or superlatives.

${contextInfo}

Rewrite these job requirements to be clear, specific, and factual. Avoid marketing language and superlatives. Focus on necessary skills, experience, and qualifications. Format as bullet points. Be direct and minimal. Keep it under 100 words.

Content to rewrite: "${content}"

Return ONLY the rewritten content as bullet points without any prefixes, labels, or explanations.`,

      'benefits': `You are an AI assistant tasked with rewriting job-related content for a motel operation in the hospitality industry. Your goal is to create clear, factual, and straightforward text without using marketing language or superlatives.

${contextInfo}

Rewrite these benefits to be factual and straightforward. Avoid marketing language and words like "competitive", "excellent", "outstanding", "comprehensive", "amazing", "exceptional", "premier", "world-class". State only actual benefits, compensation, and working conditions. Format as bullet points. Be direct and minimal. Keep it under 100 words.

Content to rewrite: "${content}"

Return ONLY the rewritten content as bullet points without any prefixes, labels, or explanations.`,
    };

    return basePrompts[type];
  }

  /**
   * Enhance text using Groq API with streaming support and request queuing
   */
  async* enhanceText(request: EnhancementRequest): AsyncGenerator<string> {
    if (!this.isAvailable()) {
      const error = new Error('AI service is currently unavailable. Please try again later.');
      error.name = 'ServiceUnavailableError';
      throw error;
    }

    if (this.shouldDisableService()) {
      const error = new Error('AI service is temporarily disabled due to repeated failures. Please try again later.');
      error.name = 'ServiceDisabledError';
      throw error;
    }

    // Check rate limiting
    if (this.serviceStatus.rateLimitInfo?.isRateLimited) {
      const resetTime = this.serviceStatus.rateLimitInfo.resetTime;
      if (resetTime && new Date() < resetTime) {
        const waitTime = Math.ceil((resetTime.getTime() - Date.now()) / 1000);
        const error = new Error(`Rate limit exceeded. Please wait ${waitTime} seconds before trying again.`);
        error.name = 'RateLimitError';
        throw error;
      } else {
        // Clear expired rate limit
        this.serviceStatus.rateLimitInfo = undefined;
      }
    }

    try {
      this.validateRequest(request);

      // Use queuing system for handling multiple requests
      const generator = await this.queueRequest(request);

      // Yield all chunks from the queued request
      for await (const chunk of generator) {
        yield chunk;
      }

      // Reset error status on successful completion
      this.resetServiceStatus();
    } catch (error) {
      console.error('Error enhancing text with Groq:', error);
      throw this.handleApiError(error);
    }
  }

  /**
   * Validate enhancement request
   */
  private validateRequest(request: EnhancementRequest): void {
    if (!request.content || !request.content.trim()) {
      throw new Error('Content cannot be empty');
    }

    if (request.content.length > 4000) {
      throw new Error('Content is too long. Please limit to 4000 characters.');
    }

    if (!['job-description', 'requirements', 'benefits'].includes(request.type)) {
      throw new Error('Invalid enhancement type. Must be job-description, requirements, or benefits.');
    }
  }

  /**
   * Generate unique request ID
   */
  private generateRequestId(): string {
    return `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Add request to queue
   */
  private async queueRequest(request: EnhancementRequest): Promise<AsyncGenerator<string>> {
    return new Promise((resolve, reject) => {
      const queuedRequest: QueuedRequest = {
        id: request.id || this.generateRequestId(),
        request,
        timestamp: new Date(),
        status: 'pending',
        resolve,
        reject,
      };

      this.requestQueue.push(queuedRequest);
      this.processQueue();
    });
  }

  /**
   * Process the request queue
   */
  private async processQueue(): Promise<void> {
    if (this.isProcessingQueue || this.activeRequests.size >= this.maxConcurrentRequests) {
      return;
    }

    this.isProcessingQueue = true;

    while (this.requestQueue.length > 0 && this.activeRequests.size < this.maxConcurrentRequests) {
      const queuedRequest = this.requestQueue.shift();
      if (!queuedRequest) continue;

      queuedRequest.status = 'processing';
      this.activeRequests.add(queuedRequest.id);

      try {
        const generator = this.processEnhancementRequest(queuedRequest.request);
        queuedRequest.resolve?.(generator);
        queuedRequest.status = 'completed';
      } catch (error) {
        queuedRequest.status = 'failed';
        queuedRequest.reject?.(error as Error);
      } finally {
        this.activeRequests.delete(queuedRequest.id);
      }
    }

    this.isProcessingQueue = false;

    // Continue processing if there are more requests
    if (this.requestQueue.length > 0 && this.activeRequests.size < this.maxConcurrentRequests) {
      setTimeout(() => this.processQueue(), 100);
    }
  }

  /**
   * Process individual enhancement request (internal method)
   */
  private async* processEnhancementRequest(request: EnhancementRequest): AsyncGenerator<string> {
    const prompt = this.getPromptForType(request.type, request.content, request.context);

    if (this.config.streamingEnabled) {
      // Use retry logic for streaming requests
      const stream = await this.retryOperation(async () => {
        return await this.client.chat.completions.create({
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          model: this.config.model,
          max_completion_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          top_p: 0.95,
          stream: true,
          stop: null,
        });
      }, `Streaming enhancement for ${request.type}`);

      try {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content;
          if (content) {
            yield content;
          }
        }
      } catch (error) {
        // Handle streaming interruption
        const streamError = new Error('Stream was interrupted. Please try again.');
        streamError.name = 'StreamInterruptedError';
        throw streamError;
      }
    } else {
      // Non-streaming fallback with retry logic
      const response = await this.retryOperation(async () => {
        return await this.client.chat.completions.create({
          messages: [
            {
              role: 'user',
              content: prompt,
            },
          ],
          model: this.config.model,
          max_completion_tokens: this.config.maxTokens,
          temperature: this.config.temperature,
          top_p: 0.95,
          stop: null,
        });
      }, `Non-streaming enhancement for ${request.type}`);

      const content = response.choices[0]?.message?.content;
      if (content) {
        // Simulate streaming by yielding words
        const words = content.split(' ');
        for (const word of words) {
          yield word + ' ';
          // Small delay to simulate streaming
          await new Promise(resolve => setTimeout(resolve, 50));
        }
      }
    }
  }

  /**
   * Get queue status
   */
  getQueueStatus(): {
    pending: number;
    processing: number;
    maxConcurrent: number;
  } {
    return {
      pending: this.requestQueue.length,
      processing: this.activeRequests.size,
      maxConcurrent: this.maxConcurrentRequests,
    };
  }

  /**
   * Set maximum concurrent requests
   */
  setMaxConcurrentRequests(max: number): void {
    if (max < 1) {
      throw new Error('Maximum concurrent requests must be at least 1');
    }
    this.maxConcurrentRequests = max;
  }

  /**
   * Get service configuration (without sensitive data)
   */
  getConfig(): Omit<GroqConfig, 'apiKey'> {
    return {
      model: this.config.model,
      maxTokens: this.config.maxTokens,
      temperature: this.config.temperature,
      streamingEnabled: this.config.streamingEnabled,
      retryAttempts: this.config.retryAttempts,
      retryDelay: this.config.retryDelay,
      timeout: this.config.timeout,
    };
  }

  /**
   * Update retry configuration
   */
  setRetryConfig(config: Partial<RetryConfig>): void {
    this.retryConfig = { ...this.retryConfig, ...config };
  }

  /**
   * Get retry configuration
   */
  getRetryConfig(): RetryConfig {
    return { ...this.retryConfig };
  }

  /**
   * Force reset service status (for testing or manual recovery)
   */
  resetServiceStatus(): void {
    this.serviceStatus = {
      isAvailable: true,
      consecutiveFailures: 0,
    };
  }

  /**
   * Check if rate limited and get wait time
   */
  getRateLimitWaitTime(): number {
    if (!this.serviceStatus.rateLimitInfo?.isRateLimited) {
      return 0;
    }

    const resetTime = this.serviceStatus.rateLimitInfo.resetTime;
    if (!resetTime) {
      return 0;
    }

    const waitTime = Math.max(0, Math.ceil((resetTime.getTime() - Date.now()) / 1000));
    return waitTime;
  }
}

// Export singleton instance
export const groqService = new GroqService();