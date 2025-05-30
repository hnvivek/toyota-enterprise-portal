import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Alert,
  Divider,
  Card,
  CardContent,
  Avatar,
  Stack,
  Chip,
} from '@mui/material';
import {
  Person as PersonIcon,
  Email as EmailIcon,
  LocationOn as LocationIcon,
  Business as BusinessIcon,
  Lock as LockIcon,
} from '@mui/icons-material';
import { useUser } from '../../contexts/UserContext';
import axios from 'axios';

const UserProfile = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    region: '',
    branchName: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const { currentUser, updateUser } = useUser();

  useEffect(() => {
    if (currentUser) {
      setFormData(prevData => ({
        ...prevData,
        username: currentUser.username,
        email: currentUser.email,
        region: currentUser.branch?.region || 'Not assigned',
        branchName: currentUser.branch?.name || 'Not assigned',
      }));
    }
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      // Update basic profile
      const profileResponse = await axios.put(
        'http://localhost:8080/api/users/profile',
        {
          username: formData.username,
          email: formData.email,
        },
        { headers }
      );

      // Update the user context with the new data
      updateUser({
        username: formData.username,
        email: formData.email,
      });

      // Update password if provided
      if (formData.currentPassword && formData.newPassword) {
        if (formData.newPassword !== formData.confirmPassword) {
          setError('New passwords do not match');
          setLoading(false);
          return;
        }

        await axios.put(
          'http://localhost:8080/api/users/password',
          {
            currentPassword: formData.currentPassword,
            newPassword: formData.newPassword,
          },
          { headers }
        );
      }

      setSuccess('Profile updated successfully');
      setFormData(prevData => ({
        ...prevData,
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      }));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error updating profile');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prevData => ({
      ...prevData,
      [e.target.name]: e.target.value,
    }));
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getRoleColor = (role: string) => {
    switch (role?.toLowerCase()) {
      case 'admin': return '#e91e63';
      case 'manager': return '#2196f3';
      case 'user': return '#4caf50';
      default: return '#9e9e9e';
    }
  };

  return (
    <Box sx={{ 
      p: 2, 
      backgroundColor: 'background.default', 
      minHeight: '100vh'
    }}>
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2,
        backgroundColor: 'background.paper',
        p: 1.5,
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <PersonIcon sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h4" fontWeight={700} color="text.primary">
            My Profile
          </Typography>
        </Box>
        {currentUser && (
          <Chip 
            label={currentUser.role}
            sx={{ 
              backgroundColor: `${getRoleColor(currentUser.role)}20`,
              color: getRoleColor(currentUser.role),
              fontWeight: 600,
              textTransform: 'capitalize'
            }}
          />
        )}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Grid container spacing={2} sx={{ alignItems: 'stretch' }}>
        {/* Profile Overview Card */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%' }}>
            <CardContent sx={{ textAlign: 'center', p: 2 }}>
              <Avatar
                sx={{
                  width: 80,
                  height: 80,
                  margin: '0 auto 1.5rem',
                  backgroundColor: 'primary.main',
                  fontSize: '1.75rem',
                  fontWeight: 700
                }}
              >
                {currentUser ? getInitials(currentUser.username) : 'U'}
              </Avatar>
              
              <Typography variant="h5" fontWeight={700} gutterBottom>
                {currentUser?.username || 'Loading...'}
              </Typography>
              
              <Typography variant="body1" color="text.secondary" gutterBottom>
                {currentUser?.email || 'Loading...'}
              </Typography>

              <Stack direction="row" spacing={1} justifyContent="center" sx={{ mt: 1.5, mb: 2 }}>
                <Chip 
                  label={currentUser?.role || 'User'}
                  color="primary"
                  size="small"
                  sx={{ textTransform: 'capitalize' }}
                />
              </Stack>

              <Divider sx={{ my: 2 }} />

              <Box sx={{ textAlign: 'left' }}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
                  <BusinessIcon fontSize="small" />
                  Branch Information
                </Typography>
                
                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    Branch
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {currentUser?.branch?.name || 'Not assigned'}
                  </Typography>
                </Box>

                <Box sx={{ mb: 1.5 }}>
                  <Typography variant="body2" color="text.secondary">
                    Location
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {currentUser?.branch?.location || 'Not assigned'}
                  </Typography>
                </Box>

                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Region
                  </Typography>
                  <Typography variant="body1" fontWeight={600}>
                    {currentUser?.branch?.region || 'Not assigned'}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Edit Profile Form */}
        <Grid item xs={12} md={8}>
          <Paper sx={{ 
            p: 2, 
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)', 
            height: '100%'
          }}>
            <Box component="form" onSubmit={handleSubmit}>
              {/* Basic Information Section */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, color: 'primary.main', fontWeight: 700 }}>
                  <EmailIcon />
                  Basic Information
                </Typography>
                
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      required
                      fullWidth
                      label="Username"
                      name="username"
                      value={formData.username}
                      onChange={handleChange}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      required
                      fullWidth
                      label="Email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Region"
                      name="region"
                      value={formData.region}
                      disabled
                      helperText="Assigned based on your branch"
                      variant="outlined"
                      size="small"
                      InputProps={{
                        startAdornment: <LocationIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                    />
                  </Grid>

                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Branch"
                      name="branchName"
                      value={formData.branchName}
                      disabled
                      helperText="Assigned by administrator"
                      variant="outlined"
                      size="small"
                      InputProps={{
                        startAdornment: <BusinessIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                      }}
                    />
                  </Grid>
                </Grid>
              </Box>

              <Divider sx={{ my: 3 }} />

              {/* Change Password Section */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, color: 'primary.main', fontWeight: 700 }}>
                  <LockIcon />
                  Change Password
                </Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
                  Leave password fields blank if you don't want to change your password.
                </Typography>

                <Grid container spacing={2}>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Current Password"
                      name="currentPassword"
                      type="password"
                      value={formData.currentPassword}
                      onChange={handleChange}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="New Password"
                      name="newPassword"
                      type="password"
                      value={formData.newPassword}
                      onChange={handleChange}
                      helperText="Minimum 6 characters"
                      variant="outlined"
                      size="small"
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="Confirm New Password"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      variant="outlined"
                      size="small"
                    />
                  </Grid>
                </Grid>
              </Box>

              {/* Submit Button */}
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', pt: 2 }}>
                <Button
                  type="submit"
                  variant="contained"
                  disabled={loading}
                  size="large"
                  sx={{ 
                    px: 4, 
                    py: 1.5,
                    fontWeight: 600
                  }}
                >
                  {loading ? 'Updating...' : 'Update Profile'}
                </Button>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default UserProfile; 