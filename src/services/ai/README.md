# AI Services - Groq Integration

This module provides AI-powered text enhancement capabilities using the Groq API.

## Setup

### 1. Install Dependencies

The Groq SDK is already installed as part of the project dependencies.

### 2. Environment Configuration

Add the following environment variables to your `.env` file:

```env
# Groq AI Configuration
GROQ_API_KEY=your-groq-api-key-here
GROQ_MODEL=llama3-8b-8192
GROQ_MAX_TOKENS=1024
GROQ_TEMPERATURE=0.7
GROQ_STREAMING_ENABLED=true
```

### 3. Get a Groq API Key

1. Visit [Groq Console](https://console.groq.com/)
2. Sign up or log in to your account
3. Navigate to API Keys section
4. Create a new API key
5. Copy the key to your `.env` file

## Usage

### Basic Usage

```typescript
import { groqService } from './services/ai/groqService';

// Test connection
const isConnected = await groqService.testConnection();

// Enhance text with streaming
const request = {
  content: 'We need someone to help with front desk work.',
  type: 'job-description' as const,
};

for await (const chunk of groqService.enhanceText(request)) {
  console.log(chunk); // Streams text word by word
}
```

### Enhancement Types

The service supports three types of text enhancement:

- `job-description`: Enhances job descriptions for clarity and professionalism
- `requirements`: Structures job requirements into clear bullet points
- `benefits`: Makes benefits packages more appealing and well-organized

### Error Handling

The service includes comprehensive error handling for:

- Missing or invalid API keys
- Rate limiting
- Network errors
- Content validation (empty or too long)
- Model availability issues

## Testing

### Unit Tests

```bash
npm test -- src/services/ai/__tests__/groqService.test.ts
```

### Integration Tests

```bash
npm test -- src/services/ai/__tests__/groqService.integration.test.ts
```

### Connection Test

```bash
npm run groq:test
```

## Configuration

The service configuration is managed through the environment configuration system:

```typescript
// Get current configuration (without API key)
const config = groqService.getConfig();
console.log(config);
// {
//   model: 'llama3-8b-8192',
//   maxTokens: 1024,
//   temperature: 0.7,
//   streamingEnabled: true
// }
```

## Features

- **Streaming Support**: Real-time text generation with word-by-word streaming
- **Context-Aware Prompts**: Different prompts optimized for each enhancement type
- **Error Recovery**: Graceful handling of API failures and rate limiting
- **Configuration Management**: Centralized configuration through environment variables
- **Connection Testing**: Built-in connection testing and health checks
- **Type Safety**: Full TypeScript support with proper interfaces

## Security

- API keys are never logged or exposed in responses
- All sensitive configuration is managed through environment variables
- Input validation prevents malicious content injection
- Rate limiting and error handling prevent abuse

## Performance

- Streaming responses for better user experience
- Request validation to prevent unnecessary API calls
- Configurable token limits and temperature settings
- Efficient async generator pattern for memory management