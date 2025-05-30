export type EventStatus = 'draft' | 'pending' | 'approved' | 'rejected' | 'completed';

export interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  startDate: string | Date;
  endDate: string | Date;
  status: EventStatus;
  budget: number;
  organizer: {
    id: number;
    name: string;
  };
  branch: {
    id: number;
    name: string;
  };
  products: Array<{
    id: number;
    name: string;
  }>;
  attachments: Array<{
    id: number;
    filename: string;
    url: string;
  }>;
  budgetAllocations: Array<{
    id: number;
    amount: number;
    description: string;
  }>;
  createdAt: string;
  updatedAt: string;
} 