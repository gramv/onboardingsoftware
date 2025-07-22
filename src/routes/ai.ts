import { Router } from 'express';
import { groqService } from '../services/ai/groqService';
import { apiResponse } from '../utils/apiResponse';

const router = Router();

/**
 * POST /api/ai/enhance
 * Enhance text using AI with streaming response
 */
router.post('/enhance', async (req, res) => {
  try {
    const { content, type, context } = req.body;

    // Validate request
    if (!content || typeof content !== 'string') {
      return res.status(400).json(apiResponse.error('Content is required and must be a string'));
    }

    if (!type || !['job-description', 'requirements', 'benefits'].includes(type)) {
      return res.status(400).json(apiResponse.error('Type must be one of: job-description, requirements, benefits'));
    }

    // Check service availability
    if (!groqService.isAvailable()) {
      const status = groqService.getServiceStatus();
      return res.status(503).json(apiResponse.error(
        status.lastError || 'AI service is currently unavailable',
        { 
          type: 'ServiceUnavailableError',
          lastErrorTime: status.lastErrorTime,
          consecutiveFailures: status.consecutiveFailures
        }
      ));
    }

    // Check rate limiting
    const waitTime = groqService.getRateLimitWaitTime();
    if (waitTime > 0) {
      return res.status(429).json(apiResponse.error(
        `Rate limit exceeded. Please wait ${waitTime} seconds before trying again.`,
        { 
          type: 'RateLimitError',
          retryAfter: waitTime
        }
      ));
    }

    // Set up Server-Sent Events
    res.writeHead(200, {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control',
    });

    try {
      // Stream the enhanced text
      const enhancementGenerator = groqService.enhanceText({
        content: content.trim(),
        type,
        context,
      });

      for await (const chunk of enhancementGenerator) {
        const data = JSON.stringify({ content: chunk });
        res.write(`data: ${data}\n\n`);
      }

      // Send completion signal
      res.write('data: [DONE]\n\n');
      res.end();

    } catch (enhancementError) {
      console.error('Enhancement streaming error:', enhancementError);
      
      // Send error through stream
      const errorData = JSON.stringify({
        error: enhancementError instanceof Error ? enhancementError.message : 'Enhancement failed',
        errorType: enhancementError instanceof Error ? enhancementError.name : 'UnknownError'
      });
      res.write(`data: ${errorData}\n\n`);
      res.end();
    }

  } catch (error) {
    console.error('AI enhancement error:', error);
    
    // If headers haven't been sent, send JSON error
    if (!res.headersSent) {
      const errorMessage = error instanceof Error ? error.message : 'Internal server error';
      const errorType = error instanceof Error ? error.name : 'InternalError';
      
      return res.status(500).json(apiResponse.error(errorMessage, { type: errorType }));
    }
    
    // If streaming has started, send error through stream
    try {
      const errorData = JSON.stringify({
        error: error instanceof Error ? error.message : 'Internal server error',
        errorType: error instanceof Error ? error.name : 'InternalError'
      });
      res.write(`data: ${errorData}\n\n`);
      res.end();
    } catch (writeError) {
      console.error('Failed to write error to stream:', writeError);
      res.end();
    }
  }
});

/**
 * GET /api/ai/status
 * Get AI service status
 */
router.get('/status', async (req, res) => {
  try {
    const status = groqService.getServiceStatus();
    const config = groqService.getConfig();
    const queueStatus = groqService.getQueueStatus();
    const retryConfig = groqService.getRetryConfig();
    const waitTime = groqService.getRateLimitWaitTime();

    res.json(apiResponse.success({
      service: {
        isAvailable: groqService.isAvailable(),
        ...status,
      },
      config,
      queue: queueStatus,
      retry: retryConfig,
      rateLimitWaitTime: waitTime,
    }));
  } catch (error) {
    console.error('Error getting AI service status:', error);
    res.status(500).json(apiResponse.error('Failed to get service status'));
  }
});

/**
 * POST /api/ai/test-connection
 * Test connection to AI service
 */
router.post('/test-connection', async (req, res) => {
  try {
    const isConnected = await groqService.testConnection();
    const status = groqService.getServiceStatus();

    res.json(apiResponse.success({
      connected: isConnected,
      status,
    }));
  } catch (error) {
    console.error('Error testing AI service connection:', error);
    res.status(500).json(apiResponse.error('Failed to test connection'));
  }
});

/**
 * POST /api/ai/reset-status
 * Reset service status (for manual recovery)
 */
router.post('/reset-status', async (req, res) => {
  try {
    groqService.resetServiceStatus();
    const status = groqService.getServiceStatus();

    res.json(apiResponse.success({
      message: 'Service status reset successfully',
      status,
    }));
  } catch (error) {
    console.error('Error resetting AI service status:', error);
    res.status(500).json(apiResponse.error('Failed to reset service status'));
  }
});

export default router;