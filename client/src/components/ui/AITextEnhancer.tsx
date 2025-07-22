import React, { useState, useRef, useCallback, useEffect } from 'react';
import { cn } from '../../utils/cn';
import { MagicButton } from './MagicButton';
import { StreamingDisplay } from './StreamingDisplay';
import { useToast } from '../../hooks/useToast';

export type EnhancementType = 'job-description' | 'requirements' | 'benefits';

export interface AITextEnhancerProps {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
  enhancementType: EnhancementType;
  className?: string;
  label?: string;
  error?: string;
  helperText?: string;
  disabled?: boolean;
  rows?: number;
  maxLength?: number;
  showMagicButton?: boolean;
  debounceMs?: number;
  context?: {
    title?: string;
    department?: string;
    position?: string;
    salaryRange?: string;
  };
  onEnhancementStart?: () => void;
  onEnhancementComplete?: (originalText: string, enhancedText: string) => void;
  onEnhancementError?: (error: Error) => void;
}

interface EnhancementState {
  isEnhancing: boolean;
  originalContent: string;
  error: string | null;
  errorType: string | null;
  retryCount: number;
  isRetrying: boolean;
  rateLimitWaitTime: number;
  serviceUnavailable: boolean;
  hasBackup: boolean;
  backupContent: string;
}

export const AITextEnhancer: React.FC<AITextEnhancerProps> = ({
  value,
  onChange,
  placeholder,
  enhancementType,
  className,
  label,
  error,
  helperText,
  disabled = false,
  rows = 4,
  maxLength,
  showMagicButton = true,
  debounceMs = 300,
  context,
  onEnhancementStart,
  onEnhancementComplete,
  onEnhancementError,
}) => {
  const [enhancementState, setEnhancementState] = useState<EnhancementState>({
    isEnhancing: false,
    originalContent: '',
    error: null,
    errorType: null,
    retryCount: 0,
    isRetrying: false,
    rateLimitWaitTime: 0,
    serviceUnavailable: false,
    hasBackup: false,
    backupContent: '',
  });

  const [showMagicBtn, setShowMagicBtn] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const debounceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const inputId = `ai-text-enhancer-${Math.random().toString(36).substring(2, 11)}`;
  const { showToast } = useToast();

  // Debounced magic button visibility logic
  const updateMagicButtonVisibility = useCallback(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    debounceTimeoutRef.current = setTimeout(() => {
      const shouldShow = showMagicButton &&
        !disabled &&
        value.trim().length > 0 &&
        value.trim().length >= 10 && // Minimum content length for enhancement
        !enhancementState.isEnhancing &&
        !enhancementState.serviceUnavailable;
      setShowMagicBtn(shouldShow);
    }, debounceMs);
  }, [value, showMagicButton, disabled, enhancementState.isEnhancing, enhancementState.serviceUnavailable, debounceMs]);

  // Update magic button visibility when value changes
  useEffect(() => {
    updateMagicButtonVisibility();
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [updateMagicButtonVisibility]);

  // AI enhancement function with proper error handling
  const enhanceTextWithAI = useCallback(async (text: string, type: EnhancementType): Promise<AsyncGenerator<string>> => {
    const response = await fetch('/api/ai/enhance', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: text,
        type: type,
        context: context,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const error = new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
      error.name = errorData.type || 'APIError';
      throw error;
    }

    if (!response.body) {
      throw new Error('No response body received');
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    async function* streamGenerator(): AsyncGenerator<string> {
      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data === '[DONE]') {
                return;
              }
              try {
                const parsed = JSON.parse(data);
                if (parsed.content) {
                  yield parsed.content;
                }
                if (parsed.error) {
                  const error = new Error(parsed.error);
                  error.name = parsed.errorType || 'StreamError';
                  throw error;
                }
              } catch (e) {
                if (e instanceof Error && e.name !== 'SyntaxError') {
                  throw e;
                }
                // Ignore JSON parse errors for malformed chunks
              }
            }
          }
        }
      } finally {
        reader.releaseLock();
      }
    }

    return streamGenerator();
  }, [context]);

  // Handle AI enhancement trigger with retry logic - auto-populate in textbox
  const handleEnhanceText = useCallback(async (isRetry: boolean = false) => {
    if (!value.trim() || (enhancementState.isEnhancing && !isRetry)) return;

    try {
      setEnhancementState(prev => ({
        ...prev,
        isEnhancing: true,
        originalContent: value,
        error: null,
        errorType: null,
        isRetrying: isRetry,
        retryCount: isRetry ? prev.retryCount + 1 : 0,
        serviceUnavailable: false,
        hasBackup: !isRetry ? true : prev.hasBackup,
        backupContent: !isRetry ? value : prev.backupContent,
      }));

      onEnhancementStart?.();

      // Call AI enhancement service
      const streamGenerator = await enhanceTextWithAI(value.trim(), enhancementType);
      let enhancedText = '';

      // Process streaming response and update textbox directly
      for await (const chunk of streamGenerator) {
        enhancedText += chunk;
        // Update the textbox content directly as we stream
        onChange(enhancedText);
      }

      // Show success notification
      showToast('Text enhanced successfully!', 'success');

      setEnhancementState(prev => ({
        ...prev,
        isEnhancing: false,
        isRetrying: false,
      }));

      onEnhancementComplete?.(value, enhancedText);

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Enhancement failed';
      const errorType = error instanceof Error ? error.name : 'UnknownError';

      console.error('Enhancement error:', error);

      // Handle specific error types
      let shouldShowRetry = true;
      let serviceUnavailable = false;
      let rateLimitWaitTime = 0;

      if (errorType === 'RateLimitError') {
        // Extract wait time from error message
        const waitTimeMatch = errorMessage.match(/(\d+)\s+seconds?/);
        rateLimitWaitTime = waitTimeMatch ? parseInt(waitTimeMatch[1]) : 60;
        shouldShowRetry = false; // Don't show retry immediately for rate limits
      } else if (errorType === 'ServiceUnavailableError' || errorType === 'ServiceDisabledError') {
        serviceUnavailable = true;
        shouldShowRetry = false;
      } else if (errorType === 'AuthenticationError' || errorType === 'ModelNotFoundError') {
        shouldShowRetry = false; // Don't retry for configuration errors
        serviceUnavailable = true;
      }

      setEnhancementState(prev => ({
        ...prev,
        isEnhancing: false,
        isRetrying: false,
        error: errorMessage,
        errorType,
        rateLimitWaitTime,
        serviceUnavailable,
      }));

      onEnhancementError?.(error instanceof Error ? error : new Error(errorMessage));

      // Show error notification based on error type
      if (errorType === 'RateLimitError') {
        showToast(`Rate limit reached. Retrying in ${rateLimitWaitTime} seconds...`, 'warning');
      } else if (errorType === 'NetworkError') {
        showToast('Network error. Please check your connection and try again.', 'error');
      } else if (errorType === 'ServiceUnavailableError') {
        showToast('AI service is temporarily unavailable. Please try again later.', 'error');
      } else if (errorType === 'AuthenticationError') {
        showToast('AI service configuration error. Please contact support.', 'error');
      } else if (!isRetry) {
        // Only show generic error on first attempt, not retries
        showToast('Enhancement failed. Please try again.', 'error');
      }
    }
  }, [value, enhancementType, enhancementState.isEnhancing, enhancementState.retryCount, onEnhancementStart, onEnhancementError, enhanceTextWithAI, showToast]);

  // Handle retry with delay
  const handleRetry = useCallback(async () => {
    if (enhancementState.rateLimitWaitTime > 0) {
      // Show countdown for rate limit
      let remainingTime = enhancementState.rateLimitWaitTime;
      const countdownInterval = setInterval(() => {
        remainingTime -= 1;
        setEnhancementState(prev => ({
          ...prev,
          rateLimitWaitTime: remainingTime,
        }));

        if (remainingTime <= 0) {
          clearInterval(countdownInterval);
          handleEnhanceText(true);
        }
      }, 1000);
    } else {
      // Immediate retry for other errors
      await handleEnhanceText(true);
    }
  }, [enhancementState.rateLimitWaitTime, handleEnhanceText]);



  // Handle backup restoration
  const handleRestoreBackup = useCallback(() => {
    if (enhancementState.hasBackup && enhancementState.backupContent) {
      onChange(enhancementState.backupContent);

      showToast('Original text restored successfully.', 'success');

      setEnhancementState(prev => ({
        ...prev,
        hasBackup: false,
        backupContent: '',
      }));
    }
  }, [enhancementState.hasBackup, enhancementState.backupContent, onChange, showToast]);

  // Handle enhancement feedback
  const handleEnhancementFeedback = useCallback((rating: 'positive' | 'negative', comment?: string) => {
    // Send feedback to analytics or feedback service
    console.log('Enhancement feedback:', {
      rating,
      comment,
      enhancementType,
      originalLength: enhancementState.originalContent.length,
      enhancedLength: enhancementState.enhancedContent.length,
      timestamp: new Date().toISOString()
    });

    // Show feedback confirmation
    showToast(`Thank you for your feedback! Your ${rating === 'positive' ? 'positive' : 'constructive'} input helps us improve.`, 'success');

    // You can implement actual feedback submission here
    // For example: submitFeedback({ rating, comment, type: enhancementType });
  }, [enhancementType, enhancementState.originalContent, enhancementState.enhancedContent, showToast]);

  // Handle textarea input change
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newValue = e.target.value;
    if (maxLength && newValue.length > maxLength) return;

    onChange(newValue);

    // Clear backup if user manually edits text significantly after AI enhancement
    if (enhancementState.hasBackup && enhancementState.backupContent) {
      const changeRatio = Math.abs(newValue.length - enhancementState.backupContent.length) / Math.max(enhancementState.backupContent.length, 1);
      if (changeRatio > 0.3) { // If more than 30% change in length, clear backup
        setEnhancementState(prev => ({
          ...prev,
          hasBackup: false,
          backupContent: '',
        }));
      }
    }
  }, [onChange, maxLength, enhancementState.hasBackup, enhancementState.backupContent]);

  // Auto-resize textarea
  const autoResizeTextarea = useCallback(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, []);

  useEffect(() => {
    autoResizeTextarea();
  }, [value, autoResizeTextarea]);

  // Base textarea classes
  const textareaClasses = cn(
    'block w-full px-3 py-2 text-sm border rounded-lg placeholder-gray-400 focus:outline-none focus:ring-2 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500 transition-colors duration-200 resize-none overflow-hidden',
    error
      ? 'border-error-300 focus:ring-error-500'
      : 'border-gray-300 focus:ring-primary-500',
    showMagicBtn ? 'pr-12 pb-12' : 'pr-3', // Add padding for magic button in bottom-right
    className
  );

  return (
    <div className="w-full">
      {/* Label */}
      {label && (
        <label htmlFor={inputId} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}

      {/* Textarea Container */}
      <div className="relative">
        <textarea
          ref={textareaRef}
          id={inputId}
          value={value}
          onChange={handleInputChange}
          placeholder={enhancementState.isEnhancing ? "✨ AI is enhancing your text..." : placeholder}
          disabled={disabled || enhancementState.isEnhancing}
          rows={rows}
          className={cn(
            textareaClasses,
            enhancementState.isEnhancing && "bg-blue-50 border-blue-300"
          )}
          style={{ minHeight: `${rows * 1.5}rem` }}
        />

        {/* Magic Button */}
        {(showMagicBtn || enhancementState.isEnhancing) && (
          <MagicButton
            onClick={() => handleEnhanceText(false)}
            loading={enhancementState.isEnhancing}
            disabled={disabled || enhancementState.isEnhancing}
            variant="compact"
            size="md"
            className="animate-in fade-in-0 zoom-in-95 duration-200"
          />
        )}

        {/* Character Count */}
        {maxLength && (
          <div className={cn(
            "absolute text-xs text-gray-400",
            showMagicBtn ? "bottom-2 right-12" : "bottom-2 right-2"
          )}>
            {value.length}/{maxLength}
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <p className="mt-1 text-sm text-error-600">{error}</p>
      )}

      {/* Helper Text */}
      {helperText && !error && (
        <p className="mt-1 text-sm text-gray-500">{helperText}</p>
      )}

      {/* Subtle Backup Restoration - only show if text was actually enhanced and changed significantly */}
      {enhancementState.hasBackup &&
        enhancementState.backupContent &&
        value !== enhancementState.backupContent &&
        value.length > enhancementState.backupContent.length * 1.2 && (
          <div className="mt-2 flex items-center justify-between text-xs text-gray-500 bg-gray-50 px-3 py-2 rounded-md">
            <span>Text was enhanced</span>
            <button
              onClick={handleRestoreBackup}
              className="text-blue-600 hover:text-blue-800 font-medium transition-colors duration-200"
            >
              Restore original
            </button>
          </div>
        )}

      {/* Enhancement Error with Retry Options */}
      {enhancementState.error && (
        <div className="mt-2 p-3 bg-error-50 border border-error-200 rounded-lg">
          <div className="flex items-start space-x-2">
            <div className="flex-shrink-0 mt-0.5">
              <svg className="w-4 h-4 text-error-500" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm text-error-800 font-medium">
                {enhancementState.errorType === 'RateLimitError' && 'Rate Limit Exceeded'}
                {enhancementState.errorType === 'ServiceUnavailableError' && 'Service Unavailable'}
                {enhancementState.errorType === 'ServiceDisabledError' && 'Service Temporarily Disabled'}
                {enhancementState.errorType === 'AuthenticationError' && 'Configuration Error'}
                {enhancementState.errorType === 'NetworkError' && 'Network Error'}
                {enhancementState.errorType === 'TimeoutError' && 'Request Timeout'}
                {!['RateLimitError', 'ServiceUnavailableError', 'ServiceDisabledError', 'AuthenticationError', 'NetworkError', 'TimeoutError'].includes(enhancementState.errorType || '') && 'Enhancement Failed'}
              </p>
              <p className="text-sm text-error-700 mt-1">
                {enhancementState.error}
              </p>

              {/* Rate Limit Countdown */}
              {enhancementState.errorType === 'RateLimitError' && enhancementState.rateLimitWaitTime > 0 && (
                <p className="text-xs text-error-600 mt-2">
                  Retrying automatically in {enhancementState.rateLimitWaitTime} seconds...
                </p>
              )}

              {/* Retry Button */}
              {!enhancementState.serviceUnavailable && enhancementState.errorType !== 'AuthenticationError' && enhancementState.errorType !== 'ModelNotFoundError' && (
                <div className="mt-3 flex items-center space-x-2">
                  <button
                    onClick={handleRetry}
                    disabled={enhancementState.isRetrying || enhancementState.rateLimitWaitTime > 0}
                    className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-error-700 bg-error-100 border border-error-300 rounded-md hover:bg-error-200 focus:outline-none focus:ring-2 focus:ring-error-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
                  >
                    {enhancementState.isRetrying ? (
                      <>
                        <svg className="w-3 h-3 mr-1 animate-spin" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Retrying...
                      </>
                    ) : (
                      <>
                        <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Try Again
                      </>
                    )}
                  </button>
                  {enhancementState.retryCount > 0 && (
                    <span className="text-xs text-error-600">
                      Attempt {enhancementState.retryCount + 1}
                    </span>
                  )}
                </div>
              )}

              {/* Service Unavailable Message */}
              {enhancementState.serviceUnavailable && (
                <div className="mt-3 p-2 bg-warning-50 border border-warning-200 rounded-md">
                  <p className="text-xs text-warning-800">
                    {enhancementState.errorType === 'AuthenticationError'
                      ? 'Please contact your administrator to configure the AI service.'
                      : 'The AI enhancement service is temporarily unavailable. Please try again later.'
                    }
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}


    </div>
  );
};

export default AITextEnhancer;