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
  Alert,
  CircularProgress,
  Tooltip,
  MenuItem,
  Grid,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Business as BranchIcon,
  LocationOn as LocationIcon,
} from '@mui/icons-material';
import { api } from '../../config/api';

interface Branch {
  id: number;
  name: string;
  location: string;
  region: string;
  createdAt: string;
  updatedAt: string;
}

const regions = [
  // Bangalore specific regions
  'Bangalore South',
  'Bangalore East',
  'Bangalore West',
  'Bangalore North',
  'Bangalore Central',
  
  // Special regions
  'Digital Marketing',
  
  // Generic directional regions
  'North',
  'South', 
  'East',
  'West',
  'Central',
  'Northeast',
  'Northwest',
  'Southeast',
  'Southwest'
];

const Branches = () => {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    location: '',
    region: ''
  });
  const [editFormData, setEditFormData] = useState({
    name: '',
    location: '',
    region: ''
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await api.get('/branches', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBranches(response.data);
    } catch (error: any) {
      console.error('Error fetching branches:', error);
      setError(error.response?.data?.message || 'Error fetching branches');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateBranch = async () => {
    if (!formData.name || !formData.location || !formData.region) {
      setError('All fields are required');
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await api.post('/branches', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setBranches([response.data, ...branches]);
      setCreateDialogOpen(false);
      setFormData({ name: '', location: '', region: '' });
      setSuccess('Branch created successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error creating branch');
    } finally {
      setActionLoading(false);
    }
  };

  const handleEditBranch = (branch: Branch) => {
    setEditingBranch(branch);
    setEditFormData({
      name: branch.name,
      location: branch.location,
      region: branch.region
    });
    setEditDialogOpen(true);
  };

  const handleUpdateBranch = async () => {
    if (!editingBranch || !editFormData.name || !editFormData.location || !editFormData.region) {
      setError('All fields are required');
      return;
    }

    setActionLoading(true);
    setError('');

    try {
      const token = localStorage.getItem('token');
      const response = await api.put(`/branches/${editingBranch.id}`, editFormData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setBranches(branches.map(branch => 
        branch.id === editingBranch.id ? response.data : branch
      ));
      setEditDialogOpen(false);
      setEditingBranch(null);
      setEditFormData({ name: '', location: '', region: '' });
      setSuccess('Branch updated successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      setError(error.response?.data?.message || 'Error updating branch');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteBranch = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      try {
        const token = localStorage.getItem('token');
        await api.delete(`/branches/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setBranches(branches.filter(branch => branch.id !== id));
        setSuccess('Branch deleted successfully');
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } catch (error: any) {
        console.error('Error deleting branch:', error);
        setError(error.response?.data?.message || 'Error deleting branch');
      }
    }
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
    setFormData({ name: '', location: '', region: '' });
    setError('');
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditingBranch(null);
    setEditFormData({ name: '', location: '', region: '' });
    setError('');
  };

  const getRegionColor = (region: string) => {
    const colors: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error'> = {
      // Bangalore regions
      'Bangalore South': 'error',
      'Bangalore East': 'warning', 
      'Bangalore West': 'success',
      'Bangalore North': 'info',
      'Bangalore Central': 'primary',
      
      // Special regions
      'Digital Marketing': 'secondary',
      
      // Generic directions (fallback)
      'North': 'info',
      'South': 'error',
      'East': 'warning',
      'West': 'success',
      'Central': 'primary',
      'Northeast': 'info',
      'Northwest': 'success',
      'Southeast': 'error',
      'Southwest': 'warning'
    };
    return colors[region] || 'secondary';
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
          <BranchIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" fontWeight={700} color="text.primary">
            Branch Management
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
          Add Branch
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

      {/* Branches Table */}
      <Paper sx={{ backgroundColor: 'background.paper', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>Branch Name</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>Location</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>Region</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>Created</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: 'text.primary' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {branches.length > 0 ? (
                branches.map((branch) => (
                  <TableRow 
                    key={branch.id} 
                    sx={{ 
                      '&:hover': { backgroundColor: 'action.hover' },
                      '&:nth-of-type(even)': { backgroundColor: 'action.selected' }
                    }}
                  >
                    <TableCell>
                      <Typography variant="subtitle1" fontWeight="600" color="text.primary">
                        {branch.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {branch.location}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={branch.region} 
                        color={getRegionColor(branch.region)}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(branch.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                        <Tooltip title="Edit Branch">
                          <IconButton 
                            onClick={() => handleEditBranch(branch)}
                            color="primary"
                            size="small"
                          >
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Branch">
                          <IconButton 
                            onClick={() => handleDeleteBranch(branch.id, branch.name)}
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
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body1" color="text.secondary" sx={{ py: 4 }}>
                      No branches found. Click "Add Branch" to create your first branch.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Create Branch Dialog */}
      <Dialog 
        open={createDialogOpen} 
        onClose={handleCloseCreateDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: 'primary.main', color: 'white', fontWeight: 700 }}>
          Create New Branch
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Branch Name"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Location"
            fullWidth
            variant="outlined"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Region"
            fullWidth
            select
            variant="outlined"
            value={formData.region}
            onChange={(e) => setFormData({ ...formData, region: e.target.value })}
          >
            <MenuItem value="">Select Region</MenuItem>
            {regions.map((region) => (
              <MenuItem key={region} value={region}>
                {region}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseCreateDialog} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleCreateBranch} 
            variant="contained"
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={20} /> : <AddIcon />}
          >
            Create Branch
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Branch Dialog */}
      <Dialog 
        open={editDialogOpen} 
        onClose={handleCloseEditDialog}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ backgroundColor: 'warning.main', color: 'white', fontWeight: 700 }}>
          Edit Branch
        </DialogTitle>
        <DialogContent sx={{ pt: 3 }}>
          <TextField
            autoFocus
            margin="dense"
            label="Branch Name"
            fullWidth
            variant="outlined"
            value={editFormData.name}
            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Location"
            fullWidth
            variant="outlined"
            value={editFormData.location}
            onChange={(e) => setEditFormData({ ...editFormData, location: e.target.value })}
            sx={{ mb: 2 }}
          />
          <TextField
            margin="dense"
            label="Region"
            fullWidth
            select
            variant="outlined"
            value={editFormData.region}
            onChange={(e) => setEditFormData({ ...editFormData, region: e.target.value })}
          >
            <MenuItem value="">Select Region</MenuItem>
            {regions.map((region) => (
              <MenuItem key={region} value={region}>
                {region}
              </MenuItem>
            ))}
          </TextField>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseEditDialog} color="inherit">
            Cancel
          </Button>
          <Button 
            onClick={handleUpdateBranch} 
            variant="contained"
            color="warning"
            disabled={actionLoading}
            startIcon={actionLoading ? <CircularProgress size={20} /> : <EditIcon />}
          >
            Update Branch
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Branches; 