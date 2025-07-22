
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { cn } from '../../utils/cn';
import { Button } from './Button';
import { Card, CardContent } from './Card';
import { Icon } from './Icon';

export interface StreamingDisplayProps {
  content: string;
  isStreaming: boolean;
  onComplete: () => void;
  onAccept: (content: string) => void;
  onReject: () => void;
  className?: string;
  streamingSpeed?: number; // Words per second
  showProgress?: boolean;
  onStreamInterrupted?: () => void;
  onStreamReconnected?: () => void;
  enableReconnection?: boolean;
  originalContent?: string;
  showComparison?: boolean;
  onFeedback?: (rating: 'positive' | 'negative', comment?: string) => void;
  enableFeedback?: boolean;
}

interface StreamingState {
  displayedText: string;
  currentWordIndex: number;
  isComplete: boolean;
  isPaused: boolean;
  isInterrupted: boolean;
  isReconnecting: boolean;
  animationPhase: 'idle' | 'streaming' | 'paused' | 'complete' | 'error';
  showFeedbackForm: boolean;
  feedbackRating: 'positive' | 'negative' | null;
  feedbackComment: string;
  showComparison: boolean;
}

export const StreamingDisplay: React.FC<StreamingDisplayProps> = ({
  content,
  isStreaming,
  onComplete,
  onAccept,
  onReject,
  className,
  streamingSpeed = 8, // 8 words per second
  showProgress = true,
  onStreamInterrupted,
  onStreamReconnected,
  enableReconnection = true,
  originalContent,
  showComparison = false,
  onFeedback,
  enableFeedback = false,
}) => {
  const [streamingState, setStreamingState] = useState<StreamingState>({
    displayedText: '',
    currentWordIndex: 0,
    isComplete: false,
    isPaused: false,
    isInterrupted: false,
    isReconnecting: false,
    animationPhase: 'idle',
    showFeedbackForm: false,
    feedbackRating: null,
    feedbackComment: '',
    showComparison: showComparison && !!originalContent,
  });

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectionTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const lastUpdateTimeRef = useRef<number>(Date.now());
  const words = content.split(/(\s+)/); // Split by whitespace but keep the whitespace
  const totalWords = words.filter(word => word.trim().length > 0).length;

  // Calculate streaming interval based on speed with smooth animation timing
  const baseStreamingInterval = 1000 / streamingSpeed;
  const getStreamingInterval = (wordIndex: number) => {
    // Add slight variation to make it feel more natural
    const variation = Math.random() * 0.3 + 0.85; // 0.85 to 1.15 multiplier
    // Slow down slightly for punctuation
    const currentWord = words[wordIndex] || '';
    const hasPunctuation = /[.!?;:]/.test(currentWord);
    const punctuationDelay = hasPunctuation ? 1.5 : 1;

    return baseStreamingInterval * variation * punctuationDelay;
  };

  // Stream interruption detection
  const detectStreamInterruption = useCallback(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdateTimeRef.current;
    const expectedInterval = baseStreamingInterval * 3; // Allow 3x normal interval before considering interrupted

    if (timeSinceLastUpdate > expectedInterval && isStreaming && !streamingState.isPaused && !streamingState.isComplete) {
      setStreamingState(prev => ({
        ...prev,
        isInterrupted: true,
        animationPhase: 'error',
      }));
      onStreamInterrupted?.();
      return true;
    }
    return false;
  }, [baseStreamingInterval, isStreaming, streamingState.isPaused, streamingState.isComplete, onStreamInterrupted]);

  // Reconnection logic
  const attemptReconnection = useCallback(() => {
    if (!enableReconnection || !streamingState.isInterrupted) return;

    setStreamingState(prev => ({
      ...prev,
      isReconnecting: true,
    }));

    reconnectionTimeoutRef.current = setTimeout(() => {
      setStreamingState(prev => ({
        ...prev,
        isInterrupted: false,
        isReconnecting: false,
        animationPhase: 'streaming',
      }));
      onStreamReconnected?.();
    }, 2000); // 2 second reconnection delay
  }, [enableReconnection, streamingState.isInterrupted, onStreamReconnected]);

  const startStreaming = useCallback(() => {
    if (!isStreaming || streamingState.isComplete || streamingState.isPaused || streamingState.isInterrupted) {
      return;
    }

    setStreamingState(prev => ({ ...prev, animationPhase: 'streaming' }));

    const streamNextWord = () => {
      setStreamingState(prev => {
        if (prev.currentWordIndex >= words.length) {
          onComplete();
          return {
            ...prev,
            isComplete: true,
            animationPhase: 'complete',
          };
        }

        const nextIndex = prev.currentWordIndex + 1;
        const newDisplayedText = words.slice(0, nextIndex).join('');
        lastUpdateTimeRef.current = Date.now();

        // Schedule next word with dynamic timing
        const nextInterval = getStreamingInterval(nextIndex);
        intervalRef.current = setTimeout(streamNextWord, nextInterval);

        return {
          ...prev,
          displayedText: newDisplayedText,
          currentWordIndex: nextIndex,
        };
      });
    };

    // Start the streaming process
    const initialInterval = getStreamingInterval(streamingState.currentWordIndex);
    intervalRef.current = setTimeout(streamNextWord, initialInterval);

    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
    };
  }, [isStreaming, streamingState.isComplete, streamingState.isPaused, streamingState.isInterrupted, streamingState.currentWordIndex, words, onComplete, getStreamingInterval]);

  // Start streaming when component mounts or streaming resumes
  useEffect(() => {
    if (isStreaming && !streamingState.isPaused && !streamingState.isInterrupted) {
      const cleanup = startStreaming();
      return cleanup;
    }
  }, [startStreaming, isStreaming, streamingState.isPaused, streamingState.isInterrupted]);

  // Stream interruption detection interval
  useEffect(() => {
    if (!isStreaming || streamingState.isComplete) return;

    const detectionInterval = setInterval(detectStreamInterruption, 1000);
    return () => clearInterval(detectionInterval);
  }, [detectStreamInterruption, isStreaming, streamingState.isComplete]);

  // Auto-reconnection attempt
  useEffect(() => {
    if (streamingState.isInterrupted && enableReconnection && !streamingState.isReconnecting) {
      const reconnectionDelay = setTimeout(attemptReconnection, 1000);
      return () => clearTimeout(reconnectionDelay);
    }
  }, [streamingState.isInterrupted, enableReconnection, streamingState.isReconnecting, attemptReconnection]);

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearTimeout(intervalRef.current);
      }
      if (reconnectionTimeoutRef.current) {
        clearTimeout(reconnectionTimeoutRef.current);
      }
    };
  }, []);

  // Reset state when content changes
  useEffect(() => {
    setStreamingState({
      displayedText: '',
      currentWordIndex: 0,
      isComplete: false,
      isPaused: false,
      isInterrupted: false,
      isReconnecting: false,
      animationPhase: 'idle',
      showFeedbackForm: false,
      feedbackRating: null,
      feedbackComment: '',
      showComparison: showComparison && !!originalContent,
    });
    lastUpdateTimeRef.current = Date.now();
  }, [content, showComparison, originalContent]);

  const handlePauseResume = () => {
    setStreamingState(prev => ({
      ...prev,
      isPaused: !prev.isPaused,
      animationPhase: prev.isPaused ? 'streaming' : 'paused',
    }));
  };

  const handleAccept = () => {
    if (enableFeedback && !streamingState.showFeedbackForm) {
      // Show feedback form before accepting
      setStreamingState(prev => ({ ...prev, showFeedbackForm: true }));
    } else {
      onAccept(content);
    }
  };

  const handleReject = () => {
    onReject();
  };

  const handleFeedbackSubmit = () => {
    if (streamingState.feedbackRating && onFeedback) {
      onFeedback(streamingState.feedbackRating, streamingState.feedbackComment || undefined);
    }
    onAccept(content);
  };

  const handleFeedbackCancel = () => {
    setStreamingState(prev => ({
      ...prev,
      showFeedbackForm: false,
      feedbackRating: null,
      feedbackComment: '',
    }));
  };

  const toggleComparison = () => {
    setStreamingState(prev => ({ ...prev, showComparison: !prev.showComparison }));
  };

  const handleRetry = () => {
    setStreamingState(prev => ({
      ...prev,
      isInterrupted: false,
      isReconnecting: false,
      animationPhase: 'streaming',
    }));
  };

  const progressPercentage = totalWords > 0 ? Math.round((streamingState.currentWordIndex / words.length) * 100) : 0;
  const wordsDisplayed = words.slice(0, streamingState.currentWordIndex).filter(word => word.trim().length > 0).length;

  // Animation classes based on current phase
  const getAnimationClasses = () => {
    switch (streamingState.animationPhase) {
      case 'streaming':
        return 'animate-pulse';
      case 'paused':
        return 'opacity-75';
      case 'complete':
        return 'animate-none';
      case 'error':
        return 'animate-pulse border-error-200 bg-error-50';
      default:
        return '';
    }
  };

  return (
    <Card className={cn('w-full max-w-4xl mx-auto transition-all duration-300', className)}>
      <CardContent className="space-y-4 p-4 sm:p-6">
        {/* Progress Header */}
        {showProgress && (
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 text-sm text-gray-600">
            <div className="flex items-center space-x-2">
              {/* Streaming Status */}
              {isStreaming && !streamingState.isComplete && !streamingState.isInterrupted && (
                <div className="flex items-center space-x-1">
                  <div className={cn(
                    "w-2 h-2 rounded-full transition-all duration-300",
                    streamingState.isPaused ? "bg-warning-500" : "bg-primary-500 animate-pulse"
                  )} />
                  <span className="hidden sm:inline">
                    {streamingState.isPaused ? 'Paused' : 'AI is writing...'}
                  </span>
                  <span className="sm:hidden">
                    {streamingState.isPaused ? 'Paused' : 'Writing...'}
                  </span>
                </div>
              )}

              {/* Interruption Status */}
              {streamingState.isInterrupted && (
                <div className="flex items-center space-x-1 text-error-600">
                  <Icon name="AlertCircle" className="w-4 h-4" />
                  <span className="hidden sm:inline">
                    {streamingState.isReconnecting ? 'Reconnecting...' : 'Connection lost'}
                  </span>
                  <span className="sm:hidden">
                    {streamingState.isReconnecting ? 'Reconnecting' : 'Disconnected'}
                  </span>
                </div>
              )}

              {/* Complete Status */}
              {streamingState.isComplete && (
                <div className="flex items-center space-x-1 text-success-600">
                  <Icon name="CheckCircle" className="w-4 h-4" />
                  <span>Complete</span>
                </div>
              )}
            </div>

            {/* Progress Bar */}
            <div className="flex items-center space-x-2 min-w-0">
              <span className="text-xs sm:text-sm whitespace-nowrap">
                {wordsDisplayed} / {totalWords} words
              </span>
              <div className="w-16 sm:w-20 h-2 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary-500 transition-all duration-500 ease-out"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Comparison Toggle */}
        {originalContent && streamingState.isComplete && (
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Enhanced Text</h3>
            <button
              onClick={toggleComparison}
              className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-primary-700 bg-primary-50 border border-primary-200 rounded-md hover:bg-primary-100 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:ring-offset-2 transition-colors duration-200"
            >
              <Icon name={streamingState.showComparison ? "EyeOff" : "Eye"} className="w-4 h-4 mr-1.5" />
              {streamingState.showComparison ? 'Hide' : 'Show'} Comparison
            </button>
          </div>
        )}

        {/* Comparison View */}
        {streamingState.showComparison && originalContent && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
            {/* Original Text */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 flex items-center">
                <Icon name="FileText" className="w-4 h-4 mr-1.5" />
                Original Text
              </h4>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                <div className="prose prose-gray prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-gray-700 leading-relaxed text-sm">
                    {originalContent}
                  </div>
                </div>
              </div>
            </div>

            {/* Enhanced Text */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-gray-700 flex items-center">
                <Icon name="Wand2" className="w-4 h-4 mr-1.5" />
                Enhanced Text
              </h4>
              <div className="p-4 bg-primary-50 border border-primary-200 rounded-lg">
                <div className="prose prose-gray prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-gray-900 leading-relaxed text-sm">
                    {content}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Streaming Text Display */}
        {!streamingState.showComparison && (
          <div className={cn(
            "relative min-h-[200px] sm:min-h-[250px] p-4 sm:p-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-200 transition-all duration-300",
            getAnimationClasses()
          )}>
            <div className="prose prose-gray max-w-none">
              <div className="whitespace-pre-wrap text-gray-900 leading-relaxed text-sm sm:text-base">
                {streamingState.displayedText}
                {/* Animated cursor */}
                {isStreaming && !streamingState.isComplete && !streamingState.isPaused && !streamingState.isInterrupted && (
                  <span className="inline-block w-0.5 h-4 sm:h-5 bg-primary-500 animate-pulse ml-1 transition-all duration-200" />
                )}
                {/* Paused cursor */}
                {streamingState.isPaused && (
                  <span className="inline-block w-0.5 h-4 sm:h-5 bg-warning-500 ml-1" />
                )}
              </div>
            </div>

            {/* Streaming Controls */}
            <div className="absolute top-3 sm:top-4 right-3 sm:right-4 flex items-center space-x-2">
              {/* Pause/Resume Button */}
              {isStreaming && !streamingState.isComplete && !streamingState.isInterrupted && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handlePauseResume}
                  className="text-gray-500 hover:text-gray-700 p-1 sm:p-2"
                  title={streamingState.isPaused ? 'Resume' : 'Pause'}
                >
                  <Icon name={streamingState.isPaused ? "Play" : "Pause"} className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              )}

              {/* Retry Button */}
              {streamingState.isInterrupted && !streamingState.isReconnecting && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRetry}
                  className="text-error-500 hover:text-error-700 p-1 sm:p-2"
                  title="Retry"
                >
                  <Icon name="RefreshCw" className="w-3 h-3 sm:w-4 sm:h-4" />
                </Button>
              )}
            </div>

            {/* Reconnecting Overlay */}
            {streamingState.isReconnecting && (
              <div className="absolute inset-0 bg-white/80 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <div className="flex items-center space-x-2 text-primary-600">
                  <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
                  <span className="text-sm font-medium">Reconnecting...</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Feedback Form */}
        {streamingState.showFeedbackForm && (
          <div className="space-y-4 pt-4 border-t border-gray-200">
            <div className="bg-primary-50 border border-primary-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-primary-900 mb-3 flex items-center">
                <Icon name="MessageSquare" className="w-4 h-4 mr-1.5" />
                How was the AI enhancement?
              </h4>

              {/* Rating Buttons */}
              <div className="flex items-center space-x-3 mb-4">
                <button
                  onClick={() => setStreamingState(prev => ({ ...prev, feedbackRating: 'positive' }))}
                  className={cn(
                    "inline-flex items-center px-3 py-2 text-sm font-medium rounded-md border transition-colors duration-200",
                    streamingState.feedbackRating === 'positive'
                      ? "bg-success-100 border-success-300 text-success-800"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <Icon name="ThumbsUp" className="w-4 h-4 mr-1.5" />
                  Helpful
                </button>
                <button
                  onClick={() => setStreamingState(prev => ({ ...prev, feedbackRating: 'negative' }))}
                  className={cn(
                    "inline-flex items-center px-3 py-2 text-sm font-medium rounded-md border transition-colors duration-200",
                    streamingState.feedbackRating === 'negative'
                      ? "bg-error-100 border-error-300 text-error-800"
                      : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
                  )}
                >
                  <Icon name="ThumbsDown" className="w-4 h-4 mr-1.5" />
                  Not Helpful
                </button>
              </div>

              {/* Optional Comment */}
              <div className="space-y-2">
                <label className="block text-xs font-medium text-gray-700">
                  Additional feedback (optional)
                </label>
                <textarea
                  value={streamingState.feedbackComment}
                  onChange={(e) => setStreamingState(prev => ({ ...prev, feedbackComment: e.target.value }))}
                  placeholder="Tell us how we can improve the AI enhancement..."
                  rows={3}
                  className="block w-full px-3 py-2 text-sm border border-gray-300 rounded-md placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
                />
              </div>

              {/* Feedback Actions */}
              <div className="flex items-center justify-end space-x-2 mt-4">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleFeedbackCancel}
                  className="text-gray-600"
                >
                  Skip
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={handleFeedbackSubmit}
                  disabled={!streamingState.feedbackRating}
                  leftIcon={<Icon name="Send" className="w-3 h-3" />}
                >
                  Submit & Accept
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {streamingState.isComplete && !streamingState.showFeedbackForm && (
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-3 pt-4 border-t border-gray-200">
            <Button
              variant="secondary"
              onClick={handleReject}
              leftIcon={<Icon name="X" className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              Reject
            </Button>
            <Button
              variant="primary"
              onClick={handleAccept}
              leftIcon={<Icon name="Check" className="w-4 h-4" />}
              className="w-full sm:w-auto"
            >
              <span className="hidden sm:inline">Accept Enhancement</span>
              <span className="sm:hidden">Accept</span>
            </Button>
          </div>
        )}

        {/* Loading State */}
        {isStreaming && streamingState.currentWordIndex === 0 && !streamingState.isInterrupted && (
          <div className="flex items-center justify-center py-8">
            <div className="flex items-center space-x-2 text-gray-500">
              <div className="w-4 h-4 border-2 border-primary-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm">Preparing enhanced text...</span>
            </div>
          </div>
        )}

        {/* Error State */}
        {streamingState.isInterrupted && !streamingState.isReconnecting && (
          <div className="flex items-center justify-center py-4">
            <div className="flex flex-col sm:flex-row items-center space-y-2 sm:space-y-0 sm:space-x-3 text-error-600">
              <div className="flex items-center space-x-2">
                <Icon name="AlertTriangle" className="w-4 h-4" />
                <span className="text-sm font-medium">Stream interrupted</span>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={handleRetry}
                leftIcon={<Icon name="RefreshCw" className="w-3 h-3" />}
                className="text-xs"
              >
                Retry
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default StreamingDisplay;