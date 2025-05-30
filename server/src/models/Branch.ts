import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from './User';
import { Event } from './Event';
import { BudgetAllocation } from './BudgetAllocation';

@Entity('branches')
export class Branch {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  name!: string;

  @Column()
  location!: string;

  @Column()
  region!: string;

  @OneToMany(() => User, user => user.branch)
  users!: User[];

  @OneToMany(() => Event, event => event.branch)
  events!: Event[];

  @OneToMany(() => BudgetAllocation, (budget) => budget.branch)
  budgetAllocations!: BudgetAllocation[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 