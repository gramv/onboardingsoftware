import { PrismaClient } from '@prisma/client';
import { MessageRepository } from '../message.repository';

// Mock the PrismaClient
jest.mock('@prisma/client', () => {
  const mockPrismaClient = {
    message: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

describe('MessageRepository', () => {
  let messageRepository: MessageRepository;
  let prisma: any;

  beforeEach(() => {
    prisma = new PrismaClient();
    messageRepository = new MessageRepository();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a new message', async () => {
      const messageData = {
        senderId: 'sender-id',
        receiverId: 'receiver-id',
        subject: 'Test Subject',
        content: 'This is a test message',
      };

      const createdMessage = {
        id: 'message-id',
        ...messageData,
        isRead: false,
        readAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.message.create.mockResolvedValue(createdMessage);

      const result = await messageRepository.create(messageData);

      expect(prisma.message.create).toHaveBeenCalledWith({
        data: messageData,
      });
      expect(result).toEqual(createdMessage);
    });
  });

  describe('findById', () => {
    it('should find a message by ID', async () => {
      const mockMessage = {
        id: 'message-id',
        senderId: 'sender-id',
        receiverId: 'receiver-id',
        subject: 'Test Message',
        content: 'This is a test message',
        isRead: false,
        readAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.message.findUnique.mockResolvedValue(mockMessage);

      const result = await messageRepository.findById('message-id');

      expect(prisma.message.findUnique).toHaveBeenCalledWith({
        where: { id: 'message-id' },
      });
      expect(result).toEqual(mockMessage);
    });

    it('should return null when message not found', async () => {
      prisma.message.findUnique.mockResolvedValue(null);

      const result = await messageRepository.findById('non-existent-id');

      expect(prisma.message.findUnique).toHaveBeenCalledWith({
        where: { id: 'non-existent-id' },
      });
      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update a message', async () => {
      const updateData = {
        isRead: true,
        readAt: new Date(),
      };

      const updatedMessage = {
        id: 'message-id',
        senderId: 'sender-id',
        receiverId: 'receiver-id',
        subject: 'Test Message',
        content: 'This is a test message',
        ...updateData,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.message.update.mockResolvedValue(updatedMessage);

      const result = await messageRepository.update('message-id', updateData);

      expect(prisma.message.update).toHaveBeenCalledWith({
        where: { id: 'message-id' },
        data: updateData,
      });
      expect(result).toEqual(updatedMessage);
    });
  });

  describe('delete', () => {
    it('should delete a message', async () => {
      const deletedMessage = {
        id: 'message-id',
        senderId: 'sender-id',
        receiverId: 'receiver-id',
        subject: 'Test Message',
        content: 'This is a test message',
        isRead: false,
        readAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      prisma.message.delete.mockResolvedValue(deletedMessage);

      const result = await messageRepository.delete('message-id');

      expect(prisma.message.delete).toHaveBeenCalledWith({
        where: { id: 'message-id' },
      });
      expect(result).toEqual(deletedMessage);
    });
  });

  describe('findAll', () => {
    it('should find all messages with filters and pagination', async () => {
      const mockMessages = [
        {
          id: 'message-1',
          senderId: 'sender-id',
          receiverId: 'receiver-id',
          subject: 'Message 1',
          content: 'Content 1',
          isRead: false,
          readAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          sender: { id: 'sender-id', firstName: 'John', lastName: 'Doe' },
          receiver: { id: 'receiver-id', firstName: 'Jane', lastName: 'Smith' },
        },
        {
          id: 'message-2',
          senderId: 'sender-id',
          receiverId: 'receiver-id-2',
          subject: 'Message 2',
          content: 'Content 2',
          isRead: true,
          readAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
          sender: { id: 'sender-id', firstName: 'John', lastName: 'Doe' },
          receiver: { id: 'receiver-id-2', firstName: 'Bob', lastName: 'Johnson' },
        },
      ];

      const filters = {
        senderId: 'sender-id',
        isRead: false,
      };

      prisma.message.findMany.mockResolvedValue(mockMessages.slice(0, 1));
      prisma.message.count.mockResolvedValue(1);

      const result = await messageRepository.findAll(filters, 1, 10);

      expect(prisma.message.findMany).toHaveBeenCalledWith({
        where: filters,
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
              organizationId: true,
            },
          },
          receiver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
              organizationId: true,
            },
          },
        },
      });
      expect(prisma.message.count).toHaveBeenCalledWith({ where: filters });
      expect(result).toEqual({
        messages: mockMessages.slice(0, 1),
        total: 1,
      });
    });
  });

  describe('findInbox', () => {
    it('should find inbox messages for a user', async () => {
      const mockMessages = [
        {
          id: 'message-1',
          senderId: 'sender-id',
          receiverId: 'user-id',
          subject: 'Message 1',
          content: 'Content 1',
          isRead: false,
          readAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          sender: { id: 'sender-id', firstName: 'John', lastName: 'Doe' },
        },
      ];

      prisma.message.findMany.mockResolvedValue(mockMessages);
      prisma.message.count.mockResolvedValue(1);

      const result = await messageRepository.findInbox('user-id', 1, 10, 'test');

      expect(prisma.message.findMany).toHaveBeenCalledWith({
        where: {
          receiverId: 'user-id',
          OR: [
            { subject: { contains: 'test', mode: 'insensitive' } },
            { content: { contains: 'test', mode: 'insensitive' } },
          ],
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          sender: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
              organizationId: true,
            },
          },
        },
      });
      expect(prisma.message.count).toHaveBeenCalledWith({
        where: {
          receiverId: 'user-id',
          OR: [
            { subject: { contains: 'test', mode: 'insensitive' } },
            { content: { contains: 'test', mode: 'insensitive' } },
          ],
        },
      });
      expect(result).toEqual({
        messages: mockMessages,
        total: 1,
      });
    });
  });

  describe('findOutbox', () => {
    it('should find outbox messages for a user', async () => {
      const mockMessages = [
        {
          id: 'message-1',
          senderId: 'user-id',
          receiverId: 'receiver-id',
          subject: 'Message 1',
          content: 'Content 1',
          isRead: false,
          readAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          receiver: { id: 'receiver-id', firstName: 'John', lastName: 'Doe' },
        },
      ];

      prisma.message.findMany.mockResolvedValue(mockMessages);
      prisma.message.count.mockResolvedValue(1);

      const result = await messageRepository.findOutbox('user-id', 1, 10);

      expect(prisma.message.findMany).toHaveBeenCalledWith({
        where: {
          senderId: 'user-id',
        },
        skip: 0,
        take: 10,
        orderBy: { createdAt: 'desc' },
        include: {
          receiver: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true,
              role: true,
              organizationId: true,
            },
          },
        },
      });
      expect(prisma.message.count).toHaveBeenCalledWith({
        where: {
          senderId: 'user-id',
        },
      });
      expect(result).toEqual({
        messages: mockMessages,
        total: 1,
      });
    });
  });

  describe('countUnread', () => {
    it('should count unread messages for a user', async () => {
      prisma.message.count.mockResolvedValue(5);

      const result = await messageRepository.countUnread('user-id');

      expect(prisma.message.count).toHaveBeenCalledWith({
        where: {
          receiverId: 'user-id',
          isRead: false,
        },
      });
      expect(result).toBe(5);
    });
  });
});