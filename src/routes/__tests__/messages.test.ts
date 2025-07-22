import request from 'supertest';
import express from 'express';
import { PrismaClient, UserRole } from '@prisma/client';
import messageRoutes from '../messages';
import { MessageService } from '../../services/messaging/messageService';
import { errorHandler } from '../../middleware/errorHandler';

// Mock the auth middleware
jest.mock('../../middleware/auth/authMiddleware', () => ({
  authenticate: (req: any, res: any, next: any) => {
    req.user = {
      userId: 'mock-user-id',
      role: UserRole.hr_admin,
      organizationId: 'mock-org-id',
      email: 'admin@example.com',
      languagePreference: 'en'
    };
    next();
  }
}));

// Mock the MessageService
jest.mock('../../services/messaging/messageService');

describe('Message Routes', () => {
  let app: express.Application;
  let mockMessageService: jest.Mocked<MessageService>;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    
    // Create a mock instance of MessageService
    mockMessageService = new MessageService({} as PrismaClient) as jest.Mocked<MessageService>;
    
    // Mock the constructor to return our mock instance
    (MessageService as jest.Mock).mockImplementation(() => mockMessageService);
    
    app.use('/messages', messageRoutes);
    app.use(errorHandler);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /messages', () => {
    it('should send a new message', async () => {
      const messageData = {
        receiverId: 'receiver-id',
        subject: 'Test Subject',
        content: 'This is a test message'
      };

      const createdMessage = {
        id: 'message-id',
        senderId: 'mock-user-id',
        ...messageData,
        isRead: false,
        readAt: null,
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockMessageService.sendMessage.mockResolvedValue(createdMessage);

      const response = await request(app)
        .post('/messages')
        .send(messageData)
        .expect(201);

      expect(mockMessageService.sendMessage).toHaveBeenCalledWith(
        messageData,
        'mock-user-id'
      );
      expect(response.body.data).toHaveProperty('id', 'message-id');
      expect(response.body.meta.message).toBe('Message sent successfully');
    });

    it('should return validation error when content is empty', async () => {
      const messageData = {
        receiverId: 'receiver-id',
        subject: 'Test Subject',
        content: ''
      };

      const response = await request(app)
        .post('/messages')
        .send(messageData)
        .expect(400);

      expect(mockMessageService.sendMessage).not.toHaveBeenCalled();
      expect(response.body.error).toBeDefined();
      expect(response.body.error.details.validationErrors).toHaveProperty('content');
    });
  });

  describe('GET /messages/inbox', () => {
    it('should get user inbox messages', async () => {
      const mockMessages = [
        {
          id: 'message-1',
          senderId: 'sender-id',
          receiverId: 'mock-user-id',
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
            organizationId: 'org-id'
          }
        },
        {
          id: 'message-2',
          senderId: 'sender-id-2',
          receiverId: 'mock-user-id',
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
            role: UserRole.employee,
            organizationId: 'org-id'
          }
        }
      ];

      mockMessageService.getInbox.mockResolvedValue({
        messages: mockMessages,
        total: 2
      });

      const response = await request(app)
        .get('/messages/inbox')
        .query({
          page: '1',
          limit: '10',
          search: 'test'
        })
        .expect(200);

      expect(mockMessageService.getInbox).toHaveBeenCalledWith(
        'mock-user-id',
        1,
        10,
        'test'
      );
      expect(response.body.data).toHaveLength(2);
      expect(response.body.meta).toHaveProperty('total', 2);
    });
  });

  describe('GET /messages/outbox', () => {
    it('should get user sent messages', async () => {
      const mockMessages = [
        {
          id: 'message-1',
          senderId: 'mock-user-id',
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
            organizationId: 'org-id'
          }
        }
      ];

      mockMessageService.getOutbox.mockResolvedValue({
        messages: mockMessages,
        total: 1
      });

      const response = await request(app)
        .get('/messages/outbox')
        .query({
          page: '1',
          limit: '10'
        })
        .expect(200);

      expect(mockMessageService.getOutbox).toHaveBeenCalledWith(
        'mock-user-id',
        1,
        10,
        undefined
      );
      expect(response.body.data).toHaveLength(1);
      expect(response.body.meta).toHaveProperty('total', 1);
    });
  });

  describe('GET /messages/unread-count', () => {
    it('should get unread message count', async () => {
      mockMessageService.getUnreadCount.mockResolvedValue(5);

      const response = await request(app)
        .get('/messages/unread-count')
        .expect(200);

      expect(mockMessageService.getUnreadCount).toHaveBeenCalledWith('mock-user-id');
      expect(response.body.data).toHaveProperty('count', 5);
    });
  });

  describe('GET /messages/:id', () => {
    it('should get a specific message', async () => {
      const mockMessage = {
        id: 'message-id',
        senderId: 'sender-id',
        receiverId: 'mock-user-id',
        subject: 'Test Message',
        content: 'This is a test message',
        isRead: true,
        readAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockMessageService.getMessageById.mockResolvedValue(mockMessage);

      const response = await request(app)
        .get('/messages/message-id')
        .expect(200);

      expect(mockMessageService.getMessageById).toHaveBeenCalledWith('message-id', 'mock-user-id');
      expect(response.body.data).toHaveProperty('id', 'message-id');
    });
  });

  describe('POST /messages/:id/read', () => {
    it('should mark a message as read', async () => {
      const mockMessage = {
        id: 'message-id',
        senderId: 'sender-id',
        receiverId: 'mock-user-id',
        subject: 'Test Message',
        content: 'This is a test message',
        isRead: true,
        readAt: new Date(),
        createdAt: new Date(),
        updatedAt: new Date()
      };

      mockMessageService.markMessageAsRead.mockResolvedValue(mockMessage);

      const response = await request(app)
        .post('/messages/message-id/read')
        .expect(200);

      expect(mockMessageService.markMessageAsRead).toHaveBeenCalledWith('message-id', 'mock-user-id');
      expect(response.body.meta.message).toBe('Message marked as read');
    });
  });

  describe('DELETE /messages/:id', () => {
    it('should delete a message', async () => {
      mockMessageService.deleteMessage.mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/messages/message-id')
        .expect(200);

      expect(mockMessageService.deleteMessage).toHaveBeenCalledWith('message-id', 'mock-user-id');
      expect(response.body.meta.message).toBe('Message deleted successfully');
    });
  });
});