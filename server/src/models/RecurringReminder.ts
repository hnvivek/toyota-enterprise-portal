import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './User';

export enum RecurringType {
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

@Entity('recurring_reminders')
export class RecurringReminder {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column('text')
  message!: string;

  @Column({
    type: 'enum',
    enum: RecurringType
  })
  recurringType!: RecurringType;

  @Column({ nullable: true })
  actionUrl?: string;

  @Column('json', { nullable: true })
  targetRoles?: string[];

  @Column('json', { nullable: true })
  targetUserIds?: number[];

  @Column({ type: 'date', nullable: true })
  endDate?: Date;

  @Column({ default: true })
  isActive!: boolean;

  @Column({ nullable: true })
  lastExecuted?: Date;

  @Column({ nullable: true })
  nextExecution?: Date;

  @Column()
  createdById!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'createdById' })
  createdBy!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 