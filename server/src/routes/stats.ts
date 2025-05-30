import { Router, Request, Response } from 'express';
import { auth } from '../middleware/auth';
import { eventStatsService } from '../services/eventStatsService';
import { notificationService } from '../services/notificationService';
import { AppDataSource } from '../config/database';
import { Event } from '../models/Event';
import { User } from '../models/User';

const router = Router();

// Get dashboard stats for current user
router.get('/dashboard', auth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    // Get event attention stats
    const eventStats = await eventStatsService.getEventsRequiringAttention(
      req.user.userId, 
      req.user.role
    );

    // Get notification count
    const notificationResult = await notificationService.getUserNotifications(req.user.userId, 1, 0);

    res.json({
      events: {
        newEvents: eventStats.newEvents,
        pendingApprovals: eventStats.pendingApprovals,
        myDraftEvents: eventStats.myEvents
      },
      notifications: {
        unreadCount: notificationResult.unreadCount
      }
    });
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    res.status(500).json({ message: 'Error fetching dashboard stats' });
  }
});

// Get event badge count (for Events menu item)
router.get('/events/badge', auth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    console.log('Badge request for user:', req.user.userId, 'role:', req.user.role);

    const stats = await eventStatsService.getEventsRequiringAttention(
      req.user.userId, 
      req.user.role
    );

    console.log('Event stats breakdown:', stats);

    // Return separate counts for different badges
    const response = {
      newEvents: stats.newEvents,
      pendingApprovals: stats.pendingApprovals,
      myDraftEvents: stats.myEvents,
      // Legacy field for backward compatibility
      count: stats.pendingApprovals + stats.newEvents
    };

    console.log('Badge response:', response);

    res.json(response);
  } catch (error) {
    console.error('Error fetching event badge count:', error);
    res.status(500).json({ message: 'Error fetching event badge count' });
  }
});

// Get overall event statistics (admin only)
router.get('/events/overview', auth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const statusStats = await eventStatsService.getEventStatusStats();
    const recentActivity = await eventStatsService.getRecentActivity(10);

    res.json({
      statusBreakdown: statusStats,
      recentActivity
    });
  } catch (error) {
    console.error('Error fetching event overview:', error);
    res.status(500).json({ message: 'Error fetching event overview' });
  }
});

// Mark events as seen (when user visits events page)
router.post('/events/mark-seen', auth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    await eventStatsService.markEventsAsSeen(req.user.userId);
    res.json({ message: 'Events marked as seen' });
  } catch (error) {
    console.error('Error marking events as seen:', error);
    res.status(500).json({ message: 'Error marking events as seen' });
  }
});

// Debug route to check total events
router.get('/debug/events', auth, async (req: Request, res: Response) => {
  try {
    const eventRepository = AppDataSource.getRepository(Event);
    const totalEvents = await eventRepository.count();
    const allEvents = await eventRepository.find({ 
      select: ['id', 'title', 'status', 'createdAt', 'userId'],
      order: { createdAt: 'DESC' },
      take: 10
    });

    res.json({
      totalEvents,
      recentEvents: allEvents
    });
  } catch (error) {
    console.error('Error in debug route:', error);
    res.status(500).json({ message: 'Error in debug route' });
  }
});

// Debug badge count breakdown
router.get('/debug/badge-breakdown', auth, async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: req.user.userId } });

    console.log('=== BADGE BREAKDOWN DEBUG ===');
    console.log('User:', { id: req.user.userId, role: req.user.role });
    console.log('lastSeenEvents:', user?.lastSeenEvents);

    const stats = await eventStatsService.getEventsRequiringAttention(
      req.user.userId, 
      req.user.role
    );

    const badgeTotal = stats.pendingApprovals + stats.newEvents;

    res.json({
      user: {
        id: req.user.userId,
        role: req.user.role,
        lastSeenEvents: user?.lastSeenEvents
      },
      breakdown: {
        pendingApprovals: stats.pendingApprovals,
        newEventsSinceLastSeen: stats.newEvents,
        myDraftEvents: stats.myEvents
      },
      badgeTotal: badgeTotal,
      calculation: `${stats.pendingApprovals} (pending) + ${stats.newEvents} (new) = ${badgeTotal}`,
      explanation: {
        pendingApprovals: "Events waiting for your approval based on your role",
        newEventsSinceLastSeen: "Events created after your lastSeenEvents timestamp",
        myDraftEvents: "Your own draft events (not included in badge)"
      }
    });
  } catch (error) {
    console.error('Error in badge breakdown:', error);
    res.status(500).json({ message: 'Error in badge breakdown' });
  }
});

export default router; 