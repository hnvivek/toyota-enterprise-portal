import { AppDataSource } from '../config/database';
import { Notification, NotificationType } from '../models/Notification';
import { User } from '../models/User';
import { Event } from '../models/Event';
import { UserRole } from '../types/auth';

export class NotificationService {
  private notificationRepository = AppDataSource.getRepository(Notification);
  private userRepository = AppDataSource.getRepository(User);

  // Create a notification for a specific user
  async createNotification(
    userId: number,
    type: NotificationType,
    title: string,
    message: string,
    relatedEntityId?: number,
    relatedEntityType?: string,
    actionUrl?: string
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId,
      type,
      title,
      message,
      relatedEntityId,
      relatedEntityType,
      actionUrl,
      isRead: false
    });

    return await this.notificationRepository.save(notification);
  }

  // Create notifications for multiple users
  async createBulkNotifications(
    userIds: number[],
    type: NotificationType,
    title: string,
    message: string,
    relatedEntityId?: number,
    relatedEntityType?: string,
    actionUrl?: string
  ): Promise<Notification[]> {
    const notifications = userIds.map(userId => 
      this.notificationRepository.create({
        userId,
        type,
        title,
        message,
        relatedEntityId,
        relatedEntityType,
        actionUrl,
        isRead: false
      })
    );

    return await this.notificationRepository.save(notifications);
  }

  // Get notifications for a user
  async getUserNotifications(userId: number, limit: number = 10, offset: number = 0): Promise<{
    notifications: Notification[];
    unreadCount: number;
    total: number;
  }> {
    const [notifications, total] = await this.notificationRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset
    });

    const unreadCount = await this.notificationRepository.count({
      where: { userId, isRead: false }
    });

    return { notifications, unreadCount, total };
  }

  // Mark notification as read
  async markAsRead(notificationId: number, userId: number): Promise<boolean> {
    const result = await this.notificationRepository.update(
      { id: notificationId, userId },
      { isRead: true }
    );
    return result.affected! > 0;
  }

  // Mark all notifications as read for a user
  async markAllAsRead(userId: number): Promise<boolean> {
    const result = await this.notificationRepository.update(
      { userId, isRead: false },
      { isRead: true }
    );
    return result.affected! > 0;
  }

  // Delete old notifications (cleanup job)
  async deleteOldNotifications(daysOld: number = 30): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysOld);

    const result = await this.notificationRepository.delete({
      createdAt: AppDataSource.getRepository(Notification)
        .createQueryBuilder()
        .where('createdAt < :cutoffDate', { cutoffDate })
        .getQuery() as any
    });

    return result.affected || 0;
  }

  // Event-specific notification helpers
  async notifyEventCreated(event: Event, creatorId: number): Promise<void> {
    // Notify relevant approvers based on event workflow
    const approverIds: number[] = [];
    
    // Get manager/head user IDs based on role hierarchy
    const approvers = await this.userRepository.find({
      where: [
        { role: UserRole.GENERAL_MANAGER },
        { role: UserRole.MARKETING_HEAD }
      ]
    });

    approverIds.push(...approvers.map(u => u.id));

    if (approverIds.length > 0) {
      await this.createBulkNotifications(
        approverIds,
        NotificationType.EVENT_CREATED,
        'New Event Created',
        `A new event "${event.title}" has been created and requires approval.`,
        event.id,
        'event',
        `/events/${event.id}`
      );
    }
  }

  async notifyEventStatusChange(event: Event, newStatus: string, actorId: number): Promise<void> {
    // Notify event creator (organizer)
    const type = newStatus === 'approved' ? NotificationType.EVENT_APPROVED : NotificationType.EVENT_REJECTED;
    const title = newStatus === 'approved' ? 'Event Approved' : 'Event Rejected';
    const message = `Your event "${event.title}" has been ${newStatus}.`;

    await this.createNotification(
      event.userId,
      type,
      title,
      message,
      event.id,
      'event',
      `/events/${event.id}`
    );
  }

  async notifyBudgetApproval(event: Event, approved: boolean, actorId: number): Promise<void> {
    const type = approved ? NotificationType.BUDGET_APPROVED : NotificationType.BUDGET_REJECTED;
    const title = approved ? 'Budget Approved' : 'Budget Rejected';
    const message = `Budget for event "${event.title}" has been ${approved ? 'approved' : 'rejected'}.`;

    await this.createNotification(
      event.userId,
      type,
      title,
      message,
      event.id,
      'event',
      `/events/${event.id}`
    );
  }
}

export const notificationService = new NotificationService(); 