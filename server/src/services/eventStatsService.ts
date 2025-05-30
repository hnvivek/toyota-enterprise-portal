import { AppDataSource } from '../config/database';
import { Event } from '../models/Event';
import { User } from '../models/User';
import { UserRole } from '../types/auth';

export class EventStatsService {
  private eventRepository = AppDataSource.getRepository(Event);
  private userRepository = AppDataSource.getRepository(User);

  // Get count of events created since user's last seen timestamp
  async getNewEventsCountSinceLastSeen(userId: number): Promise<number> {
    const user = await this.userRepository.findOne({ where: { id: userId } });
    
    if (!user || !user.lastSeenEvents) {
      // If no lastSeenEvents timestamp, show events from last 24 hours as default
      const cutoffDate = new Date();
      cutoffDate.setHours(cutoffDate.getHours() - 24);
      
      const count = await this.eventRepository
        .createQueryBuilder('event')
        .where('event.createdAt >= :cutoffDate', { cutoffDate })
        .getCount();
      return count;
    }

    const count = await this.eventRepository
      .createQueryBuilder('event')
      .where('event.createdAt > :lastSeen', { lastSeen: user.lastSeenEvents })
      .getCount();

    return count;
  }

  // Get count of events created in the last N days (keep for backward compatibility)
  async getNewEventsCount(userId: number, daysBack: number = 7): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysBack);

    const count = await this.eventRepository
      .createQueryBuilder('event')
      .where('event.createdAt >= :cutoffDate', { cutoffDate })
      .getCount();

    return count;
  }

  // Get count of pending approvals for a user based on their role
  async getPendingApprovalsCount(userId: number, userRole: UserRole): Promise<number> {
    const queryBuilder = this.eventRepository.createQueryBuilder('event');

    switch (userRole) {
      case UserRole.GENERAL_MANAGER:
        // GMs should only see events from their branch
        const gmUser = await this.userRepository.findOne({ 
          where: { id: userId },
          relations: ['branch']
        });
        
        if (!gmUser || !gmUser.branch) {
          console.log('GM has no branch assigned, returning 0 pending approvals');
          return 0;
        }
        
        queryBuilder
          .where('event.status = :status', { status: 'pending_gm' })
          .andWhere('event.branchId = :branchId', { branchId: gmUser.branch.id });
        break;
        
      case UserRole.MARKETING_HEAD:
        queryBuilder.where('event.status = :status', { status: 'pending_marketing' });
        break;
        
      case UserRole.ADMIN:
        queryBuilder.where('event.status IN (:...statuses)', { 
          statuses: ['pending_gm', 'pending_marketing'] 
        });
        break;
        
      default:
        return 0; // Regular users don't have pending approvals
    }

    const count = await queryBuilder.getCount();
    console.log(`Pending approvals count for ${userRole}:`, count);
    return count;
  }

  // Get events requiring user's attention (for notifications)
  async getEventsRequiringAttention(userId: number, userRole: UserRole): Promise<{
    newEvents: number;
    pendingApprovals: number;
    myEvents: number;
  }> {
    console.log('Getting events requiring attention for user:', userId, 'role:', userRole);
    
    const newEvents = await this.getNewEventsCountSinceLastSeen(userId);
    console.log('New events since last seen:', newEvents);
    
    const pendingApprovals = await this.getPendingApprovalsCount(userId, userRole);
    console.log('Pending approvals count:', pendingApprovals);
    
    // Count user's own events that need action
    const myEvents = await this.eventRepository.count({
      where: {
        userId: userId,
        status: 'draft' // Draft events need completion
      }
    });
    console.log('My draft events count:', myEvents);

    return {
      newEvents,
      pendingApprovals,
      myEvents
    };
  }

  // Get recent events activity for dashboard
  async getRecentActivity(limit: number = 5): Promise<Event[]> {
    return await this.eventRepository.find({
      relations: ['organizer', 'branch'],
      order: { createdAt: 'DESC' },
      take: limit
    });
  }

  // Get event statistics by status
  async getEventStatusStats(): Promise<{[key: string]: number}> {
    const stats = await this.eventRepository
      .createQueryBuilder('event')
      .select('event.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('event.status')
      .getRawMany();

    const result: {[key: string]: number} = {};
    stats.forEach(stat => {
      result[stat.status] = parseInt(stat.count);
    });

    return result;
  }

  // Update user's last seen events timestamp
  async markEventsAsSeen(userId: number): Promise<void> {
    await this.userRepository.update(
      { id: userId },
      { lastSeenEvents: new Date() }
    );
  }
}

export const eventStatsService = new EventStatsService(); 