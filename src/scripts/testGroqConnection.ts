#!/usr/bin/env tsx

import { groqService } from '../services/ai/groqService';

async function testGroqConnection() {
  console.log('Testing Groq API connection...');
  
  try {
    // Check if service is available
    console.log('Service available:', groqService.isAvailable());
    
    if (!groqService.isAvailable()) {
      console.error('❌ Groq service is not available. Please check your GROQ_API_KEY in .env file');
      return;
    }
    
    // Test basic connection
    console.log('Testing connection...');
    const connectionTest = await groqService.testConnection();
    
    if (connectionTest) {
      console.log('✅ Connection test successful');
    } else {
      console.log('❌ Connection test failed');
      return;
    }
    
    // Test text enhancement
    console.log('\nTesting text enhancement...');
    const testRequest = {
      content: 'We need someone to help with front desk work.',
      type: 'job-description' as const,
    };
    
    console.log('Original text:', testRequest.content);
    console.log('Enhanced text:');
    
    let enhancedText = '';
    for await (const chunk of groqService.enhanceText(testRequest)) {
      process.stdout.write(chunk);
      enhancedText += chunk;
    }
    
    console.log('\n\n✅ Text enhancement test completed successfully');
    console.log('Service configuration:', groqService.getConfig());
    
  } catch (error) {
    console.error('❌ Test failed:', error instanceof Error ? error.message : error);
  }
}

// Run the test
testGroqConnection().catch(console.error);