import { DataSource } from 'typeorm';
import { User } from '../models/User';
import { Event } from '../models/Event';
import { Branch } from '../models/Branch';
import { Product } from '../models/Product';
import { EventType } from '../models/EventType';
import { EventAttachment } from '../models/EventAttachment';
import { BudgetAllocation } from '../models/BudgetAllocation';
import { EventComment } from '../models/EventComment';
import { Notification } from '../models/Notification';
import { RecurringReminder } from '../models/RecurringReminder';

export const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  username: process.env.DB_USERNAME || 'postgres',
  password: process.env.DB_PASSWORD || 'postgres',
  database: process.env.DB_NAME || 'toyota_enterprise_portal',
  synchronize: true,
  logging: true,
  entities: [Event, Branch, Product, EventType, User, EventAttachment, BudgetAllocation, EventComment, Notification, RecurringReminder],
  subscribers: [],
  migrations: []
}); 