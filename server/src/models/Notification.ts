import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

export enum NotificationType {
  EVENT_CREATED = 'event_created',
  EVENT_APPROVED = 'event_approved',
  EVENT_REJECTED = 'event_rejected',
  EVENT_UPDATED = 'event_updated',
  BUDGET_APPROVED = 'budget_approved',
  BUDGET_REJECTED = 'budget_rejected',
  SYSTEM_ANNOUNCEMENT = 'system_announcement',
  REMINDER = 'reminder'
}

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({
    type: 'enum',
    enum: NotificationType,
    default: NotificationType.SYSTEM_ANNOUNCEMENT
  })
  type!: NotificationType;

  @Column({ length: 255 })
  title!: string;

  @Column('text')
  message!: string;

  @Column({ default: false })
  isRead!: boolean;

  @Column({ nullable: true })
  relatedEntityId?: number;

  @Column({ length: 50, nullable: true })
  relatedEntityType?: string; // 'event', 'user', etc.

  @Column('text', { nullable: true })
  actionUrl?: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column()
  userId!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 