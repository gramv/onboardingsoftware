import { Message, PrismaClient, User, UserRole } from '@prisma/client';
import { 
  MessageRepository, 
  CreateMessageData, 
  CreateMessageInput,
  UpdateMessageData,
  MessageFilters
} from '../../repositories/message.repository';
import { ApiError } from '../../utils/errors';
import { notificationService } from '../notification/notificationService';

export interface MessageWithSender extends Message {
  sender: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    organizationId: string;
  };
}

export interface MessageWithReceiver extends Message {
  receiver: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: UserRole;
    organizationId: string;
  } | null;
}

export class MessageService {
  private messageRepository: MessageRepository;
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.messageRepository = new MessageRepository();
  }

  /**
   * Send a new message
   */
  async sendMessage(
    data: CreateMessageInput, 
    senderId: string
  ): Promise<Message> {
    // Validate sender exists
    const sender = await this.prisma.user.findUnique({
      where: { id: senderId }
    });

    if (!sender) {
      throw new ApiError('Sender not found', 404);
    }

    // If there's a receiver, validate they exist
    if (data.receiverId) {
      const receiver = await this.prisma.user.findUnique({
        where: { id: data.receiverId }
      });

      if (!receiver) {
        throw new ApiError('Receiver not found', 404);
      }

      // Check if sender has permission to message this receiver
      await this.validateMessagePermission(sender, receiver);
    }

    // Create the message
    const message = await this.messageRepository.create({
      ...data,
      senderId
    });

    // Send real-time notification to receiver
    if (data.receiverId) {
      await notificationService.notifyUser(data.receiverId, {
        type: 'message',
        title: `New message from ${sender.firstName} ${sender.lastName}`,
        content: data.subject || 'New message received',
        priority: 'normal',
        data: {
          messageId: message.id,
          senderId: sender.id,
          senderName: `${sender.firstName} ${sender.lastName}`,
          subject: data.subject
        }
      });
    }

    return message;
  }

  /**
   * Get a message by ID
   */
  async getMessageById(id: string, userId: string): Promise<Message> {
    const message = await this.messageRepository.findById(id);
    
    if (!message) {
      throw new ApiError('Message not found', 404);
    }

    // Check if user has permission to view this message
    if (message.senderId !== userId && message.receiverId !== userId) {
      throw new ApiError('You do not have permission to view this message', 403);
    }

    // If user is the receiver and message is unread, mark as read
    if (message.receiverId === userId && !message.isRead) {
      await this.markMessageAsRead(id, userId);
      message.isRead = true;
      message.readAt = new Date();
    }

    return message;
  }

  /**
   * Mark a message as read
   */
  async markMessageAsRead(id: string, userId: string): Promise<Message> {
    const message = await this.messageRepository.findById(id);
    
    if (!message) {
      throw new ApiError('Message not found', 404);
    }

    // Check if user is the receiver
    if (message.receiverId !== userId) {
      throw new ApiError('You do not have permission to mark this message as read', 403);
    }

    // Only update if not already read
    if (!message.isRead) {
      return this.messageRepository.update(id, {
        isRead: true,
        readAt: new Date()
      });
    }

    return message;
  }

  /**
   * Delete a message
   */
  async deleteMessage(id: string, userId: string): Promise<void> {
    const message = await this.messageRepository.findById(id);
    
    if (!message) {
      throw new ApiError('Message not found', 404);
    }

    // Check if user has permission to delete this message
    if (message.senderId !== userId && message.receiverId !== userId) {
      throw new ApiError('You do not have permission to delete this message', 403);
    }

    await this.messageRepository.delete(id);
  }

  /**
   * Get user's inbox messages
   */
  async getInbox(
    userId: string, 
    page = 1, 
    limit = 10, 
    search?: string
  ): Promise<{ messages: MessageWithSender[], total: number }> {
    const { messages, total } = await this.messageRepository.findInbox(userId, page, limit, search);
    return { messages: messages as MessageWithSender[], total };
  }

  /**
   * Get user's sent messages
   */
  async getOutbox(
    userId: string, 
    page = 1, 
    limit = 10, 
    search?: string
  ): Promise<{ messages: MessageWithReceiver[], total: number }> {
    const { messages, total } = await this.messageRepository.findOutbox(userId, page, limit, search);
    return { messages: messages as MessageWithReceiver[], total };
  }

  /**
   * Get unread message count for a user
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.messageRepository.countUnread(userId);
  }

  /**
   * Validate if a user can send a message to another user
   * Based on organizational hierarchy and roles
   */
  private async validateMessagePermission(sender: User, receiver: User): Promise<void> {
    // HR admins can message anyone
    if (sender.role === UserRole.hr_admin) {
      return;
    }

    // Managers can message employees in their organization or HR admins
    if (sender.role === UserRole.manager) {
      if (
        receiver.role === UserRole.hr_admin || 
        (receiver.role === UserRole.employee && receiver.organizationId === sender.organizationId)
      ) {
        return;
      }
      
      throw new ApiError('Managers can only message employees in their organization or HR admins', 403);
    }

    // Employees can message their managers or HR admins
    if (sender.role === UserRole.employee) {
      if (receiver.role === UserRole.hr_admin) {
        return;
      }
      
      if (receiver.role === UserRole.manager && receiver.organizationId === sender.organizationId) {
        return;
      }
      
      throw new ApiError('Employees can only message their managers or HR admins', 403);
    }

    // Default deny
    throw new ApiError('You do not have permission to send messages to this user', 403);
  }
}