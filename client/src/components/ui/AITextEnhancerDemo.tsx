import React, { useState } from 'react';
import { AITextEnhancer } from './AITextEnhancer';
import { Card, CardContent, CardHeader, CardTitle } from './Card';

export const AITextEnhancerDemo: React.FC = () => {
  const [jobDescription, setJobDescription] = useState('');
  const [requirements, setRequirements] = useState('');
  const [benefits, setBenefits] = useState('');

  const handleEnhancementComplete = (originalText: string, enhancedText: string) => {
    console.log('Enhancement completed:', { originalText, enhancedText });
  };

  const handleEnhancementError = (error: Error) => {
    console.error('Enhancement error:', error);
  };

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>AI Text Enhancement Demo</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Job Description */}
          <div>
            <AITextEnhancer
              value={jobDescription}
              onChange={setJobDescription}
              placeholder="Enter a basic job description..."
              enhancementType="job-description"
              label="Job Description"
              helperText="Write a basic description and click the magic button to enhance it with AI"
              rows={4}
              onEnhancementComplete={handleEnhancementComplete}
              onEnhancementError={handleEnhancementError}
            />
          </div>

          {/* Requirements */}
          <div>
            <AITextEnhancer
              value={requirements}
              onChange={setRequirements}
              placeholder="List basic requirements..."
              enhancementType="requirements"
              label="Requirements"
              helperText="List basic requirements and let AI structure them professionally"
              rows={4}
              onEnhancementComplete={handleEnhancementComplete}
              onEnhancementError={handleEnhancementError}
            />
          </div>

          {/* Benefits */}
          <div>
            <AITextEnhancer
              value={benefits}
              onChange={setBenefits}
              placeholder="Describe benefits offered..."
              enhancementType="benefits"
              label="Benefits"
              helperText="Describe benefits and let AI present them attractively"
              rows={4}
              onEnhancementComplete={handleEnhancementComplete}
              onEnhancementError={handleEnhancementError}
            />
          </div>

          {/* Preview */}
          <div className="mt-8 p-4 bg-gray-50 rounded-lg">
            <h3 className="text-lg font-semibold mb-4">Current Content:</h3>
            <div className="space-y-4 text-sm">
              <div>
                <strong>Job Description:</strong>
                <p className="mt-1 text-gray-700">{jobDescription || 'No content yet'}</p>
              </div>
              <div>
                <strong>Requirements:</strong>
                <p className="mt-1 text-gray-700">{requirements || 'No content yet'}</p>
              </div>
              <div>
                <strong>Benefits:</strong>
                <p className="mt-1 text-gray-700">{benefits || 'No content yet'}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default AITextEnhancerDemo;