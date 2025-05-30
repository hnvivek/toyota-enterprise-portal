import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Alert,
  CircularProgress,
  Tooltip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Person as PersonIcon,
} from '@mui/icons-material';
import axios from 'axios';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  branch?: {
    id: number;
    name: string;
    location?: string;
  };
  region?: string;
  createdAt: string;
  updatedAt?: string;
}

const Users = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [branches, setBranches] = useState<Array<{id: number, name: string, region: string}>>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    role: 'sales_manager',
    branchId: ''
  });
  const [editFormData, setEditFormData] = useState({
    username: '',
    email: '',
    role: 'sales_manager',
    branchId: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Fetch users
      const usersResponse = await axios.get('http://localhost:8080/api/users', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUsers(usersResponse.data);

      // Fetch branches
      const branchesResponse = await axios.get('http://localhost:8080/api/branches', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBranches(branchesResponse.data);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError(error.response?.data?.message || 'Error fetching data');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    if (!formData.username || !formData.email || !formData.password) {
      setError('All fields are required');
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      // Prepare payload with proper data types
      const payload = {
        username: formData.username,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        ...(formData.branchId && formData.branchId !== '' && { branchId: parseInt(formData.branchId) })
      };

      const response = await axios.post('http://localhost:8080/api/users', payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setUsers([response.data.user, ...users]);
      setCreateDialogOpen(false);
      setFormData({ username: '', email: '', password: '', role: 'sales_manager', branchId: '' });
      setSuccess('User created successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error creating user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditUser = (user: User) => {
    setEditingUser(user);
    setEditFormData({
      username: user.username,
      email: user.email,
      role: user.role,
      branchId: user.branch?.id?.toString() || ''
    });
    setEditDialogOpen(true);
  };

  const handleUpdateUser = async () => {
    if (!editingUser || !editFormData.username || !editFormData.email) {
      setError('Username and email are required');
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      
      const payload = {
        username: editFormData.username,
        email: editFormData.email,
        role: editFormData.role,
        ...(editFormData.branchId && editFormData.branchId !== '' && { branchId: parseInt(editFormData.branchId) })
      };

      const response = await axios.put(`http://localhost:8080/api/users/${editingUser.id}`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Update the user in the list
      setUsers(users.map(user => 
        user.id === editingUser.id ? response.data.user : user
      ));
      
      setEditDialogOpen(false);
      setEditingUser(null);
      setEditFormData({ username: '', email: '', role: 'sales_manager', branchId: '' });
      setSuccess('User updated successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error updating user');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteUser = async (id: number, username: string) => {
    if (window.confirm(`Are you sure you want to delete user "${username}"? This action cannot be undone.`)) {
      try {
        const token = localStorage.getItem('token');
        await axios.delete(`http://localhost:8080/api/users/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(users.filter(user => user.id !== id));
        setSuccess('User deleted successfully');
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } catch (error: any) {
        console.error('Error deleting user:', error);
        setError(error.response?.data?.message || 'Error deleting user');
      }
    }
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
    setFormData({ username: '', email: '', password: '', role: 'sales_manager', branchId: '' });
    setError('');
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditingUser(null);
    setEditFormData({ username: '', email: '', role: 'sales_manager', branchId: '' });
    setError('');
  };

  const getRoleColor = (role: string) => {
    const colors: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error'> = {
      'admin': 'error',
      'sales_manager': 'primary',
      'general_manager': 'warning',
      'marketing_head': 'success',
      'marketing_manager': 'info'
    };
    return colors[role.toLowerCase()] || 'secondary';
  };

  const formatRoleLabel = (role: string) => {
    return role.replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3, backgroundColor: 'background.default', minHeight: '100vh' }}>
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 4,
        backgroundColor: 'background.paper',
        p: 2,
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <PersonIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" fontWeight={700} color="text.primary">
            User Management
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => setCreateDialogOpen(true)}
          sx={{ 
            backgroundColor: 'primary.main',
            '&:hover': { backgroundColor: 'primary.dark' },
            fontWeight: 600,
            px: 3
          }}
        >
          Add User
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Users Table */}
      <Paper sx={{ backgroundColor: 'background.paper', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>Username</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>Branch</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>Region</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>Joined</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: 'text.primary' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.length > 0 ? (
                users.map((user) => (
                  <TableRow 
                    key={user.id} 
                    sx={{ 
                      '&:hover': { backgroundColor: 'action.hover' },
                      '&:nth-of-type(even)': { backgroundColor: 'action.selected' }
                    }}
                  >
                    <TableCell>
                      <Typography variant="subtitle1" fontWeight="600" color="text.primary">
                        {user.username}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {user.email}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={formatRoleLabel(user.role)}
                        color={getRoleColor(user.role)}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {user.branch?.name || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {user.region || '-'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(user.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title="Edit User">
                          <IconButton 
                            onClick={() => handleEditUser(user)}
                            color="primary"
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete User">
                          <IconButton 
                            onClick={() => handleDeleteUser(user.id, user.username)}
                            color="error"
                            size="small"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    <Typography variant="body1" color="text.secondary" sx={{ py: 4 }}>
                      No users found. Click "Add User" to create your first user.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Create User Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={handleCloseCreateDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: 'primary.main', color: 'white', fontWeight: 700 }}>
          Create New User
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Username"
            type="text"
            fullWidth
            variant="outlined"
            value={formData.username}
            onChange={(e) => setFormData({ ...formData, username: e.target.value })}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Password"
            type="password"
            fullWidth
            variant="outlined"
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            sx={{ mb: 2 }}
            helperText="Minimum 6 characters"
          />
          
          <TextField
            margin="dense"
            label="Role"
            select
            fullWidth
            variant="outlined"
            value={formData.role}
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
            sx={{ mb: 2 }}
          >
            <MenuItem value="sales_manager">Sales Manager</MenuItem>
            <MenuItem value="general_manager">General Manager</MenuItem>
            <MenuItem value="marketing_manager">Marketing Manager</MenuItem>
            <MenuItem value="marketing_head">Marketing Head</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </TextField>
          
          <TextField
            margin="dense"
            label="Branch"
            select
            fullWidth
            variant="outlined"
            value={formData.branchId}
            onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
            helperText="Optional: Select a branch for this user"
          >
            <MenuItem value="">No Branch</MenuItem>
            {branches.map((branch) => (
              <MenuItem key={branch.id} value={branch.id.toString()}>
                {branch.name}
              </MenuItem>
            ))}
          </TextField>
          
          {formData.branchId && (
            <Box sx={{ mt: 1, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Region:</strong> {branches.find(b => b.id.toString() === formData.branchId)?.region || 'Unknown'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseCreateDialog} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleCreateUser} 
            variant="contained"
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={20} /> : <AddIcon />}
          >
            Create User
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={handleCloseEditDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: 'warning.main', color: 'white', fontWeight: 700 }}>
          Edit User
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Username"
            type="text"
            fullWidth
            variant="outlined"
            value={editFormData.username}
            onChange={(e) => setEditFormData({ ...editFormData, username: e.target.value })}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Email"
            type="email"
            fullWidth
            variant="outlined"
            value={editFormData.email}
            onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Role"
            select
            fullWidth
            variant="outlined"
            value={editFormData.role}
            onChange={(e) => setEditFormData({ ...editFormData, role: e.target.value })}
            sx={{ mb: 2 }}
          >
            <MenuItem value="sales_manager">Sales Manager</MenuItem>
            <MenuItem value="general_manager">General Manager</MenuItem>
            <MenuItem value="marketing_manager">Marketing Manager</MenuItem>
            <MenuItem value="marketing_head">Marketing Head</MenuItem>
            <MenuItem value="admin">Admin</MenuItem>
          </TextField>
          
          <TextField
            margin="dense"
            label="Branch"
            select
            fullWidth
            variant="outlined"
            value={editFormData.branchId}
            onChange={(e) => setEditFormData({ ...editFormData, branchId: e.target.value })}
            helperText="Optional: Select a branch for this user"
          >
            <MenuItem value="">No Branch</MenuItem>
            {branches.map((branch) => (
              <MenuItem key={branch.id} value={branch.id.toString()}>
                {branch.name}
              </MenuItem>
            ))}
          </TextField>
          
          {editFormData.branchId && (
            <Box sx={{ mt: 1, p: 2, bgcolor: 'action.hover', borderRadius: 1 }}>
              <Typography variant="body2" color="text.secondary">
                <strong>Region:</strong> {branches.find(b => b.id.toString() === editFormData.branchId)?.region || 'Unknown'}
              </Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseEditDialog} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateUser} 
            variant="contained"
            color="warning"
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={20} /> : <EditIcon />}
          >
            Update User
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Users; 