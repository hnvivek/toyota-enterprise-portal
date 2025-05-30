import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { api } from '../config/api';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  region?: string;
  branch?: {
    id: number;
    name: string;
    location: string;
    region: string;
  };
}

interface UserContextType {
  currentUser: User | null;
  loading: boolean;
  updateUser: (userData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
  logout: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

// Track if interceptor is setup to avoid duplicates
let interceptorSetup = false;

export const UserProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const logout = () => {
    console.log('Logging out user...');
    localStorage.removeItem('token');
    setCurrentUser(null);
    setLoading(false);
    sessionStorage.clear();
    
    // Force redirect to login
    window.location.href = '/login';
  };

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.log('No token found, setting user to null');
        setCurrentUser(null);
        setLoading(false);
        return;
      }

      console.log('Fetching current user with token...');
      const response = await api.get('/users/profile', {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('User fetched successfully:', response.data);
      setCurrentUser(response.data);
    } catch (error: any) {
      console.error('Error fetching current user:', error);
      
      // Only logout on auth errors, not network errors
      if (error.response?.status === 401 || error.response?.status === 403) {
        console.log('Token invalid, logging out...');
        logout();
        return;
      }
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    console.log('Refreshing user data...');
    setLoading(true);
    await fetchCurrentUser();
  };

  const updateUser = (userData: Partial<User>) => {
    console.log('Updating user data locally:', userData);
    setCurrentUser(prev => prev ? { ...prev, ...userData } : null);
  };

  // Setup axios interceptor (but avoid login interference)
  useEffect(() => {
    if (!interceptorSetup) {
      interceptorSetup = true;
      
      // Response interceptor to handle auth errors (but not during login)
      const responseInterceptor = api.interceptors.response.use(
        (response) => response,
        (error) => {
          // Don't auto-logout if this is a login request failing
          if (error.config?.url?.includes('/login') || error.config?.url?.includes('/auth')) {
            return Promise.reject(error);
          }
          
          // Only auto-logout for auth errors on protected routes
          if (error.response?.status === 401 && localStorage.getItem('token')) {
            console.log('401 error on protected route, logging out...');
            logout();
          }
          return Promise.reject(error);
        }
      );

      // Cleanup interceptor on unmount
      return () => {
        api.interceptors.response.eject(responseInterceptor);
        interceptorSetup = false;
      };
    }
  }, []);

  // Listen for storage changes (when user logs in/out in another tab)
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'token') {
        if (e.newValue === null) {
          // Token was removed (logout)
          console.log('Token removed, clearing user state');
          setCurrentUser(null);
          setLoading(false);
        } else if (e.oldValue === null && e.newValue) {
          // Token was added (login)
          console.log('Token added, fetching user data');
          fetchCurrentUser();
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  // Initial user fetch on mount
  useEffect(() => {
    console.log('UserProvider mounted, fetching initial user data');
    fetchCurrentUser();
  }, []);

  return (
    <UserContext.Provider value={{ currentUser, loading, updateUser, refreshUser, logout }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export default UserContext; 