import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import { Branch } from './Branch';
import { Event } from './Event';
import { UserRole } from '../types/auth';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  username!: string;

  @Column({ unique: true })
  email!: string;

  @Column()
  password!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.USER
  })
  role!: UserRole;

  @ManyToOne(() => Branch, { nullable: true })
  branch!: Branch;

  @Column({ type: 'varchar', length: 255, nullable: true })
  region?: string;

  @Column({ type: 'timestamp', nullable: true })
  lastSeenEvents?: Date;

  @OneToMany(() => Event, event => event.organizer)
  events!: Event[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 