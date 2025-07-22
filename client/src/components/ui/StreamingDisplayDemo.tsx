import React, { useState } from 'react';
import { StreamingDisplay } from './StreamingDisplay';
import { Button } from './Button';

export const StreamingDisplayDemo: React.FC = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [content, setContent] = useState('');

  const sampleContent = `This is a sample AI-enhanced job description that demonstrates the streaming text display functionality. 

The position requires excellent communication skills, attention to detail, and the ability to work in a fast-paced environment. We offer competitive compensation, comprehensive benefits, and opportunities for professional growth.

Key responsibilities include:
• Managing daily operations
• Coordinating with team members
• Ensuring quality standards
• Maintaining accurate records

We are looking for someone who is passionate about hospitality and committed to providing exceptional service to our guests.`;

  const handleStartDemo = () => {
    setContent(sampleContent);
    setIsStreaming(true);
  };

  const handleComplete = () => {
    setIsStreaming(false);
  };

  const handleAccept = (enhancedContent: string) => {
    console.log('Content accepted:', enhancedContent);
    alert('Enhanced content accepted!');
  };

  const handleReject = () => {
    console.log('Content rejected');
    alert('Enhanced content rejected!');
    setContent('');
    setIsStreaming(false);
  };

  const handleReset = () => {
    setContent('');
    setIsStreaming(false);
  };

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          AI Text Enhancement Demo
        </h1>
        <p className="text-gray-600 mb-6">
          Experience the streaming text display with typewriter effect
        </p>
        
        <div className="flex justify-center space-x-4">
          <Button
            onClick={handleStartDemo}
            disabled={isStreaming}
            variant="primary"
          >
            Start Streaming Demo
          </Button>
          <Button
            onClick={handleReset}
            variant="secondary"
          >
            Reset
          </Button>
        </div>
      </div>

      {(content || isStreaming) && (
        <StreamingDisplay
          content={content}
          isStreaming={isStreaming}
          onComplete={handleComplete}
          onAccept={handleAccept}
          onReject={handleReject}
          streamingSpeed={12} // Faster for demo
          showProgress={true}
          enableReconnection={true}
        />
      )}

      <div className="bg-gray-50 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4">Features Demonstrated:</h2>
        <ul className="space-y-2 text-gray-700">
          <li>• <strong>Word-by-word streaming:</strong> Text appears progressively with natural timing</li>
          <li>• <strong>Animated cursor:</strong> Blinking cursor shows current position</li>
          <li>• <strong>Progress tracking:</strong> Real-time word count and progress bar</li>
          <li>• <strong>Pause/Resume:</strong> User can control the streaming process</li>
          <li>• <strong>Accept/Reject:</strong> Clear actions for user decision</li>
          <li>• <strong>Responsive design:</strong> Works on mobile and desktop</li>
          <li>• <strong>Error handling:</strong> Stream interruption detection and recovery</li>
          <li>• <strong>Smooth animations:</strong> Natural timing with punctuation delays</li>
        </ul>
      </div>
    </div>
  );
};