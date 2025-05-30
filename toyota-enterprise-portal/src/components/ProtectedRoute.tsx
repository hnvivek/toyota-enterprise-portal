import React, { useEffect, useState, useContext } from 'react';
import { Navigate } from 'react-router-dom';
import { Box, CircularProgress, Typography } from '@mui/material';
import { api } from '../config/api';
import { AuthContext } from '../App';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

interface CurrentUser {
  id: number;
  username: string;
  email: string;
  role: string;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, requiredRoles }) => {
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) {
          setLoading(false);
          return;
        }

        const response = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });

        setCurrentUser(response.data);
        setIsAuthenticated(true);
      } catch (error) {
        console.error('Auth check failed:', error);
        localStorage.removeItem('token');
        setIsAuthenticated(false);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '50vh' }}>
        <CircularProgress size={40} />
        <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
          Checking permissions...
        </Typography>
      </Box>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If specific roles are required, check user role
  if (requiredRoles && requiredRoles.length > 0) {
    if (!currentUser || !requiredRoles.includes(currentUser.role)) {
      return (
        <Box sx={{ p: 3, textAlign: 'center' }}>
          <Typography variant="h5" color="error" gutterBottom>
            Access Denied
          </Typography>
          <Typography variant="body1" color="text.secondary">
            You don't have permission to access this page.
          </Typography>
        </Box>
      );
    }
  }

  return <>{children}</>;
};

export default ProtectedRoute; 