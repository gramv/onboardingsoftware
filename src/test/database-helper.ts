// Database test helper
import { prisma } from '@/utils/database';

export class DatabaseTestHelper {
  private static instance: DatabaseTestHelper;
  private connectionCount = 0;

  static getInstance(): DatabaseTestHelper {
    if (!DatabaseTestHelper.instance) {
      DatabaseTestHelper.instance = new DatabaseTestHelper();
    }
    return DatabaseTestHelper.instance;
  }

  async connect(): Promise<void> {
    this.connectionCount++;
    // Ensure connection is established
    await prisma.$connect();
  }

  async disconnect(): Promise<void> {
    this.connectionCount--;
    if (this.connectionCount <= 0) {
      await prisma.$disconnect();
      this.connectionCount = 0;
    }
  }

  async cleanup(): Promise<void> {
    try {
      // Clean up test data in reverse dependency order
      await prisma.document.deleteMany({});
      await prisma.onboardingSession.deleteMany({});
      await prisma.employee.deleteMany({});
      await prisma.user.deleteMany({});
      await prisma.organization.deleteMany({});
    } catch (error) {
      console.warn('Cleanup error:', error);
    }
  }

  async forceDisconnect(): Promise<void> {
    try {
      await prisma.$disconnect();
      this.connectionCount = 0;
    } catch (error) {
      console.warn('Force disconnect error:', error);
    }
  }
}

// Export singleton instance
export const dbHelper = DatabaseTestHelper.getInstance();