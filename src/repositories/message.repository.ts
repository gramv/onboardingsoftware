import { PrismaClient, Message } from '@prisma/client';
import { BaseRepository } from './base.repository';

export interface CreateMessageData {
  senderId: string;
  receiverId?: string;
  subject?: string;
  content: string;
}

export interface CreateMessageInput {
  receiverId?: string;
  subject?: string;
  content: string;
}

export interface UpdateMessageData {
  isRead?: boolean;
  readAt?: Date | null;
}

export interface MessageFilters {
  senderId?: string;
  receiverId?: string;
  isRead?: boolean;
  search?: string;
}

export class MessageRepository extends BaseRepository {
  constructor() {
    super();
  }

  /**
   * Create a new message
   */
  async create(data: CreateMessageData): Promise<Message> {
    return this.prisma.message.create({
      data
    });
  }

  /**
   * Find a message by ID
   */
  async findById(id: string): Promise<Message | null> {
    return this.prisma.message.findUnique({
      where: { id }
    });
  }

  /**
   * Update a message
   */
  async update(id: string, data: UpdateMessageData): Promise<Message> {
    return this.prisma.message.update({
      where: { id },
      data
    });
  }

  /**
   * Delete a message
   */
  async delete(id: string): Promise<Message> {
    return this.prisma.message.delete({
      where: { id }
    });
  }

  /**
   * Find all messages with filtering and pagination
   */
  async findAll(filters?: MessageFilters, page = 1, limit = 10): Promise<{ messages: Message[], total: number }> {
    const where: any = {};
    
    if (filters) {
      if (filters.senderId) {
        where.senderId = filters.senderId;
      }
      
      if (filters.receiverId) {
        where.receiverId = filters.receiverId;
      }
      
      if (filters.isRead !== undefined) {
        where.isRead = filters.isRead;
      }
      
      if (filters.search) {
        where.OR = [
          { subject: { contains: filters.search, mode: 'insensitive' } },
          { content: { contains: filters.search, mode: 'insensitive' } }
        ];
      }
    }

    const skip = (page - 1) * limit;
    
    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
              organizationId: true
            }
          },
          receiver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
              organizationId: true
            }
          }
        }
      }),
      this.prisma.message.count({ where })
    ]);

    return { messages, total };
  }

  /**
   * Find messages for a specific user (inbox)
   */
  async findInbox(userId: string, page = 1, limit = 10, search?: string): Promise<{ messages: Message[], total: number }> {
    const where: any = {
      receiverId: userId
    };
    
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
              organizationId: true
            }
          }
        }
      }),
      this.prisma.message.count({ where })
    ]);

    return { messages, total };
  }

  /**
   * Find messages sent by a specific user (outbox)
   */
  async findOutbox(userId: string, page = 1, limit = 10, search?: string): Promise<{ messages: Message[], total: number }> {
    const where: any = {
      senderId: userId
    };
    
    if (search) {
      where.OR = [
        { subject: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const [messages, total] = await Promise.all([
      this.prisma.message.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          receiver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
              organizationId: true
            }
          }
        }
      }),
      this.prisma.message.count({ where })
    ]);

    return { messages, total };
  }

  /**
   * Find unread message count for a user
   */
  async countUnread(userId: string): Promise<number> {
    return this.prisma.message.count({
      where: {
        receiverId: userId,
        isRead: false
      }
    });
  }
}