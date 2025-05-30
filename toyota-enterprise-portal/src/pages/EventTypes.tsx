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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Tooltip,
  Chip,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Add as AddIcon,
  Category as CategoryIcon,
} from '@mui/icons-material';
import { api } from '../config/api';

interface EventType {
  id: number;
  name: string;
  description: string;
  category: string;
  createdAt: string;
  updatedAt?: string;
}

const EventTypes = () => {
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingEventType, setEditingEventType] = useState<EventType | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
  });

  const [editFormData, setEditFormData] = useState({
    name: '',
    description: '',
    category: '',
  });

  useEffect(() => {
    fetchEventTypes();
  }, []);

  const fetchEventTypes = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await api.get('/event-types', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEventTypes(response.data);
    } catch (error: any) {
      console.error('Error fetching event types:', error);
      setError(error.response?.data?.message || 'Error fetching event types');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateEventType = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.post('/event-types', formData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      setEventTypes([...eventTypes, response.data]);
      setCreateDialogOpen(false);
      setFormData({ name: '', description: '', category: '' });
      setSuccess('Event type created successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Error creating event type:', error);
      setError(error.response?.data?.message || 'Error creating event type');
    }
  };

  const handleEditEventType = (eventType: EventType) => {
    setEditingEventType(eventType);
    setEditFormData({
      name: eventType.name,
      description: eventType.description,
      category: eventType.category,
    });
    setEditDialogOpen(true);
  };

  const handleUpdateEventType = async () => {
    if (!editingEventType) return;

    try {
      const token = localStorage.getItem('token');
      const response = await api.put(
        `/event-types/${editingEventType.id}`,
        editFormData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setEventTypes(eventTypes.map(et => 
        et.id === editingEventType.id ? response.data : et
      ));
      setEditDialogOpen(false);
      setEditingEventType(null);
      setEditFormData({ name: '', description: '', category: '' });
      setSuccess('Event type updated successfully');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(''), 3000);
    } catch (error: any) {
      console.error('Error updating event type:', error);
      setError(error.response?.data?.message || 'Error updating event type');
    }
  };

  const handleDeleteEventType = async (id: number, name: string) => {
    if (window.confirm(`Are you sure you want to delete event type "${name}"? This action cannot be undone.`)) {
      try {
        const token = localStorage.getItem('token');
        await api.delete(`/event-types/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEventTypes(eventTypes.filter(et => et.id !== id));
        setSuccess('Event type deleted successfully');
        
        // Clear success message after 3 seconds
        setTimeout(() => setSuccess(''), 3000);
      } catch (error: any) {
        console.error('Error deleting event type:', error);
        setError(error.response?.data?.message || 'Error deleting event type');
      }
    }
  };

  const handleCloseCreateDialog = () => {
    setCreateDialogOpen(false);
    setFormData({ name: '', description: '', category: '' });
    setError('');
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditingEventType(null);
    setEditFormData({ name: '', description: '', category: '' });
    setError('');
  };

  const getCategoryColor = (category: string) => {
    const predefinedColors: Record<string, 'primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error'> = {
      'promotion': 'success',
      'launch': 'primary',
      'training': 'info',
      'exhibition': 'warning',
      'conference': 'secondary',
      'workshop': 'info',
      'seminar': 'primary',
      'digital': 'info',
      'event': 'warning',
      'marketing': 'success',
      'sales': 'primary',
      'other': 'secondary'
    };

    const categoryLower = category.toLowerCase();
    
    // Check if we have a predefined color for this category
    if (predefinedColors[categoryLower]) {
      return predefinedColors[categoryLower];
    }

    // If not predefined, assign color based on hash of category name for consistency
    const colorOptions: ('primary' | 'secondary' | 'success' | 'warning' | 'info' | 'error')[] = [
      'primary', 'success', 'warning', 'info', 'error', 'secondary'
    ];
    
    // Simple hash function to consistently assign colors to categories
    let hash = 0;
    for (let i = 0; i < categoryLower.length; i++) {
      hash = categoryLower.charCodeAt(i) + ((hash << 5) - hash);
    }
    
    const colorIndex = Math.abs(hash) % colorOptions.length;
    return colorOptions[colorIndex];
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
          <CategoryIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" fontWeight={700} color="text.primary">
            Event Types Management
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
          Add Event Type
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

      {/* Event Types Table */}
      <Paper sx={{ backgroundColor: 'background.paper', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow sx={{ backgroundColor: 'action.hover' }}>
                <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>Description</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>Category</TableCell>
                <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>Created</TableCell>
                <TableCell align="center" sx={{ fontWeight: 700, color: 'text.primary' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {eventTypes.length > 0 ? (
                eventTypes.map((eventType) => (
                  <TableRow 
                    key={eventType.id} 
                    sx={{ 
                      '&:hover': { backgroundColor: 'action.hover' },
                      '&:nth-of-type(even)': { backgroundColor: 'action.selected' }
                    }}
                  >
                    <TableCell>
                      <Typography variant="subtitle1" fontWeight="600" color="text.primary">
                        {eventType.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {eventType.description}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={eventType.category.charAt(0).toUpperCase() + eventType.category.slice(1)}
                        color={getCategoryColor(eventType.category)}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {new Date(eventType.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric'
                        })}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="Edit Event Type">
                        <IconButton
                          color="primary"
                          onClick={() => handleEditEventType(eventType)}
                          sx={{ mr: 1 }}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete Event Type">
                        <IconButton
                          color="error"
                          onClick={() => handleDeleteEventType(eventType.id, eventType.name)}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body2" color="text.secondary" sx={{ py: 4 }}>
                      No event types found. Create your first event type to get started.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {/* Create Event Type Dialog */}
      <Dialog open={createDialogOpen} onClose={handleCloseCreateDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Event Type</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            variant="outlined"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Category"
            fullWidth
            variant="outlined"
            value={formData.category}
            onChange={(e) => setFormData({ ...formData, category: e.target.value })}
            placeholder="e.g., promotion, launch, training, exhibition"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseCreateDialog}>Cancel</Button>
          <Button
            onClick={handleCreateEventType}
            variant="contained"
            disabled={!formData.name || !formData.description || !formData.category}
          >
            Create
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Event Type Dialog */}
      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Event Type</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Name"
            fullWidth
            variant="outlined"
            value={editFormData.name}
            onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Description"
            fullWidth
            multiline
            rows={3}
            variant="outlined"
            value={editFormData.description}
            onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
            sx={{ mb: 2 }}
          />
          
          <TextField
            margin="dense"
            label="Category"
            fullWidth
            variant="outlined"
            value={editFormData.category}
            onChange={(e) => setEditFormData({ ...editFormData, category: e.target.value })}
            placeholder="e.g., promotion, launch, training, exhibition"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseEditDialog}>Cancel</Button>
          <Button
            onClick={handleUpdateEventType}
            variant="contained"
            disabled={!editFormData.name || !editFormData.description || !editFormData.category}
          >
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EventTypes; 