import React, { useState, useContext } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  TextField,
  Button,
  Link,
  Paper,
  Alert,
  Divider,
  Chip,
} from '@mui/material';
import {
  AdminPanelSettings as AdminIcon,
  Person as SalesIcon,
  Business as BusinessIcon,
  Campaign as MarketingIcon,
  TrendingUp as HeadIcon,
} from '@mui/icons-material';
import { api } from '../../config/api';
import { AuthContext } from '../../App';
import { useUser } from '../../contexts/UserContext';

const Login = () => {
  const navigate = useNavigate();
  const { setIsAuthenticated } = useContext(AuthContext);
  const { refreshUser } = useUser();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Quick login user data
  const quickLoginUsers = [
    {
      role: 'Admin',
      email: 'admin@toyota.com',
      password: 'admin123',
      icon: <AdminIcon />,
      color: '#e91e63'
    },
    {
      role: 'Sales Manager',
      email: 'priya.sales@toyota.com',
      password: 'sales123',
      icon: <SalesIcon />,
      color: '#2196f3'
    },
    {
      role: 'General Manager',
      email: 'rajesh.gm@toyota.com',
      password: 'gm123',
      icon: <BusinessIcon />,
      color: '#ff9800'
    },
    {
      role: 'Marketing Manager',
      email: 'arun.marketing@toyota.com',
      password: 'marketing123',
      icon: <MarketingIcon />,
      color: '#4caf50'
    },
    {
      role: 'Marketing Head',
      email: 'kavya.head@toyota.com',
      password: 'head123',
      icon: <HeadIcon />,
      color: '#9c27b0'
    }
  ];

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', formData);
      localStorage.setItem('token', response.data.token);
      setIsAuthenticated(true);
      
      // Immediately refresh user data after login
      await refreshUser();
      
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  const handleQuickLogin = async (user: any) => {
    setError('');
    setLoading(true);
    
    // Update form data to show the credentials
    setFormData({
      email: user.email,
      password: user.password,
    });

    try {
      const response = await api.post('/auth/login', {
        email: user.email,
        password: user.password,
      });
      localStorage.setItem('token', response.data.token);
      setIsAuthenticated(true);
      
      // Immediately refresh user data after login
      await refreshUser();
      
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'An error occurred during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="xs">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            padding: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            width: '100%',
          }}
        >
          <Typography component="h1" variant="h5">
            Toyota Enterprise Portal
          </Typography>
          
          {/* Quick Login Section */}
          <Box sx={{ mt: 3, mb: 3, width: '100%' }}>
            <Typography variant="h6" sx={{ mb: 2, textAlign: 'center' }}>
              Quick Login
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {quickLoginUsers.map((user) => (
                <Button
                  key={user.role}
                  variant="outlined"
                  fullWidth
                  disabled={loading}
                  onClick={() => handleQuickLogin(user)}
                  startIcon={user.icon}
                  sx={{
                    borderColor: user.color,
                    color: user.color,
                    '&:hover': {
                      borderColor: user.color,
                      backgroundColor: `${user.color}10`,
                    }
                  }}
                >
                  Login as {user.role}
                </Button>
              ))}
            </Box>
          </Box>

          <Divider sx={{ width: '100%', mb: 3 }}>
            <Chip label="OR" />
          </Divider>

          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <TextField
              margin="normal"
              required
              fullWidth
              id="email"
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              id="password"
              autoComplete="current-password"
              value={formData.password}
              onChange={handleChange}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              disabled={loading}
              sx={{ mt: 3, mb: 2 }}
            >
              {loading ? 'Signing In...' : 'Sign In'}
            </Button>
            <Box sx={{ textAlign: 'center' }}>
              <Link component={RouterLink} to="/register" variant="body2">
                {"Don't have an account? Sign Up"}
              </Link>
            </Box>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
};

export default Login; 