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

    const result = await this.notificationRepository
      .createQueryBuilder()
      .delete()
      .from(Notification)
      .where('createdAt < :cutoffDate', { cutoffDate })
      .execute();

    return result.affected || 0;
  }

  // Cleanup with different retention policies for different types
  async performCleanup(): Promise<{
    deletedRead: number;
    deletedOld: number;
    deletedTotal: number;
  }> {
    console.log('Starting notification cleanup...');
    
    // Delete read notifications older than 3 days (reduced from 7)
    const readCutoffDate = new Date();
    readCutoffDate.setDate(readCutoffDate.getDate() - 3);

    const deletedRead = await this.notificationRepository
      .createQueryBuilder()
      .delete()
      .from(Notification)
      .where('isRead = :isRead', { isRead: true })
      .andWhere('createdAt < :cutoffDate', { cutoffDate: readCutoffDate })
      .execute();

    // Delete ALL notifications older than 14 days (reduced from 90)
    const allCutoffDate = new Date();
    allCutoffDate.setDate(allCutoffDate.getDate() - 14);

    const deletedOld = await this.notificationRepository
      .createQueryBuilder()
      .delete()
      .from(Notification)
      .where('createdAt < :cutoffDate', { cutoffDate: allCutoffDate })
      .execute();

    // Delete system announcements older than 7 days if read (reduced from 30)
    const systemAnnouncementCutoff = new Date();
    systemAnnouncementCutoff.setDate(systemAnnouncementCutoff.getDate() - 7);

    const deletedSystemAnnouncements = await this.notificationRepository
      .createQueryBuilder()
      .delete()
      .from(Notification)
      .where('type = :type', { type: NotificationType.SYSTEM_ANNOUNCEMENT })
      .andWhere('isRead = :isRead', { isRead: true })
      .andWhere('createdAt < :cutoffDate', { cutoffDate: systemAnnouncementCutoff })
      .execute();

    const totalDeleted = (deletedRead.affected || 0) + (deletedOld.affected || 0) + (deletedSystemAnnouncements.affected || 0);

    console.log(`Notification cleanup completed:`, {
      deletedRead: deletedRead.affected || 0,
      deletedOld: deletedOld.affected || 0,
      deletedSystemAnnouncements: deletedSystemAnnouncements.affected || 0,
      totalDeleted
    });

    return {
      deletedRead: deletedRead.affected || 0,
      deletedOld: deletedOld.affected || 0,
      deletedTotal: totalDeleted
    };
  }

  // Auto-mark old read notifications for cleanup
  async markOldNotificationsForCleanup(): Promise<number> {
    // Auto-mark reminders as read after 2 days (reduced from 3)
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const result = await this.notificationRepository
      .createQueryBuilder()
      .update(Notification)
      .set({ isRead: true })
      .where('type = :type', { type: NotificationType.REMINDER })
      .andWhere('isRead = :isRead', { isRead: false })
      .andWhere('createdAt < :cutoffDate', { cutoffDate: twoDaysAgo })
      .execute();

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

  // Automatic reminders for events
  async createEventReminders(): Promise<void> {
    const eventRepository = AppDataSource.getRepository(Event);
    
    // Find approved events that are happening tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);

    const eventsStartingTomorrow = await eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.organizer', 'organizer')
      .where('event.status = :status', { status: 'approved' })
      .andWhere('event.startDate >= :tomorrow', { tomorrow })
      .andWhere('event.startDate < :dayAfter', { dayAfter: dayAfterTomorrow })
      .getMany();

    for (const event of eventsStartingTomorrow) {
      await this.createNotification(
        event.organizer.id,
        NotificationType.REMINDER,
        '⏰ Event Starting Tomorrow',
        `Don't forget! Your event "${event.title}" is scheduled to start tomorrow at ${event.location}.`,
        event.id,
        'event',
        `/events/${event.id}`
      );
    }

    // Find events that ended but are not marked as completed
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate() - 1);
    yesterday.setHours(23, 59, 59, 999);

    const eventsNeedingCompletion = await eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.organizer', 'organizer')
      .where('event.status = :status', { status: 'approved' })
      .andWhere('event.endDate < :yesterday', { yesterday })
      .getMany();

    for (const event of eventsNeedingCompletion) {
      // Check if we've already sent a completion reminder in the last 24 hours
      const recentReminder = await this.notificationRepository
        .createQueryBuilder('notification')
        .where('notification.userId = :userId', { userId: event.organizer.id })
        .andWhere('notification.relatedEntityId = :eventId', { eventId: event.id })
        .andWhere('notification.relatedEntityType = :type', { type: 'event' })
        .andWhere('notification.type = :notType', { notType: NotificationType.REMINDER })
        .andWhere('notification.message LIKE :pattern', { pattern: '%mark as complete%' })
        .andWhere('notification.createdAt > :since', { since: new Date(Date.now() - 24 * 60 * 60 * 1000) })
        .getOne();

      if (!recentReminder) {
        await this.createNotification(
          event.organizer.id,
          NotificationType.REMINDER,
          '📊 Please Complete Event Report',
          `Your event "${event.title}" has ended. Please add the actual results and mark it as complete.`,
          event.id,
          'event',
          `/events/${event.id}`
        );
      }
    }
  }

  // Create deadline reminders for events pending approval
  async createApprovalReminders(): Promise<void> {
    const eventRepository = AppDataSource.getRepository(Event);
    const userRepository = AppDataSource.getRepository(User);
    
    // Find events pending GM approval for more than 3 days
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);

    const eventsPendingGM = await eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.organizer', 'organizer')
      .leftJoinAndSelect('event.branch', 'branch')
      .where('event.status = :status', { status: 'pending_gm' })
      .andWhere('event.createdAt < :threeDaysAgo', { threeDaysAgo })
      .getMany();

    for (const event of eventsPendingGM) {
      // Find GMs in the same branch
      const gms = await userRepository
        .createQueryBuilder('user')
        .leftJoinAndSelect('user.branch', 'branch')
        .where('user.role = :role', { role: UserRole.GENERAL_MANAGER })
        .andWhere('branch.id = :branchId', { branchId: event.branch.id })
        .getMany();

      for (const gm of gms) {
        await this.createNotification(
          gm.id,
          NotificationType.REMINDER,
          '⏰ Approval Pending: Action Required',
          `Event "${event.title}" by ${event.organizer.username} has been waiting for your approval for 3+ days.`,
          event.id,
          'event',
          `/events/${event.id}`
        );
      }
    }

    // Find events pending Marketing approval for more than 2 days
    const twoDaysAgo = new Date();
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    const eventsPendingMarketing = await eventRepository
      .createQueryBuilder('event')
      .leftJoinAndSelect('event.organizer', 'organizer')
      .where('event.status = :status', { status: 'pending_marketing' })
      .andWhere('event.updatedAt < :twoDaysAgo', { twoDaysAgo })
      .getMany();

    for (const event of eventsPendingMarketing) {
      // Find marketing heads
      const marketingHeads = await userRepository.find({
        where: { role: UserRole.MARKETING_HEAD }
      });

      for (const marketingHead of marketingHeads) {
        await this.createNotification(
          marketingHead.id,
          NotificationType.REMINDER,
          '⏰ Final Approval Pending',
          `Event "${event.title}" by ${event.organizer.username} needs your final approval (waiting 2+ days).`,
          event.id,
          'event',
          `/events/${event.id}`
        );
      }
    }
  }
}

export const notificationService = new NotificationService(); 