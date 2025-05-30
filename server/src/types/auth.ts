export enum UserRole {
  ADMIN = 'admin',
  SALES_MANAGER = 'sales_manager',
  GENERAL_MANAGER = 'general_manager',
  MARKETING_MANAGER = 'marketing_manager',
  MARKETING_HEAD = 'marketing_head'
}

export interface UserPayload {
  userId: number;
  email: string;
  role: UserRole;
} 