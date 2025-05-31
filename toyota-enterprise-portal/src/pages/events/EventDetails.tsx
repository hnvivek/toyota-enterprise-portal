import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Button,
  Chip,
  Divider,
  List,
  ListItem,
  ListItemText,
  IconButton,
  Link,
  Card,
  CardContent,
  Avatar,
  Stack,
  LinearProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as ArrowBackIcon,
  AttachFile as AttachFileIcon,
  Download as DownloadIcon,
  LocationOn as LocationIcon,
  DateRange as DateRangeIcon,
  Person as PersonIcon,
  Business as BusinessIcon,
  LocalOffer as ProductIcon,
  AccountBalance as BudgetIcon,
  TrendingUp as MetricsIcon,
  Event as EventTypeIcon,
  Schedule as ScheduleIcon,
  Comment as CommentIcon,
} from '@mui/icons-material';
import { api } from '../../config/api';
import { formatINR } from '../../utils/format';

interface Event {
  id: number;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  location: string;
  status: string;
  budget: number;
  branch: {
    id: number;
    name: string;
  };
  organizer: {
    id: number;
    username: string;
    email: string;
  };
  products: Array<{
    id: number;
    name: string;
    category: string;
  }>;
  eventType?: {
    id: number;
    name: string;
    category: string;
  };
  attachments?: Array<{
    id: number;
    filename: string;
    fileUrl: string;
    fileType: string;
    createdAt: string;
  }>;
  comments?: Array<{
    id: number;
    comment: string;
    commentType: string;
    statusFrom?: string;
    statusTo?: string;
    commentedBy: {
      id: number;
      username: string;
      email: string;
      role: string;
    };
    createdAt: string;
  }>;
  // Metrics
  plannedBudget?: number;
  plannedEnquiries?: number;
  plannedOrders?: number;
  actualBudget?: number;
  actualEnquiries?: number;
  actualOrders?: number;
}

const EventDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [commentDialogOpen, setCommentDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<{ label: string; status: string; color: string; icon: string } | null>(null);
  const [comment, setComment] = useState('');
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [currentUserBranch, setCurrentUserBranch] = useState<{ id: number; name: string } | null>(null);
  const [isEventCreator, setIsEventCreator] = useState(false);

  useEffect(() => {
    const fetchEvent = async () => {
      try {
        const token = localStorage.getItem('token');
        
        // Fetch event details
        const response = await api.get(`/events/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setEvent(response.data);

        // Fetch current user info
        const userResponse = await api.get('/auth/me', {
          headers: { Authorization: `Bearer ${token}` },
        });
        setCurrentUserRole(userResponse.data.role);
        setCurrentUserBranch(userResponse.data.branch);
        setIsEventCreator(userResponse.data.id === response.data.organizer?.id);
        
      } catch (error) {
        console.error('Error fetching event details:', error);
      }
    };

    fetchEvent();
  }, [id]);

  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        const token = localStorage.getItem('token');
        await api.delete(`/events/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        navigate('/events');
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const handleStatusChange = async (newStatus: string) => {
    // Handle special case for blocked completion
    if (newStatus === 'completion_blocked') {
      const missingValues = getMissingActualValues();
      alert(`Cannot mark event as completed.\n\nMissing actual values:\n• ${missingValues.join('\n• ')}\n\nPlease update the event with actual results first by clicking "Edit Metrics".`);
      return;
    }
    
    const action = getStatusActions().find(a => a.status === newStatus);
    if (action) {
      setSelectedAction(action);
      setCommentDialogOpen(true);
    }
  };

  const confirmStatusChange = async () => {
    if (!selectedAction) return;

    try {
      const token = localStorage.getItem('token');
      await api.patch(`/events/${id}/status`, 
        { 
          status: selectedAction.status,
          comment: comment.trim() || undefined
        },
        { headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } }
      );
      
      // Refresh the event data
      const response = await api.get(`/events/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEvent(response.data);
      
      // Reset dialog state
      setCommentDialogOpen(false);
      setSelectedAction(null);
      setComment('');
    } catch (error: any) {
      console.error('Error updating event status:', error);
      const message = error.response?.data?.error || 'Error updating event status. Please try again.';
      alert(message);
    }
  };

  const handleCloseDialog = () => {
    setCommentDialogOpen(false);
    setSelectedAction(null);
    setComment('');
  };

  const getValidButtonColor = (color: string): 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning' => {
    switch (color) {
      case 'success': return 'success';
      case 'error': return 'error';
      case 'warning': return 'warning';
      case 'info': return 'info';
      case 'primary': return 'primary';
      case 'secondary': return 'secondary';
      default: return 'primary';
    }
  };

  // Check if user can edit the event details
  const canEditEvent = () => {
    if (!event) return false; // Can't edit if no event data loaded
    if (currentUserRole === 'admin') return true; // Admin can always edit
    
    const status = event.status.toLowerCase();
    const isSameBranch = currentUserBranch?.id === event.branch.id;
    
    // Sales Manager can edit own events until GM approval
    if (currentUserRole === 'sales_manager' && isEventCreator) {
      return status === 'draft' || status === 'rejected' || status === 'pending_gm';
    }
    
    // General Manager can edit any event in their branch while pending approval
    // OR they can edit their own events regardless of branch issues
    if (currentUserRole === 'general_manager') {
      if ((isSameBranch || isEventCreator) && (status === 'draft' || status === 'pending_gm')) {
        return true;
      }
    }
    
    // Marketing Head can edit events pending their approval
    if (currentUserRole === 'marketing_head') {
      return status === 'pending_marketing';
    }
    
    return false;
  };

  // Check if user can delete the event
  const canDeleteEvent = () => {
    if (!event) return false; // Can't delete if no event data loaded
    if (currentUserRole === 'admin') return true; // Admin can always delete
    
    const status = event.status.toLowerCase();
    const isSameBranch = currentUserBranch?.id === event.branch.id;
    
    // Cannot delete approved or completed events
    if (status === 'approved' || status === 'completed') {
      return false;
    }
    
    // Sales Manager can delete own events until GM approval
    if (currentUserRole === 'sales_manager' && isEventCreator) {
      return status === 'draft' || status === 'rejected';
    }
    
    // General Manager can delete events in their branch before final approval
    if (currentUserRole === 'general_manager' && isSameBranch) {
      return status === 'draft' || status === 'pending_gm' || status === 'rejected';
    }
    
    // Marketing Head can delete events pending their approval
    if (currentUserRole === 'marketing_head') {
      return status === 'pending_marketing';
    }
    
    return false;
  };

  // Check if user can edit post-event metrics (actual values)
  const canEditMetrics = () => {
    if (!event) return false; // Can't edit if no event data loaded
    if (currentUserRole === 'admin') return true; // Admin can always edit
    
    const status = event.status.toLowerCase();
    
    // Marketing Manager can edit final costs and metrics after approval
    if (currentUserRole === 'marketing_manager') {
      return status === 'approved' || status === 'completed';
    }
    
    // Sales Manager can edit metrics of their own events after approval (but not final costs)
    if (currentUserRole === 'sales_manager' && isEventCreator) {
      return status === 'approved' || status === 'completed';
    }
    
    return false;
  };

  // Get edit permission message
  const getEditPermissionMessage = () => {
    if (!event) return '';
    
    if (currentUserRole === 'admin') {
      return 'Admin: You have full edit access to all events.';
    }
    
    const status = event.status.toLowerCase();
    const isSameBranch = currentUserBranch?.id === event.branch.id;
    
    if (currentUserRole === 'sales_manager') {
      if (!isEventCreator) {
        return 'You can only edit events that you created.';
      }
      if (status === 'draft' || status === 'rejected' || status === 'pending_gm') {
        return 'You can edit this event. After GM approval, editing will be locked.';
      }
      if (status === 'approved' || status === 'completed') {
        return 'Event details are locked after approval. You can only edit post-event metrics.';
      }
      return 'This event cannot be edited in its current status.';
    }
    
    if (currentUserRole === 'general_manager') {
      if (!isSameBranch && !isEventCreator) {
        return 'You can only edit events from your branch or events you created.';
      }
      if (isEventCreator) {
        if (status === 'draft' || status === 'rejected') {
          return 'You can edit your own event. Submit to GM for approval when ready.';
        }
        if (status === 'pending_gm' || status === 'pending_marketing') {
          return 'Event is under review. Limited editing allowed.';
        }
        if (status === 'approved' || status === 'completed') {
          return 'Event details are locked after approval. You can only edit post-event metrics.';
        }
      } else if (isSameBranch) {
        if (status === 'draft' || status === 'pending_gm') {
          return 'You can edit events in your branch pending approval.';
        }
        return 'Events cannot be edited after GM approval unless you created them.';
      }
      return 'This event cannot be edited in its current status.';
    }
    
    if (currentUserRole === 'marketing_head') {
      if (status === 'pending_marketing') {
        return 'You can edit events pending your final approval.';
      }
      return 'You can only edit events pending your approval.';
    }
    
    if (currentUserRole === 'marketing_manager') {
      if (status === 'approved' || status === 'completed') {
        return 'You can edit final costs and post-event metrics for approved events.';
      }
      return 'You can only edit final costs and metrics after the event is approved.';
    }
    
    return 'You do not have permission to edit this event.';
  };

  // Get edit permission background color
  const getEditPermissionColor = () => {
    if (canEditEvent()) return 'success.50';
    if (canEditMetrics()) return 'info.50';
    return 'grey.50';
  };

  const getStatusActions = () => {
    if (!event) return [];
    
    const status = event.status.toLowerCase();
    const isSameBranch = currentUserBranch?.id === event.branch.id;
    
    // Define role-based permissions for each status
    switch (status) {
      case 'draft':
        // Sales managers can submit their own events to GM
        if (currentUserRole === 'sales_manager' && isEventCreator) {
          return [
            { label: 'Submit to GM', status: 'pending_gm', color: 'primary', icon: '📤' }
          ];
        }
        // General managers can submit their own events directly to Marketing Head
        if (currentUserRole === 'general_manager' && isEventCreator && isSameBranch) {
          return [
            { label: 'Submit to Marketing', status: 'pending_marketing', color: 'primary', icon: '📤' }
          ];
        }
        return [];
        
      case 'pending_gm':
        // Only general managers from the SAME BRANCH can approve/reject events
        if (currentUserRole === 'general_manager' && isSameBranch) {
          return [
            { label: 'Approve', status: 'pending_marketing', color: 'success', icon: '✅' },
            { label: 'Reject', status: 'rejected', color: 'error', icon: '❌' },
            { label: 'Back to Draft', status: 'draft', color: 'secondary', icon: '📝' }
          ];
        }
        return [];
        
      case 'pending_marketing':
        // Marketing heads can provide final approval (can handle multiple branches or all branches)
        // For now, allowing all marketing heads to approve any branch - can be restricted later if needed
        if (currentUserRole === 'marketing_head') {
          return [
            { label: 'Final Approval', status: 'approved', color: 'success', icon: '✅' },
            { label: 'Reject', status: 'rejected', color: 'error', icon: '❌' },
            { label: 'Back to GM', status: 'pending_gm', color: 'warning', icon: '⬅️' }
          ];
        }
        return [];
        
      case 'approved':
        // Marketing managers can mark as complete (across branches) OR event creators can mark their own complete
        if (currentUserRole === 'marketing_manager' || 
            (currentUserRole === 'sales_manager' && isEventCreator) ||
            (currentUserRole === 'general_manager' && isEventCreator)) {
          if (isReadyForCompletion()) {
            return [
              { label: 'Mark Complete', status: 'completed', color: 'success', icon: '🎉' }
            ];
          } else {
            // Return an informational action that will show the missing values
            return [
              { label: 'Complete (Missing Data)', status: 'completion_blocked', color: 'warning', icon: '⚠️' }
            ];
          }
        }
        return [];
        
      case 'rejected':
        // The original creator can revise and resubmit
        if ((currentUserRole === 'sales_manager' && isEventCreator) ||
            (currentUserRole === 'general_manager' && isEventCreator)) {
          return [
            { label: 'Revise & Resubmit', status: 'draft', color: 'secondary', icon: '📝' }
          ];
        }
        return [];
        
      case 'completed':
        // No actions for completed events
        return [];
        
      default:
        return [];
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'success';
      case 'approved': return 'primary';
      case 'pending': return 'warning';
      case 'rejected': return 'error';
      case 'draft': return 'default';
      default: return 'default';
    }
  };

  const formatDateTime = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit'
      })
    };
  };

  const calculateProgress = (actual: number | undefined, planned: number | undefined) => {
    if (!actual || !planned) return 0;
    return Math.min((actual / planned) * 100, 100);
  };

  // Check if event has all actual values required for completion
  const isReadyForCompletion = () => {
    if (!event) return false;
    return event.actualBudget && event.actualBudget > 0 && 
           event.actualEnquiries !== null && event.actualEnquiries !== undefined &&
           event.actualOrders !== null && event.actualOrders !== undefined;
  };

  // Get missing actual values for completion
  const getMissingActualValues = () => {
    if (!event) return [];
    const missing = [];
    if (!event.actualBudget || event.actualBudget <= 0) missing.push('Actual Cost');
    if (event.actualEnquiries === null || event.actualEnquiries === undefined) missing.push('Actual Enquiries');  
    if (event.actualOrders === null || event.actualOrders === undefined) missing.push('Actual Orders');
    return missing;
  };

  if (!event) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <Typography variant="h6" color="text.secondary">Loading event details...</Typography>
      </Box>
    );
  }

  const startDateTime = formatDateTime(event.startDate);
  const endDateTime = formatDateTime(event.endDate);

  return (
    <Box sx={{ p: 3, maxWidth: '1200px', mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
        <IconButton 
          onClick={() => navigate('/events')} 
          sx={{ mr: 2, bgcolor: 'grey.100', '&:hover': { bgcolor: 'grey.200' } }}
        >
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <Typography variant="h4" fontWeight="bold" gutterBottom>
            {event.title}
          </Typography>
          <Stack direction="row" spacing={2} alignItems="center">
            <Chip
              label={event.status}
              color={getStatusColor(event.status)}
              variant="filled"
              sx={{ fontWeight: 'medium' }}
            />
            {event.eventType && (
              <Chip
                icon={<EventTypeIcon />}
                label={event.eventType.name}
                variant="outlined"
                size="small"
              />
            )}
          </Stack>
          
          {/* Status Action Buttons */}
          {getStatusActions().length > 0 && (
            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                Available Actions:
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap">
                {getStatusActions().map((action) => (
                  <Button
                    key={action.status}
                    variant="outlined"
                    size="small"
                    color={getValidButtonColor(action.color)}
                    onClick={() => handleStatusChange(action.status)}
                    sx={{ minWidth: 'auto' }}
                  >
                    {action.icon} {action.label}
                  </Button>
                ))}
              </Stack>
            </Box>
          )}
        </Box>
        <Stack direction="row" spacing={1}>
          {canEditEvent() && (
            <Button
              variant="contained"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/events/edit/${id}`)}
              sx={{ minWidth: 100 }}
            >
              Edit Event
            </Button>
          )}
          {canEditMetrics() && (
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={() => navigate(`/events/edit/${id}?mode=metrics`)}
              sx={{ minWidth: 100 }}
              color="secondary"
            >
              Edit Metrics
            </Button>
          )}
          {canDeleteEvent() && (
            <Button
              variant="outlined"
              color="error"
              startIcon={<DeleteIcon />}
              onClick={handleDelete}
              sx={{ minWidth: 100 }}
            >
              Delete
            </Button>
          )}
        </Stack>
      </Box>

      <Grid container spacing={3}>
        {/* Event Overview Card */}
        <Grid item xs={12} md={8}>
          <Card sx={{ mb: 3, overflow: 'visible' }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <EventTypeIcon sx={{ mr: 1, color: 'primary.main' }} />
                Event Overview
              </Typography>
              <Typography variant="body1" paragraph sx={{ mb: 3, lineHeight: 1.6 }}>
                {event.description}
              </Typography>
              
              {/* Date & Time Section */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <DateRangeIcon sx={{ mr: 1, color: 'primary.main' }} />
                  Schedule
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 2, bgcolor: 'success.50', border: '1px solid', borderColor: 'success.200' }}>
                      <Typography variant="body2" color="success.main" fontWeight="medium">START</Typography>
                      <Typography variant="body1" fontWeight="bold">{startDateTime.date}</Typography>
                      <Typography variant="body2" color="text.secondary">{startDateTime.time}</Typography>
                    </Paper>
                  </Grid>
                  <Grid item xs={12} sm={6}>
                    <Paper sx={{ p: 2, bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.200' }}>
                      <Typography variant="body2" color="warning.main" fontWeight="medium">END</Typography>
                      <Typography variant="body1" fontWeight="bold">{endDateTime.date}</Typography>
                      <Typography variant="body2" color="text.secondary">{endDateTime.time}</Typography>
                    </Paper>
                  </Grid>
                </Grid>
              </Box>

              {/* Location */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <LocationIcon sx={{ mr: 1, color: 'primary.main' }} />
                  Location
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="body1" fontWeight="medium">{event.location}</Typography>
                </Paper>
              </Box>

              {/* Budget */}
              <Box>
                <Typography variant="subtitle1" fontWeight="medium" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                  <BudgetIcon sx={{ mr: 1, color: 'primary.main' }} />
                  Event Cost
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'info.50', border: '1px solid', borderColor: 'info.200' }}>
                  <Typography variant="h5" fontWeight="bold" color="info.main">
                    {formatINR(event.budget)}
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                    {event.status === 'completed' ? 'Final approved cost' : 'Requested budget for this event'}
                  </Typography>
                </Paper>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Sidebar */}
        <Grid item xs={12} md={4}>
          {/* Organizer & Branch Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <PersonIcon sx={{ mr: 1, color: 'primary.main' }} />
                Event Details
              </Typography>
              
              <List disablePadding>
                <ListItem disablePadding sx={{ mb: 2 }}>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle2" color="text.secondary">Organizer</Typography>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <Avatar sx={{ width: 32, height: 32, mr: 1, bgcolor: 'primary.main' }}>
                          {event.organizer ? event.organizer.username.charAt(0).toUpperCase() : 'N'}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight="medium">
                            {event.organizer ? event.organizer.username : 'No organizer assigned'}
                          </Typography>
                          {event.organizer && (
                            <Typography variant="caption" color="text.secondary">
                              {event.organizer.email}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    }
                  />
                </ListItem>
                
                <Divider sx={{ my: 1 }} />
                
                <ListItem disablePadding>
                  <ListItemText
                    primary={
                      <Typography variant="subtitle2" color="text.secondary">Branch</Typography>
                    }
                    secondary={
                      <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                        <BusinessIcon sx={{ mr: 1, color: 'primary.main' }} />
                        <Typography variant="body2" fontWeight="medium">
                          {event.branch.name}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              </List>
            </CardContent>
          </Card>

          {/* Featured Products Card */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <ProductIcon sx={{ mr: 1, color: 'primary.main' }} />
                Featured Products
              </Typography>
              <List disablePadding>
                {event.products.map((product, index) => (
                  <ListItem key={product.id} disablePadding sx={{ mb: index < event.products.length - 1 ? 1 : 0 }}>
                    <Paper sx={{ p: 2, width: '100%', bgcolor: 'primary.50', border: '1px solid', borderColor: 'primary.100' }}>
                      <Typography variant="body2" fontWeight="bold" color="primary.main">
                        {product.name}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        Category: {product.category}
                      </Typography>
                    </Paper>
                  </ListItem>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Metrics Section */}
        {(event.plannedBudget || event.plannedEnquiries || event.plannedOrders || 
          event.actualBudget || event.actualEnquiries || event.actualOrders) && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <MetricsIcon sx={{ mr: 1, color: 'primary.main' }} />
                  Performance Metrics
                </Typography>
                
                <Grid container spacing={3}>
                  {/* Event Cost Metrics */}
                  <Grid item xs={12} md={4}>
                    <Paper sx={{ p: 3, textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
                      <BudgetIcon sx={{ fontSize: 40, color: 'info.main', mb: 1 }} />
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        {event.status === 'completed' ? 'Final Cost' : 'Event Cost'}
                      </Typography>
                      <Typography variant="h6" fontWeight="bold">
                        {event.status === 'completed' ? (
                          event.actualBudget ? formatINR(event.actualBudget) : (
                            <Box component="span" sx={{ color: 'warning.main', fontStyle: 'italic' }}>
                              Pending Final Cost
                            </Box>
                          )
                        ) : (
                          <Box component="span" sx={{ color: 'info.main' }}>
                            {formatINR(event.budget)} (Requested)
                          </Box>
                        )}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {event.status === 'completed' ? (
                          `Requested: ${formatINR(event.budget)}`
                        ) : (
                          `Approved budget allocation`
                        )}
                      </Typography>
                      {event.status === 'completed' && event.actualBudget && (
                        <LinearProgress 
                          variant="determinate" 
                          value={calculateProgress(event.actualBudget, event.budget)}
                          sx={{ mt: 1, height: 6, borderRadius: 3 }}
                        />
                      )}
                    </Paper>
                  </Grid>

                  {/* Enquiry Generation Metrics */}
                  {(event.plannedEnquiries || event.actualEnquiries) && (
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 3, textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
                        <PersonIcon sx={{ fontSize: 40, color: 'warning.main', mb: 1 }} />
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>Enquiry Generation</Typography>
                        <Typography variant="h6" fontWeight="bold">
                          {event.actualEnquiries !== undefined ? event.actualEnquiries : (
                            <Box component="span" sx={{ color: 'warning.main', fontStyle: 'italic' }}>
                              Pending
                            </Box>
                          )}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Target: {event.plannedEnquiries || 'TBD'}
                        </Typography>
                        {event.plannedEnquiries && event.actualEnquiries !== undefined && (
                          <LinearProgress 
                            variant="determinate" 
                            value={calculateProgress(event.actualEnquiries, event.plannedEnquiries)}
                            sx={{ mt: 1, height: 6, borderRadius: 3 }}
                            color="warning"
                          />
                        )}
                      </Paper>
                    </Grid>
                  )}

                  {/* Sales Conversion Metrics */}
                  {(event.plannedOrders || event.actualOrders) && (
                    <Grid item xs={12} md={4}>
                      <Paper sx={{ p: 3, textAlign: 'center', border: '1px solid', borderColor: 'divider' }}>
                        <ProductIcon sx={{ fontSize: 40, color: 'success.main', mb: 1 }} />
                        <Typography variant="subtitle2" color="text.secondary" gutterBottom>Sales Conversion</Typography>
                        <Typography variant="h6" fontWeight="bold">
                          {event.actualOrders !== undefined ? event.actualOrders : (
                            <Box component="span" sx={{ color: 'warning.main', fontStyle: 'italic' }}>
                              Pending
                            </Box>
                          )}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Target: {event.plannedOrders || 'TBD'}
                        </Typography>
                        {event.plannedOrders && event.actualOrders !== undefined && (
                          <LinearProgress 
                            variant="determinate" 
                            value={calculateProgress(event.actualOrders, event.plannedOrders)}
                            sx={{ mt: 1, height: 6, borderRadius: 3 }}
                            color="success"
                          />
                        )}
                      </Paper>
                    </Grid>
                  )}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Attachments Section */}
        {event.attachments && event.attachments.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <AttachFileIcon sx={{ mr: 1, color: 'primary.main' }} />
                  Attachments ({event.attachments.length})
                </Typography>
                <Grid container spacing={2}>
                  {event.attachments.map((attachment) => (
                    <Grid item xs={12} sm={6} md={4} key={attachment.id}>
                      <Paper 
                        sx={{ 
                          p: 2, 
                          cursor: 'pointer', 
                          transition: 'all 0.2s',
                          '&:hover': { 
                            bgcolor: 'primary.50', 
                            transform: 'translateY(-2px)',
                            boxShadow: 2
                          }
                        }}
                        onClick={() => window.open(`${(api.defaults.baseURL || 'http://localhost:8080/api').replace('/api', '')}${attachment.fileUrl}`, '_blank')}
                      >
                        <Stack direction="row" spacing={1} alignItems="center">
                          <DownloadIcon color="primary" />
                          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                            <Typography variant="body2" fontWeight="medium" noWrap>
                              {attachment.filename}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {new Date(attachment.createdAt).toLocaleDateString()}
                            </Typography>
                          </Box>
                        </Stack>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        )}

        {/* Status Workflow Information */}
        <Grid item xs={12}>
          <Card sx={{ bgcolor: 'grey.50' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                <ScheduleIcon sx={{ mr: 1, color: 'primary.main' }} />
                Event Workflow Guide
              </Typography>
              
              <Grid container spacing={3}>
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom color="primary.main">
                    📋 Event Lifecycle:
                  </Typography>
                  <Box sx={{ pl: 2 }}>
                    <Typography variant="body2" paragraph>
                      <strong>1. Draft</strong> → Create and edit your event details
                    </Typography>
                    <Typography variant="body2" paragraph>
                      <strong>2. Approval Process:</strong> Draft → Pending GM → Pending Marketing → Approved
                    </Typography>
                    <Typography variant="body2" paragraph>
                      <strong>3. Approved</strong> → Event is ready to execute
                    </Typography>
                    <Typography variant="body2">
                      <strong>4. Completed</strong> → Event has finished with actual results
                    </Typography>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle2" gutterBottom color="primary.main">
                    ⚡ Current Status: <strong>{event.status.toUpperCase().replace('_', ' ')}</strong>
                  </Typography>
                  <Box sx={{ pl: 2 }}>
                    {event.status.toLowerCase() === 'draft' && (
                      <Box>
                        {currentUserRole === 'sales_manager' && isEventCreator && (
                          <Typography variant="body2" color="text.secondary">
                            Your event is in draft mode. Submit it to your General Manager for approval when ready.
                          </Typography>
                        )}
                        {currentUserRole === 'general_manager' && isEventCreator && (
                          <Typography variant="body2" color="text.secondary">
                            Your event is in draft mode. Submit it to another General Manager for approval when ready.
                          </Typography>
                        )}
                        {!isEventCreator && (
                          <Typography variant="body2" color="text.secondary">
                            This event is still in draft mode by the creator.
                          </Typography>
                        )}
                      </Box>
                    )}
                    {event.status.toLowerCase() === 'pending_gm' && (
                      <Typography variant="body2" color="text.secondary">
                        Event is pending General Manager approval. Once approved, it will go to Marketing Head for final approval.
                      </Typography>
                    )}
                    {event.status.toLowerCase() === 'pending_marketing' && (
                      <Typography variant="body2" color="text.secondary">
                        Event is pending Marketing Head final approval for execution.
                      </Typography>
                    )}
                    {event.status.toLowerCase() === 'approved' && (
                      <Typography variant="body2" color="text.secondary">
                        Excellent! Your event has been fully approved and is ready to execute. Mark it as complete when finished.
                      </Typography>
                    )}
                    {event.status.toLowerCase() === 'approved' && !isReadyForCompletion() && (
                      <Box sx={{ mt: 1, p: 2, bgcolor: 'warning.50', border: '1px solid', borderColor: 'warning.200', borderRadius: 1 }}>
                        <Typography variant="body2" color="warning.main" fontWeight="medium">
                          ⚠️ To mark as complete, please update actual results:
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          • {getMissingActualValues().join('\n• ')}
                        </Typography>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                          Click "Edit Metrics" to add the missing values.
                        </Typography>
                      </Box>
                    )}
                    {event.status.toLowerCase() === 'rejected' && (
                      <Typography variant="body2" color="text.secondary">
                        Event needs revisions. Please review the feedback below and resubmit when ready.
                      </Typography>
                    )}
                    {event.status.toLowerCase() === 'completed' && (
                      <Typography variant="body2" color="text.secondary">
                        This event has been completed. Great work! 🎉
                      </Typography>
                    )}
                  </Box>
                </Grid>
                
                {/* Edit Permissions Info */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 2, bgcolor: 'info.50', border: '1px solid', borderColor: 'divider' }}>
                    <Typography variant="subtitle2" gutterBottom>
                      📝 Edit Permissions:
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {getEditPermissionMessage()}
                    </Typography>
                  </Paper>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>

        {/* Comments & Feedback Section */}
        {event.comments && event.comments.length > 0 && (
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <CommentIcon sx={{ mr: 1, color: 'primary.main' }} />
                  Comments & Feedback ({event.comments.length})
                </Typography>
                
                <List disablePadding>
                  {event.comments?.map((comment, index) => (
                    <React.Fragment key={comment.id}>
                      <ListItem disablePadding sx={{ alignItems: 'flex-start', py: 2 }}>
                        <Avatar sx={{ mr: 2, mt: 0.5, bgcolor: getCommentColor(comment.commentType) }}>
                          {comment.commentedBy.username.charAt(0).toUpperCase()}
                        </Avatar>
                        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {comment.commentedBy.username}
                            </Typography>
                            <Chip
                              size="small"
                              label={comment.commentedBy.role.replace('_', ' ').toUpperCase()}
                              sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                            />
                            {comment.statusFrom && comment.statusTo && (
                              <Chip
                                size="small"
                                label={`${comment.statusFrom} → ${comment.statusTo}`}
                                color="primary"
                                variant="outlined"
                                sx={{ ml: 1, height: 20, fontSize: '0.7rem' }}
                              />
                            )}
                            <Typography variant="caption" color="text.secondary" sx={{ ml: 'auto' }}>
                              {new Date(comment.createdAt).toLocaleString()}
                            </Typography>
                          </Box>
                          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                            {comment.comment}
                          </Typography>
                        </Box>
                      </ListItem>
                      {index < (event.comments?.length || 0) - 1 && <Divider sx={{ my: 1 }} />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>

      {/* Comment Dialog */}
      <Dialog open={commentDialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedAction?.icon} {selectedAction?.label}
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Add a comment to explain your decision (optional but recommended):
          </Typography>
          <TextField
            autoFocus
            margin="dense"
            id="comment"
            label="Comment"
            type="text"
            fullWidth
            multiline
            rows={3}
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="Enter your feedback or reason for this action..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button 
            onClick={confirmStatusChange} 
            variant="contained" 
            color={getValidButtonColor(selectedAction?.color || 'primary')}
          >
            {selectedAction?.icon} {selectedAction?.label}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

const getCommentColor = (commentType: string) => {
  switch (commentType) {
    case 'approval': return 'success.main';
    case 'rejection': return 'error.main';
    case 'feedback': return 'warning.main';
    default: return 'primary.main';
  }
};

export default EventDetails; 