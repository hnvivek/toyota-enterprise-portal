import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Event } from './Event';
import { Branch } from './Branch';

@Entity('budget_allocations')
export class BudgetAllocation {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column('decimal', { precision: 10, scale: 2 })
  amount!: number;

  @Column()
  year!: number;

  @Column()
  quarter!: number;

  @ManyToOne(() => Event)
  event!: Event;

  @ManyToOne(() => Branch)
  branch!: Branch;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 