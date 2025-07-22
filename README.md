# Motel Employee Management System

This is a clean, minimal version of the Motel Employee Management System. The repository has been cleaned up to remove large files and unnecessary test files.

## Features

- Employee onboarding system
- Document management
- OCR processing for documents
- Multi-language support
- Walk-in onboarding
- Manager approval workflows
- AI text enhancement

## Setup

1. Install dependencies:
   ```
   npm install
   cd client && npm install
   ```

2. Set up environment variables:
   - Copy `.env.example` to `.env`
   - Configure database connection

3. Run database migrations:
   ```
   npm run db:migrate
   ```

4. Start the development server:
   ```
   npm run dev
   ```

5. Start the client:
   ```
   cd client && npm run dev
   ```

## License

MIT
