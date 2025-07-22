import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('3001'),
  
  // Database
  DATABASE_URL: z.string().default('postgresql://postgres:password@localhost:5432/motel_management'),
  
  // Redis
  REDIS_URL: z.string().default('redis://localhost:6379'),
  USE_MOCK_REDIS: z.string().transform(val => val === 'true').default('false'),
  
  // JWT
  JWT_SECRET: z.string().default('your-super-secret-jwt-key-change-in-production'),
  JWT_REFRESH_SECRET: z.string().default('your-super-secret-refresh-key-change-in-production'),
  JWT_EXPIRES_IN: z.string().default('15m'),
  JWT_REFRESH_EXPIRES_IN: z.string().default('7d'),
  
  // CORS
  CORS_ORIGIN: z.string().default('http://localhost:3000'),
  
  // File Upload
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE: z.string().transform(Number).default('10485760'), // 10MB
  
  // OCR
  OCR_ENABLED: z.string().transform(val => val === 'true').default('true'),
  
  // Session
  SESSION_SECRET: z.string().default('your-session-secret-change-in-production'),
  
  // Email SMTP Configuration
  SMTP_HOST: z.string().default('smtp.gmail.com'),
  SMTP_PORT: z.string().transform(Number).default('587'),
  SMTP_SECURE: z.string().transform(val => val === 'true').default('false'), // true for 465, false for other ports
  SMTP_USER: z.string().default(''),
  SMTP_PASS: z.string().default(''),
  FROM_EMAIL: z.string().default('noreply@motelmanagement.com'),
  FROM_NAME: z.string().default('Motel Management System'),
  
  // Groq AI Configuration
  GROQ_API_KEY: z.string().default(''),
  GROQ_MODEL: z.string().default('deepseek-r1-distill-llama-70b'),
  GROQ_MAX_TOKENS: z.string().transform(Number).default('4096'),
  GROQ_TEMPERATURE: z.string().transform(Number).default('0.6'),
  GROQ_STREAMING_ENABLED: z.string().transform(val => val === 'true').default('true'),
});

const env = envSchema.parse(process.env);

export const config = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  isDevelopment: env.NODE_ENV === 'development',
  isProduction: env.NODE_ENV === 'production',
  isTest: env.NODE_ENV === 'test',
  
  database: {
    url: env.DATABASE_URL,
  },
  
  redis: {
    url: env.REDIS_URL,
    useMock: env.USE_MOCK_REDIS,
  },
  
  jwt: {
    secret: env.JWT_SECRET,
    refreshSecret: env.JWT_REFRESH_SECRET,
    expiresIn: env.JWT_EXPIRES_IN,
    refreshExpiresIn: env.JWT_REFRESH_EXPIRES_IN,
  },
  
  cors: {
    origin: env.CORS_ORIGIN,
  },
  
  upload: {
    dir: env.UPLOAD_DIR,
    maxFileSize: env.MAX_FILE_SIZE,
  },
  
  ocr: {
    enabled: env.OCR_ENABLED,
  },
  
  session: {
    secret: env.SESSION_SECRET,
  },
  
  email: {
    smtp: {
      host: env.SMTP_HOST,
      port: env.SMTP_PORT,
      secure: env.SMTP_SECURE,
      auth: {
        user: env.SMTP_USER,
        pass: env.SMTP_PASS,
      },
    },
    from: {
      email: env.FROM_EMAIL,
      name: env.FROM_NAME,
    },
  },
  
  groq: {
    apiKey: env.GROQ_API_KEY,
    model: env.GROQ_MODEL,
    maxTokens: env.GROQ_MAX_TOKENS,
    temperature: env.GROQ_TEMPERATURE,
    streamingEnabled: env.GROQ_STREAMING_ENABLED,
  },
};