import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Event } from './Event';
import { User } from './User';

@Entity('event_comments')
export class EventComment {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('text')
  comment!: string;

  @Column({
    type: 'enum',
    enum: ['feedback', 'approval', 'rejection', 'general'],
    default: 'general'
  })
  commentType!: 'feedback' | 'approval' | 'rejection' | 'general';

  @Column({ nullable: true })
  statusFrom!: string;

  @Column({ nullable: true })
  statusTo!: string;

  @ManyToOne(() => Event, { onDelete: 'CASCADE' })
  event!: Event;

  @ManyToOne(() => User)
  commentedBy!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 