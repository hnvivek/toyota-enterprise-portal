import { Router, Request, Response } from 'express';
import { auth } from '../middleware/auth';
import { notificationService } from '../services/notificationService';
import { NotificationType, Notification } from '../models/Notification';
import { RecurringReminder, RecurringType } from '../models/RecurringReminder';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { UserRole } from '../types/auth';
import { In } from 'typeorm';

const router = Router();

// Get current user's notifications
router.get('/', auth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const limit = parseInt(req.query.limit as string) || 10;
    const offset = parseInt(req.query.offset as string) || 0;

    const result = await notificationService.getUserNotifications(
      req.user.userId,
      limit,
      offset
    );

    res.json(result);
  } catch (error) {
    console.error('Error fetching notifications:', error);
    res.status(500).json({ message: 'Error fetching notifications' });
  }
});

// Get unread notification count
router.get('/unread-count', auth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const result = await notificationService.getUserNotifications(req.user.userId, 1, 0);
    res.json({ count: result.unreadCount });
  } catch (error) {
    console.error('Error fetching unread count:', error);
    res.status(500).json({ message: 'Error fetching unread count' });
  }
});

// Mark notification as read
router.put('/:id/read', auth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const notificationId = parseInt(req.params.id);
    const success = await notificationService.markAsRead(notificationId, req.user.userId);

    if (success) {
      res.json({ message: 'Notification marked as read' });
    } else {
      res.status(404).json({ message: 'Notification not found' });
    }
  } catch (error) {
    console.error('Error marking notification as read:', error);
    res.status(500).json({ message: 'Error marking notification as read' });
  }
});

// Mark all notifications as read
router.put('/mark-all-read', auth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    await notificationService.markAllAsRead(req.user.userId);
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    res.status(500).json({ message: 'Error marking all notifications as read' });
  }
});

// Create system announcement (Admin only)
router.post('/system-announcement', auth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userRepository = AppDataSource.getRepository(User);
    const currentUser = await userRepository.findOne({ where: { id: req.user.userId } });

    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can create system announcements' });
    }

    const { title, message, targetRoles, actionUrl } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    // Get target users based on roles
    let targetUsers: User[] = [];
    if (targetRoles && Array.isArray(targetRoles) && targetRoles.length > 0) {
      targetUsers = await userRepository.find({
        where: { role: In(targetRoles as UserRole[]) }
      });
    } else {
      // Send to all users if no specific roles
      targetUsers = await userRepository.find();
    }

    const userIds = targetUsers.map(user => user.id);

    if (userIds.length > 0) {
      await notificationService.createBulkNotifications(
        userIds,
        NotificationType.SYSTEM_ANNOUNCEMENT,
        `📢 ${title}`,
        message,
        undefined,
        'system',
        actionUrl || undefined
      );

      res.json({
        message: 'System announcement sent successfully',
        recipientCount: userIds.length
      });
    } else {
      res.status(400).json({ message: 'No users found for the specified roles' });
    }
  } catch (error) {
    console.error('Error creating system announcement:', error);
    res.status(500).json({ message: 'Error creating system announcement' });
  }
});

// Create reminder (Admin and Managers)
router.post('/reminder', auth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userRepository = AppDataSource.getRepository(User);
    const currentUser = await userRepository.findOne({ where: { id: req.user.userId } });

    if (!currentUser || !['admin', 'general_manager', 'marketing_head'].includes(currentUser.role)) {
      return res.status(403).json({ message: 'Insufficient permissions to create reminders' });
    }

    const { title, message, userIds, targetRoles, actionUrl, isRecurring, recurringType, recurringEndDate } = req.body;

    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    let finalUserIds: number[] = [];

    // Handle role-based reminders
    if (targetRoles && Array.isArray(targetRoles) && targetRoles.length > 0) {
      console.log('Creating role-based reminder for roles:', targetRoles);
      const targetUsers = await userRepository.find({
        where: { role: In(targetRoles as UserRole[]) }
      });
      finalUserIds = targetUsers.map(user => user.id);
      console.log(`Found ${finalUserIds.length} users for roles:`, targetRoles);
    } 
    // Handle individual user reminders
    else if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      console.log('Creating individual user reminder for users:', userIds);
      // Validate that all user IDs exist
      const validUsers = await userRepository.findByIds(userIds);
      if (validUsers.length !== userIds.length) {
        return res.status(400).json({ message: 'Some user IDs are invalid' });
      }
      finalUserIds = userIds;
    } else {
      return res.status(400).json({ message: 'Either userIds or targetRoles is required' });
    }

    if (finalUserIds.length === 0) {
      return res.status(400).json({ message: 'No valid users found for the reminder' });
    }

    // Create the reminder notifications
    await notificationService.createBulkNotifications(
      finalUserIds,
      NotificationType.REMINDER,
      `⏰ ${title}`,
      message,
      undefined,
      'reminder',
      actionUrl || undefined
    );

    // Handle recurring reminders
    if (isRecurring && (recurringType === 'daily' || recurringType === 'weekly' || recurringType === 'monthly')) {
      console.log(`Setting up recurring reminder: ${recurringType}`, { recurringEndDate });
      
      const recurringReminderRepository = AppDataSource.getRepository(RecurringReminder);
      
      // Calculate next execution date
      const nextExecution = new Date();
      switch (recurringType) {
        case 'daily':
          nextExecution.setDate(nextExecution.getDate() + 1);
          break;
        case 'weekly':
          nextExecution.setDate(nextExecution.getDate() + 7);
          break;
        case 'monthly':
          nextExecution.setMonth(nextExecution.getMonth() + 1);
          break;
      }
      
      // Create recurring reminder record
      const recurringReminder = new RecurringReminder();
      recurringReminder.title = title;
      recurringReminder.message = message;
      recurringReminder.recurringType = recurringType as RecurringType;
      recurringReminder.actionUrl = actionUrl;
      recurringReminder.targetRoles = targetRoles || null;
      recurringReminder.targetUserIds = finalUserIds;
      recurringReminder.endDate = recurringEndDate ? new Date(recurringEndDate) : undefined;
      recurringReminder.isActive = true;
      recurringReminder.nextExecution = nextExecution;
      recurringReminder.createdById = currentUser.id;
      
      const savedRecurringReminder = await recurringReminderRepository.save(recurringReminder);
      
      console.log('Recurring reminder saved to database:', {
        id: savedRecurringReminder.id,
        title: savedRecurringReminder.title,
        recurringType: savedRecurringReminder.recurringType,
        nextExecution: savedRecurringReminder.nextExecution,
        recipientCount: finalUserIds.length
      });
    }

    res.json({
      message: isRecurring 
        ? `Recurring reminder (${recurringType}) set up successfully`
        : 'Reminder sent successfully',
      recipientCount: finalUserIds.length,
      isRecurring: !!isRecurring,
      recurringType: isRecurring ? recurringType : undefined
    });
  } catch (error) {
    console.error('Error creating reminder:', error);
    res.status(500).json({ message: 'Error creating reminder' });
  }
});

// Admin: Manual notification cleanup
router.post('/admin/cleanup', auth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userRepository = AppDataSource.getRepository(User);
    const currentUser = await userRepository.findOne({ where: { id: req.user.userId } });

    if (!currentUser || currentUser.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can trigger manual cleanup' });
    }

    console.log(`Manual notification cleanup triggered by admin: ${currentUser.username}`);

    // Mark old notifications for cleanup first
    const markedCount = await notificationService.markOldNotificationsForCleanup();
    
    // Perform cleanup
    const cleanupResult = await notificationService.performCleanup();

    res.json({
      message: 'Notification cleanup completed successfully',
      markedForCleanup: markedCount,
      ...cleanupResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error during manual cleanup:', error);
    res.status(500).json({ message: 'Error during notification cleanup' });
  }
});

// Admin: Get notification statistics
router.get('/admin/stats', auth, async (req: Request, res: Response) => {
  try {
    console.log('Admin stats request received from user:', req.user?.userId);
    
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userRepository = AppDataSource.getRepository(User);
    const currentUser = await userRepository.findOne({ where: { id: req.user.userId } });

    if (!currentUser || currentUser.role !== 'admin') {
      console.log('Access denied for user:', currentUser?.username, 'role:', currentUser?.role);
      return res.status(403).json({ message: 'Only admins can view notification statistics' });
    }

    console.log('Fetching notification statistics...');

    // Get the notification repository properly
    const notificationRepository = AppDataSource.getRepository(Notification);

    // Get basic statistics
    console.log('Getting basic counts...');
    const totalNotifications = await notificationRepository.count();
    const unreadNotifications = await notificationRepository.count({ where: { isRead: false } });
    const readNotifications = await notificationRepository.count({ where: { isRead: true } });

    console.log('Basic counts:', { totalNotifications, unreadNotifications, readNotifications });

    // Notifications by type
    console.log('Getting notifications by type...');
    const notificationsByType = await notificationRepository
      .createQueryBuilder('notification')
      .select('notification.type', 'type')
      .addSelect('COUNT(*)', 'count')
      .groupBy('notification.type')
      .getRawMany();

    console.log('Notifications by type:', notificationsByType);

    // Calculate date boundaries
    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    console.log('Date boundaries:', { now, sevenDaysAgo, thirtyDaysAgo });

    // Recent notifications (last 7 days)
    console.log('Getting recent notifications...');
    const recentNotifications = await notificationRepository
      .createQueryBuilder('notification')
      .where('notification.createdAt >= :sevenDaysAgo', { sevenDaysAgo })
      .getCount();

    // Medium old notifications (7-30 days)
    console.log('Getting medium old notifications...');
    const mediumOldNotifications = await notificationRepository
      .createQueryBuilder('notification')
      .where('notification.createdAt < :sevenDays', { sevenDays: sevenDaysAgo })
      .andWhere('notification.createdAt >= :thirtyDays', { thirtyDays: thirtyDaysAgo })
      .getCount();

    // Old notifications (30+ days)
    console.log('Getting old notifications...');
    const oldNotifications = await notificationRepository
      .createQueryBuilder('notification')
      .where('notification.createdAt < :thirtyDaysAgo', { thirtyDaysAgo })
      .getCount();

    console.log('Age counts:', { recentNotifications, mediumOldNotifications, oldNotifications });

    const result = {
      total: totalNotifications,
      unread: unreadNotifications,
      read: readNotifications,
      byType: notificationsByType.reduce((acc: any, item: any) => {
        acc[item.type] = parseInt(item.count);
        return acc;
      }, {}),
      byAge: {
        recent: recentNotifications,
        medium: mediumOldNotifications,
        old: oldNotifications
      },
      retentionPolicy: {
        readNotifications: '3 days',
        systemAnnouncements: '7 days (if read)',
        allNotifications: '14 days (maximum)',
        autoMarkReminders: '2 days'
      },
      lastUpdated: new Date().toISOString()
    };

    console.log('Sending stats result:', result);
    res.json(result);
  } catch (error) {
    console.error('Error fetching notification statistics:', error);
    res.status(500).json({ 
      message: 'Error fetching notification statistics', 
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Get recurring reminders (Admin and Managers)
router.get('/recurring-reminders', auth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userRepository = AppDataSource.getRepository(User);
    const currentUser = await userRepository.findOne({ where: { id: req.user.userId } });

    if (!currentUser || !['admin', 'general_manager', 'marketing_head'].includes(currentUser.role)) {
      return res.status(403).json({ message: 'Insufficient permissions to view recurring reminders' });
    }

    const recurringReminderRepository = AppDataSource.getRepository(RecurringReminder);
    const recurringReminders = await recurringReminderRepository.find({
      relations: ['createdBy'],
      order: { createdAt: 'DESC' }
    });

    // Calculate recipient counts for each reminder
    const remindersWithCounts = await Promise.all(recurringReminders.map(async (reminder) => {
      let recipientCount = 0;
      
      if (reminder.targetRoles && reminder.targetRoles.length > 0) {
        const targetUsers = await userRepository.find({
          where: { role: In(reminder.targetRoles as UserRole[]) }
        });
        recipientCount = targetUsers.length;
      } else if (reminder.targetUserIds && reminder.targetUserIds.length > 0) {
        recipientCount = reminder.targetUserIds.length;
      }

      return {
        ...reminder,
        recipientCount,
        // Don't expose sensitive user data
        createdBy: {
          id: reminder.createdBy.id,
          username: reminder.createdBy.username,
          role: reminder.createdBy.role
        }
      };
    }));

    res.json(remindersWithCounts);
  } catch (error) {
    console.error('Error fetching recurring reminders:', error);
    res.status(500).json({ message: 'Error fetching recurring reminders' });
  }
});

// Update recurring reminder (Admin and Managers)
router.put('/recurring-reminders/:id', auth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userRepository = AppDataSource.getRepository(User);
    const currentUser = await userRepository.findOne({ where: { id: req.user.userId } });

    if (!currentUser || !['admin', 'general_manager', 'marketing_head'].includes(currentUser.role)) {
      return res.status(403).json({ message: 'Insufficient permissions to update recurring reminders' });
    }

    const recurringReminderRepository = AppDataSource.getRepository(RecurringReminder);
    const reminderId = parseInt(req.params.id);
    
    const reminder = await recurringReminderRepository.findOne({ where: { id: reminderId } });
    if (!reminder) {
      return res.status(404).json({ message: 'Recurring reminder not found' });
    }

    const { title, message, isActive, endDate, recurringType, actionUrl, targetRoles, userIds } = req.body;

    // Update fields
    if (title !== undefined) reminder.title = title;
    if (message !== undefined) reminder.message = message;
    if (isActive !== undefined) reminder.isActive = isActive;
    if (endDate !== undefined) reminder.endDate = endDate ? new Date(endDate) : undefined;
    if (recurringType !== undefined) reminder.recurringType = recurringType;
    if (actionUrl !== undefined) reminder.actionUrl = actionUrl;
    if (targetRoles !== undefined) reminder.targetRoles = targetRoles;
    if (userIds !== undefined) reminder.targetUserIds = userIds;

    // Recalculate next execution if type changed
    if (recurringType !== undefined && reminder.isActive) {
      const nextExecution = new Date();
      switch (recurringType) {
        case 'daily':
          nextExecution.setDate(nextExecution.getDate() + 1);
          break;
        case 'weekly':
          nextExecution.setDate(nextExecution.getDate() + 7);
          break;
        case 'monthly':
          nextExecution.setMonth(nextExecution.getMonth() + 1);
          break;
      }
      reminder.nextExecution = nextExecution;
    }

    await recurringReminderRepository.save(reminder);

    res.json({ message: 'Recurring reminder updated successfully', reminder });
  } catch (error) {
    console.error('Error updating recurring reminder:', error);
    res.status(500).json({ message: 'Error updating recurring reminder' });
  }
});

// Delete recurring reminder (Admin and Managers)
router.delete('/recurring-reminders/:id', auth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userRepository = AppDataSource.getRepository(User);
    const currentUser = await userRepository.findOne({ where: { id: req.user.userId } });

    if (!currentUser || !['admin', 'general_manager', 'marketing_head'].includes(currentUser.role)) {
      return res.status(403).json({ message: 'Insufficient permissions to delete recurring reminders' });
    }

    const recurringReminderRepository = AppDataSource.getRepository(RecurringReminder);
    const reminderId = parseInt(req.params.id);
    
    const reminder = await recurringReminderRepository.findOne({ where: { id: reminderId } });
    if (!reminder) {
      return res.status(404).json({ message: 'Recurring reminder not found' });
    }

    await recurringReminderRepository.remove(reminder);

    res.json({ message: 'Recurring reminder deleted successfully' });
  } catch (error) {
    console.error('Error deleting recurring reminder:', error);
    res.status(500).json({ message: 'Error deleting recurring reminder' });
  }
});

export default router; 