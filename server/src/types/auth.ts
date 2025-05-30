export enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MANAGER = 'manager',
  SALES_MANAGER = 'sales_manager',
  GENERAL_MANAGER = 'general_manager',
  MARKETING_HEAD = 'marketing_head',
  MARKETING_MANAGER = 'marketing_manager'
}

export interface UserPayload {
  userId: number;
  email: string;
  role: UserRole;
} 