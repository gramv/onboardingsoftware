import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AITextEnhancer } from '../AITextEnhancer';

// Mock the StreamingDisplay component
jest.mock('../StreamingDisplay', () => ({
  StreamingDisplay: ({ content, onAccept, onReject }: any) => (
    <div data-testid="streaming-display">
      <div>{content}</div>
      <button onClick={() => onAccept(content)}>Accept</button>
      <button onClick={onReject}>Reject</button>
    </div>
  ),
}));

describe('AITextEnhancer', () => {
  const defaultProps = {
    value: '',
    onChange: jest.fn(),
    placeholder: 'Enter text...',
    enhancementType: 'job-description' as const,
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders textarea with placeholder', () => {
    render(<AITextEnhancer {...defaultProps} />);
    expect(screen.getByPlaceholderText('Enter text...')).toBeInTheDocument();
  });

  it('shows magic button when text is entered', async () => {
    const { rerender } = render(<AITextEnhancer {...defaultProps} />);
    
    // Initially no magic button
    expect(screen.queryByTitle('Enhance with AI')).not.toBeInTheDocument();
    
    // Add text and rerender
    rerender(<AITextEnhancer {...defaultProps} value="This is a test job description with enough content" />);
    
    // Wait for debounce and magic button to appear
    await waitFor(() => {
      expect(screen.getByTitle('Enhance with AI')).toBeInTheDocument();
    });
  });

  it('does not show magic button for short text', async () => {
    render(<AITextEnhancer {...defaultProps} value="short" />);
    
    // Wait for debounce
    await waitFor(() => {
      expect(screen.queryByTitle('Enhance with AI')).not.toBeInTheDocument();
    }, { timeout: 500 });
  });

  it('calls onChange when text is modified', () => {
    const onChange = jest.fn();
    render(<AITextEnhancer {...defaultProps} onChange={onChange} />);
    
    const textarea = screen.getByPlaceholderText('Enter text...');
    fireEvent.change(textarea, { target: { value: 'new text' } });
    
    expect(onChange).toHaveBeenCalledWith('new text');
  });

  it('shows label when provided', () => {
    render(<AITextEnhancer {...defaultProps} label="Job Description" />);
    expect(screen.getByText('Job Description')).toBeInTheDocument();
  });

  it('shows error message when provided', () => {
    render(<AITextEnhancer {...defaultProps} error="This field is required" />);
    expect(screen.getByText('This field is required')).toBeInTheDocument();
  });

  it('shows helper text when provided', () => {
    render(<AITextEnhancer {...defaultProps} helperText="Enter a detailed description" />);
    expect(screen.getByText('Enter a detailed description')).toBeInTheDocument();
  });

  it('disables magic button when disabled prop is true', async () => {
    render(<AITextEnhancer {...defaultProps} value="This is a test job description with enough content" disabled />);
    
    // Wait for debounce - magic button should not appear when disabled
    await waitFor(() => {
      expect(screen.queryByTitle('Enhance with AI')).not.toBeInTheDocument();
    }, { timeout: 500 });
  });
});