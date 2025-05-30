import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Event } from './Event';
import { User } from './User';

@Entity('event_attachments')
export class EventAttachment {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Event, (event) => event.attachments)
  event!: Event;

  @Column()
  filename!: string;

  @Column()
  fileUrl!: string;

  @Column()
  fileType!: string;

  @ManyToOne(() => User)
  uploadedBy!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
} 