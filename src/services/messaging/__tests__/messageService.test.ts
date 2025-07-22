import { PrismaClient, UserRole } from '@prisma/client';
import { MessageService } from '../messageService';
import { MessageRepository } from '../../../repositories/message.repository';
import { ApiError } from '../../../utils/errors';

// Mock the PrismaClient and MessageRepository
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
    user: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
    },
  };
  return {
    PrismaClient: jest.fn(() => mockPrismaClient),
  };
});

jest.mock('../../../repositories/message.repository');

describe('MessageService', () => {
  let messageService: MessageService;
  let prisma: any;
  let mockMessageRepository: jest.Mocked<MessageRepository>;

  beforeEach(() => {
    prisma = new PrismaClient();
    mockMessageRepository = new MessageRepository() as jest.Mocked<MessageRepository>;
    (MessageRepository as jest.Mock).mockImplementation(() => mockMessageRepository);
    messageService = new MessageService(prisma);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendMessage', () => {
    const mockMessageData = {
      receiverId: 'receiver-id',
      subject: 'Test Subject',
      content: 'This is a test message',
    };

    const mockHrAdmin = {
      id: 'hr-admin-id',
      role: UserRole.hr_admin,
      organizationId: 'org-id-1',
    };

    const mockManager = {
      id: 'manager-id',
      role: UserRole.manager,
      organizationId: 'org-id-2',
    };

    const mockEmployee = {
      id: 'employee-id',
      role: UserRole.employee,
      organizationId: 'org-id-2',
    };

    const mockHrReceiver = {
      id: 'receiver-id',
      role: UserRole.hr_admin,
      organizationId: 'org-id-1',
    };

    const mockManagerReceiver = {
      id: 'receiver-id',
      role: UserRole.manager,
      organizationId: 'org-id-2',
    };

    const mockEmployeeReceiver = {
      id: 'receiver-id',
      role: UserRole.employee,
      organizationId: 'org-id-2',
    };

    it('should send a message when HR admin sends to anyone', async () => {
      prisma.user.findUnique.mockImplementation((args: any) => {
        if (args.where.id === mockHrAdmin.id) {
          return Promise.resolve(mockHrAdmin);
        } else if (args.where.id === mockMessageData.receiverId) {
          return Promise.resolve(mockEmployeeReceiver);
        }
        return Promise.resolve(null);
      });

      mockMessageRepository.create.mockResolvedValue({
        id: 'message-id',
        senderId: mockHrAdmin.id,
        ...mockMessageData,
        isRead: false,
        readAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await messageService.sendMessage(mockMessageData, mockHrAdmin.id);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockHrAdmin.id },
      });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockMessageData.receiverId },
      });
      expect(mockMessageRepository.create).toHaveBeenCalledWith({
        ...mockMessageData,
        senderId: mockHrAdmin.id,
      });
      expect(result).toHaveProperty('id', 'message-id');
    });

    it('should send a message when manager sends to employee in their organization', async () => {
      prisma.user.findUnique.mockImplementation((args: any) => {
        if (args.where.id === mockManager.id) {
          return Promise.resolve(mockManager);
        } else if (args.where.id === mockMessageData.receiverId) {
          return Promise.resolve(mockEmployeeReceiver);
        }
        return Promise.resolve(null);
      });

      mockMessageRepository.create.mockResolvedValue({
        id: 'message-id',
        senderId: mockManager.id,
        ...mockMessageData,
        isRead: false,
        readAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await messageService.sendMessage(mockMessageData, mockManager.id);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockManager.id },
      });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockMessageData.receiverId },
      });
      expect(mockMessageRepository.create).toHaveBeenCalledWith({
        ...mockMessageData,
        senderId: mockManager.id,
      });
      expect(result).toHaveProperty('id', 'message-id');
    });

    it('should send a message when employee sends to HR admin', async () => {
      prisma.user.findUnique.mockImplementation((args: any) => {
        if (args.where.id === mockEmployee.id) {
          return Promise.resolve(mockEmployee);
        } else if (args.where.id === mockMessageData.receiverId) {
          return Promise.resolve(mockHrReceiver);
        }
        return Promise.resolve(null);
      });

      mockMessageRepository.create.mockResolvedValue({
        id: 'message-id',
        senderId: mockEmployee.id,
        ...mockMessageData,
        isRead: false,
        readAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      const result = await messageService.sendMessage(mockMessageData, mockEmployee.id);

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockEmployee.id },
      });
      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { id: mockMessageData.receiverId },
      });
      expect(mockMessageRepository.create).toHaveBeenCalledWith({
        ...mockMessageData,
        senderId: mockEmployee.id,
      });
      expect(result).toHaveProperty('id', 'message-id');
    });

    it('should throw error when employee tries to message another employee', async () => {
      const otherEmployee = {
        id: 'receiver-id',
        role: UserRole.employee,
        organizationId: 'org-id-3', // Different organization
      };

      prisma.user.findUnique.mockImplementation((args: any) => {
        if (args.where.id === mockEmployee.id) {
          return Promise.resolve(mockEmployee);
        } else if (args.where.id === mockMessageData.receiverId) {
          return Promise.resolve(otherEmployee);
        }
        return Promise.resolve(null);
      });

      await expect(
        messageService.sendMessage(mockMessageData, mockEmployee.id)
      ).rejects.toThrow(ApiError);
    });

    it('should throw error when manager tries to message employee from another organization', async () => {
      const employeeFromOtherOrg = {
        id: 'receiver-id',
        role: UserRole.employee,
        organizationId: 'org-id-3', // Different organization
      };

      prisma.user.findUnique.mockImplementation((args: any) => {
        if (args.where.id === mockManager.id) {
          return Promise.resolve(mockManager);
        } else if (args.where.id === mockMessageData.receiverId) {
          return Promise.resolve(employeeFromOtherOrg);
        }
        return Promise.resolve(null);
      });

      await expect(
        messageService.sendMessage(mockMessageData, mockManager.id)
      ).rejects.toThrow(ApiError);
    });
  });

  describe('getMessageById', () => {
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

    it('should return message when user is the sender', async () => {
      mockMessageRepository.findById.mockResolvedValue(mockMessage);

      const result = await messageService.getMessageById('message-id', 'sender-id');

      expect(mockMessageRepository.findById).toHaveBeenCalledWith('message-id');
      expect(result).toEqual(mockMessage);
    });

    it('should return message and mark as read when user is the receiver', async () => {
      mockMessageRepository.findById.mockResolvedValue(mockMessage);
      mockMessageRepository.update.mockResolvedValue({
        ...mockMessage,
        isRead: true,
        readAt: expect.any(Date),
      });

      const result = await messageService.getMessageById('message-id', 'receiver-id');

      expect(mockMessageRepository.findById).toHaveBeenCalledWith('message-id');
      expect(mockMessageRepository.update).toHaveBeenCalledWith('message-id', {
        isRead: true,
        readAt: expect.any(Date),
      });
      expect(result).toEqual({
        ...mockMessage,
        isRead: true,
        readAt: expect.any(Date),
      });
    });

    it('should throw error when message not found', async () => {
      mockMessageRepository.findById.mockResolvedValue(null);

      await expect(
        messageService.getMessageById('non-existent-id', 'user-id')
      ).rejects.toThrow(ApiError);
    });

    it('should throw error when user is neither sender nor receiver', async () => {
      mockMessageRepository.findById.mockResolvedValue(mockMessage);

      await expect(
        messageService.getMessageById('message-id', 'other-user-id')
      ).rejects.toThrow(ApiError);
    });
  });

  describe('markMessageAsRead', () => {
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

    it('should mark message as read when user is the receiver', async () => {
      mockMessageRepository.findById.mockResolvedValue(mockMessage);
      mockMessageRepository.update.mockResolvedValue({
        ...mockMessage,
        isRead: true,
        readAt: expect.any(Date),
      });

      const result = await messageService.markMessageAsRead('message-id', 'receiver-id');

      expect(mockMessageRepository.findById).toHaveBeenCalledWith('message-id');
      expect(mockMessageRepository.update).toHaveBeenCalledWith('message-id', {
        isRead: true,
        readAt: expect.any(Date),
      });
      expect(result).toEqual({
        ...mockMessage,
        isRead: true,
        readAt: expect.any(Date),
      });
    });

    it('should not update if message is already read', async () => {
      const readMessage = {
        ...mockMessage,
        isRead: true,
        readAt: new Date(),
      };
      mockMessageRepository.findById.mockResolvedValue(readMessage);

      const result = await messageService.markMessageAsRead('message-id', 'receiver-id');

      expect(mockMessageRepository.findById).toHaveBeenCalledWith('message-id');
      expect(mockMessageRepository.update).not.toHaveBeenCalled();
      expect(result).toEqual(readMessage);
    });

    it('should throw error when message not found', async () => {
      mockMessageRepository.findById.mockResolvedValue(null);

      await expect(
        messageService.markMessageAsRead('non-existent-id', 'receiver-id')
      ).rejects.toThrow(ApiError);
    });

    it('should throw error when user is not the receiver', async () => {
      mockMessageRepository.findById.mockResolvedValue(mockMessage);

      await expect(
        messageService.markMessageAsRead('message-id', 'other-user-id')
      ).rejects.toThrow(ApiError);
    });
  });

  describe('deleteMessage', () => {
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

    it('should delete message when user is the sender', async () => {
      mockMessageRepository.findById.mockResolvedValue(mockMessage);
      mockMessageRepository.delete.mockResolvedValue(mockMessage);

      await messageService.deleteMessage('message-id', 'sender-id');

      expect(mockMessageRepository.findById).toHaveBeenCalledWith('message-id');
      expect(mockMessageRepository.delete).toHaveBeenCalledWith('message-id');
    });

    it('should delete message when user is the receiver', async () => {
      mockMessageRepository.findById.mockResolvedValue(mockMessage);
      mockMessageRepository.delete.mockResolvedValue(mockMessage);

      await messageService.deleteMessage('message-id', 'receiver-id');

      expect(mockMessageRepository.findById).toHaveBeenCalledWith('message-id');
      expect(mockMessageRepository.delete).toHaveBeenCalledWith('message-id');
    });

    it('should throw error when message not found', async () => {
      mockMessageRepository.findById.mockResolvedValue(null);

      await expect(
        messageService.deleteMessage('non-existent-id', 'sender-id')
      ).rejects.toThrow(ApiError);
    });

    it('should throw error when user is neither sender nor receiver', async () => {
      mockMessageRepository.findById.mockResolvedValue(mockMessage);

      await expect(
        messageService.deleteMessage('message-id', 'other-user-id')
      ).rejects.toThrow(ApiError);
    });
  });

  describe('getInbox', () => {
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
        sender: {
          id: 'sender-id',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          role: UserRole.manager,
          organizationId: 'org-id',
        },
      },
      {
        id: 'message-2',
        senderId: 'sender-id-2',
        receiverId: 'user-id',
        subject: 'Message 2',
        content: 'Content 2',
        isRead: true,
        readAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date(),
        sender: {
          id: 'sender-id-2',
          firstName: 'Jane',
          lastName: 'Smith',
          email: 'jane@example.com',
          role: UserRole.hr_admin,
          organizationId: 'org-id',
        },
      },
    ];

    it('should return user inbox messages', async () => {
      mockMessageRepository.findInbox.mockResolvedValue({
        messages: mockMessages,
        total: 2,
      });

      const result = await messageService.getInbox('user-id', 1, 10, 'test');

      expect(mockMessageRepository.findInbox).toHaveBeenCalledWith('user-id', 1, 10, 'test');
      expect(result).toEqual({
        messages: mockMessages,
        total: 2,
      });
    });
  });

  describe('getOutbox', () => {
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
        receiver: {
          id: 'receiver-id',
          firstName: 'John',
          lastName: 'Doe',
          email: 'john@example.com',
          role: UserRole.manager,
          organizationId: 'org-id',
        },
      },
    ];

    it('should return user sent messages', async () => {
      mockMessageRepository.findOutbox.mockResolvedValue({
        messages: mockMessages,
        total: 1,
      });

      const result = await messageService.getOutbox('user-id', 1, 10);

      expect(mockMessageRepository.findOutbox).toHaveBeenCalledWith('user-id', 1, 10, undefined);
      expect(result).toEqual({
        messages: mockMessages,
        total: 1,
      });
    });
  });

  describe('getUnreadCount', () => {
    it('should return unread message count', async () => {
      mockMessageRepository.countUnread.mockResolvedValue(5);

      const result = await messageService.getUnreadCount('user-id');

      expect(mockMessageRepository.countUnread).toHaveBeenCalledWith('user-id');
      expect(result).toBe(5);
    });
  });
});