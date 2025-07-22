import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from './contexts/ThemeProvider';
import { UserProvider } from './contexts/UserContext';
import Layout from './layouts/Layout';
import HomeLayout from './layouts/HomeLayout';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import Home from './pages/Home';
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
import AdminTools from './pages/admin/AdminTools';
import NotFound from './pages/NotFound';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

// Create a Coming Soon component for Training
const ComingSoon = () => (
  <div style={{ 
    display: 'flex', 
    flexDirection: 'column', 
    alignItems: 'center', 
    justifyContent: 'center', 
    minHeight: '100vh',
    textAlign: 'center',
    padding: '2rem'
  }}>
    <h1>Training Application</h1>
    <p>Coming Soon...</p>
    <p>This application is currently under development.</p>
    <button 
      onClick={() => window.history.back()}
      style={{
        marginTop: '1rem',
        padding: '0.75rem 1.5rem',
        backgroundColor: '#1976d2',
        color: 'white',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
      }}
    >
      Go Back
    </button>
  </div>
);

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
              <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to="/home" />} />
              <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to="/home" />} />

              {/* Home/Application Launcher - uses HomeLayout */}
              <Route element={<HomeLayout />}>
                <Route path="/home" element={isAuthenticated ? <Home /> : <Navigate to="/login" />} />
              </Route>

              {/* Marketing Application Routes - uses Layout with sidebar */}
              <Route path="/marketing" element={<Layout />}>
                <Route path="dashboard" element={isAuthenticated ? <Dashboard /> : <Navigate to="/login" />} />
                <Route path="notifications" element={isAuthenticated ? <Notifications /> : <Navigate to="/login" />} />
                <Route path="pending-approvals" element={
                  <ProtectedRoute requiredRoles={['admin', 'general_manager', 'marketing_head']}>
                    <PendingApprovalsPage />
                  </ProtectedRoute>
                } />
                <Route path="events" element={isAuthenticated ? <Events /> : <Navigate to="/login" />} />
                <Route path="events/new" element={isAuthenticated ? <EventForm /> : <Navigate to="/login" />} />
                <Route path="events/edit/:id" element={isAuthenticated ? <EventForm /> : <Navigate to="/login" />} />
                <Route path="events/calendar" element={isAuthenticated ? <EventCalendar /> : <Navigate to="/login" />} />
                <Route path="events/:id" element={isAuthenticated ? <EventDetails /> : <Navigate to="/login" />} />
                <Route path="profile" element={isAuthenticated ? <UserProfile /> : <Navigate to="/login" />} />
                
                {/* Admin-only routes */}
                <Route path="users" element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <Users />
                  </ProtectedRoute>
                } />
                <Route path="branches" element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <Branches />
                  </ProtectedRoute>
                } />
                <Route path="products" element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <Products />
                  </ProtectedRoute>
                } />
                <Route path="event-types" element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <EventTypes />
                  </ProtectedRoute>
                } />
                <Route path="admin/notifications" element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <NotificationManager />
                  </ProtectedRoute>
                } />
                <Route path="admin/tools" element={
                  <ProtectedRoute requiredRoles={['admin']}>
                    <AdminTools />
                  </ProtectedRoute>
                } />
                
                {/* Default redirect for /marketing to /marketing/dashboard */}
                <Route path="" element={<Navigate to="dashboard" replace />} />
              </Route>

              {/* Training Application - Coming Soon */}
              <Route path="/training" element={<ComingSoon />} />

              {/* Backward compatibility redirects */}
              <Route path="/dashboard" element={<Navigate to="/marketing/dashboard" replace />} />
              <Route path="/events" element={<Navigate to="/marketing/events" replace />} />
              <Route path="/events/*" element={<Navigate to="/marketing/events" replace />} />
              <Route path="/users" element={<Navigate to="/marketing/users" replace />} />
              <Route path="/branches" element={<Navigate to="/marketing/branches" replace />} />
              <Route path="/products" element={<Navigate to="/marketing/products" replace />} />
              <Route path="/profile" element={<Navigate to="/marketing/profile" replace />} />
              <Route path="/notifications" element={<Navigate to="/marketing/notifications" replace />} />
              <Route path="/pending-approvals" element={<Navigate to="/marketing/pending-approvals" replace />} />
              <Route path="/event-types" element={<Navigate to="/marketing/event-types" replace />} />
              <Route path="/admin/*" element={<Navigate to="/marketing/admin/tools" replace />} />

              {/* Redirect root to home or login */}
              <Route path="/" element={<Navigate to={isAuthenticated ? "/home" : "/login"} />} />
              
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
