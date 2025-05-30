import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  ManyToMany,
  JoinTable,
  JoinColumn,
} from 'typeorm';
import { User } from './User';
import { Branch } from './Branch';
import { Product } from './Product';
import { EventAttachment } from './EventAttachment';
import { BudgetAllocation } from './BudgetAllocation';
import { EventType } from './EventType';
import { EventComment } from './EventComment';

export type EventStatus = 'draft' | 'pending_gm' | 'pending_marketing' | 'approved' | 'rejected' | 'completed';

@Entity('events')
export class Event {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  title!: string;

  @Column('text')
  description!: string;

  @Column()
  location!: string;

  @Column()
  startDate!: Date;

  @Column()
  endDate!: Date;

  @Column({
    type: 'enum',
    enum: ['draft', 'pending_gm', 'pending_marketing', 'approved', 'rejected', 'completed'],
    default: 'draft'
  })
  status!: EventStatus;

  @Column('decimal', { precision: 10, scale: 2 })
  budget!: number;

  @Column({ default: true })
  isActive!: boolean;

  @ManyToOne(() => User, user => user.events)
  @JoinColumn({ name: 'user_id' })
  organizer!: User;

  @Column({ name: 'user_id', nullable: true })
  userId!: number;

  @ManyToOne(() => Branch, branch => branch.events)
  @JoinColumn({ name: 'branch_id' })
  branch!: Branch;

  @Column({ name: 'branch_id', type: 'int', nullable: false })
  branchId!: number;

  @ManyToMany(() => Product)
  @JoinTable()
  products!: Product[];

  @ManyToOne(() => EventType)
  @JoinColumn({ name: 'event_type_id' })
  eventType!: EventType;

  @Column({ default: true })
  isPlanned!: boolean;

  @Column('int', { nullable: true })
  enquiryTarget!: number;

  @Column('int', { nullable: true })
  orderTarget!: number;

  // Planned Metrics
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  plannedBudget!: number | null;

  @Column('int', { nullable: true })
  plannedEnquiries!: number | null;

  @Column('int', { nullable: true })
  plannedOrders!: number | null;

  // Actual Metrics
  @Column('decimal', { precision: 10, scale: 2, nullable: true })
  actualBudget!: number | null;

  @Column('int', { nullable: true })
  actualEnquiries!: number | null;

  @Column('int', { nullable: true })
  actualOrders!: number | null;

  @OneToMany(() => EventAttachment, attachment => attachment.event)
  attachments!: EventAttachment[];

  @OneToMany(() => BudgetAllocation, allocation => allocation.event)
  budgetAllocations!: BudgetAllocation[];

  @OneToMany(() => EventComment, comment => comment.event)
  comments!: EventComment[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 