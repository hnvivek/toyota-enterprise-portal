import axios from 'axios';

const API_BASE_URL = 'http://localhost:8080/api';

const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: { Authorization: `Bearer ${token}` },
  };
};

export interface EventFilters {
  branchId?: string | number;
  status?: string;
  eventTypeId?: string | number;
  startDate?: string;
  endDate?: string;
  minBudget?: string | number;
  maxBudget?: string | number;
  search?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export interface EventsResponse {
  events: Event[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalCount: number;
    limit: number;
    hasNextPage: boolean;
    hasPreviousPage: boolean;
  };
  filters: {
    branchId: string | null;
    status: string | null;
    startDate: string | null;
    endDate: string | null;
    search: string | null;
  };
}

export interface FilterOptions {
  branches: {
    id: number;
    name: string;
    location: string;
  }[];
  eventTypes: {
    id: number;
    name: string;
    category: string;
  }[];
  statuses: {
    value: string;
    label: string;
  }[];
  dateRange: {
    minDate: string | null;
    maxDate: string | null;
  };
}

export interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  status: string;
  budget: number;
  isActive: boolean;
  userId: number;
  branchId: number;
  isPlanned: boolean;
  enquiryTarget: number;
  orderTarget: number;
  plannedBudget: number;
  plannedEnquiries: number;
  plannedOrders: number;
  actualBudget: number;
  actualEnquiries: number;
  actualOrders: number;
  createdAt: string;
  updatedAt: string;
  isNew?: boolean;
  branch: {
    id: number;
    name: string;
    location: string;
    region: string;
  };
  products: any[];
  attachments: any[];
  budgetAllocations: any[];
  eventType: {
    id: number;
    name: string;
    description: string;
    category: string;
  };
}

export const eventService = {
  // Get events with filtering
  async getEvents(filters: EventFilters = {}): Promise<EventsResponse> {
    const params = new URLSearchParams();
    
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params.append(key, String(value));
      }
    });

    const response = await axios.get(
      `${API_BASE_URL}/events?${params.toString()}`,
      getAuthHeaders()
    );
    return response.data;
  },

  // Get filter options
  async getFilterOptions(): Promise<FilterOptions> {
    const response = await axios.get(
      `${API_BASE_URL}/events/filter-options`,
      getAuthHeaders()
    );
    return response.data;
  },

  // Get recent events
  async getRecentEvents(branchId?: number, limit: number = 5): Promise<Event[]> {
    const params = new URLSearchParams();
    if (branchId) params.append('branchId', String(branchId));
    params.append('limit', String(limit));

    const response = await axios.get(
      `${API_BASE_URL}/events/recent?${params.toString()}`,
      getAuthHeaders()
    );
    return response.data;
  },

  // Get event by ID
  async getEventById(id: number): Promise<Event> {
    const response = await axios.get(
      `${API_BASE_URL}/events/${id}`,
      getAuthHeaders()
    );
    return response.data;
  },

  // Create event
  async createEvent(eventData: Partial<Event>): Promise<Event> {
    const response = await axios.post(
      `${API_BASE_URL}/events`,
      eventData,
      getAuthHeaders()
    );
    return response.data;
  },

  // Update event
  async updateEvent(id: number, eventData: Partial<Event>): Promise<Event> {
    const response = await axios.put(
      `${API_BASE_URL}/events/${id}`,
      eventData,
      getAuthHeaders()
    );
    return response.data;
  },

  // Delete event
  async deleteEvent(id: number): Promise<void> {
    await axios.delete(
      `${API_BASE_URL}/events/${id}`,
      getAuthHeaders()
    );
  },

  // Get pending approvals for current user
  async getPendingApprovals(): Promise<Event[]> {
    const response = await axios.get(
      `${API_BASE_URL}/events/pending-approvals`,
      getAuthHeaders()
    );
    return response.data;
  },
}; 