import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from './contexts/ThemeProvider';
import { UserProvider } from './contexts/UserContext';
import Layout from './layouts/Layout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Dashboard from './pages/Dashboard';
import Events from './pages/events/Events';
import EventDetails from './pages/events/EventDetails';
import EventForm from './pages/events/EventForm';
import EventCalendar from './pages/events/EventCalendar';
import Users from './pages/users/Users';
import UserProfile from './pages/users/UserProfile';
import Branches from './pages/branches/Branches';
import Products from './pages/products/Products';
import PendingApprovalsPage from './pages/PendingApprovals';
import EventTypes from './pages/EventTypes';
import Notifications from './pages/Notifications';
import NotificationManager from './pages/admin/NotificationManager';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

// Create a context for auth state
export const AuthContext = React.createContext<{
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
}>({
  isAuthenticated: false,
  setIsAuthenticated: () => {},
});

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('token') !== null;
  });

  // Update auth state when token changes
  useEffect(() => {
    const handleStorageChange = () => {
      setIsAuthenticated(localStorage.getItem('token') !== null);
    };

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return (
    <ThemeProvider>
      <UserProvider>
        <CssBaseline />
        <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated }}>
          <BrowserRouter>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/dashboard" />} />
              <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/dashboard" />} />

              {/* Protected routes */}
              <Route element={<Layout />}>
                <Route path="/dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
                <Route path="/notifications" element={isAuthenticated ? <Notifications /> : <Navigate to="/login" />} />
                <Route path="/pending-approvals" element={
                  <ProtectedRoute requiredRoles={['admin', 'general_manager', 'marketing_head']}>
                    <PendingApprovalsPage />
                  </ProtectedRoute>
                } />
                <Route path="/events" element={isAuthenticated ? <Events /> : <Navigate to="/login" />} />
                <Route path="/events/:id" element={isAuthenticated ? <EventDetails /> : <Navigate to="/login" />} />
                <Route path="/events/new" element={isAuthenticated ? <EventForm /> : <Navigate to="/login" />} />
                <Route path="/events/edit/:id" element={isAuthenticated ? <EventForm /> : <Navigate to="/login" />} />
                <Route path="/events/calendar" element={isAuthenticated ? <EventCalendar /> : <Navigate to="/login" />} />
                <Route path="/profile" element={isAuthenticated ? <UserProfile /> : <Navigate to="/login" />} />
                
                {/* Admin-only routes */}
                <Route path="/users" element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <Users />
                  </ProtectedRoute>
                } />
                <Route path="/branches" element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <Branches />
                  </ProtectedRoute>
                } />
                <Route path="/products" element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <Products />
                  </ProtectedRoute>
                } />
                <Route path="/event-types" element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <EventTypes />
                  </ProtectedRoute>
                } />
                <Route path="/admin/notifications" element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <NotificationManager />
                  </ProtectedRoute>
                } />
              </Route>

              {/* Redirect root to dashboard or login */}
              <Route path="/" element={<Navigate to={isAuthenticated ? "/dashboard" : "/login"} />} />
              
              {/* 404 page */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthContext.Provider>
      </UserProvider>
    </ThemeProvider>
  );
}

export default App;
