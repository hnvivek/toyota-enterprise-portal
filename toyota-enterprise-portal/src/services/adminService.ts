import { api } from '../config/api';

// Helper function to get auth headers
const getAuthHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  };
};

export const adminService = {
  // Manual seed for development/testing
  async runManualSeed(): Promise<{ message: string }> {
    const response = await api.post(
      `/auth/manual-seed`,
      {},
      getAuthHeaders()
    );
    return response.data;
  },
}; 