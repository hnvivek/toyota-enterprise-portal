import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Button,
  CircularProgress,
  Alert,
  IconButton,
  Tooltip,
  FormControl,
  Select,
  MenuItem,
  InputLabel,
  Stack,
  Badge,
  Pagination,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  CheckCircle as CheckIcon,
  RadioButtonUnchecked as UnreadIcon,
  Campaign as AnnouncementIcon,
  Schedule as ReminderIcon,
  Event as EventIcon,
  Business as BusinessIcon,
  DeleteSweep as ClearAllIcon,
  FilterList as FilterIcon,
} from '@mui/icons-material';
import { api } from '../config/api';
import { useNavigate } from 'react-router-dom';

interface Notification {
  id: number;
  type: string;
  title: string;
  message: string;
  isRead: boolean;
  relatedEntityId?: number;
  relatedEntityType?: string;
  actionUrl?: string;
  createdAt: string;
}

const Notifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [unreadCount, setUnreadCount] = useState(0);
  const [markingAllRead, setMarkingAllRead] = useState(false);
  
  const theme = useTheme();
  const navigate = useNavigate();

  useEffect(() => {
    fetchNotifications();
  }, [page, filter]);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      const limit = 10;
      const offset = (page - 1) * limit;
      
      const response = await api.get(`/notifications?limit=${limit}&offset=${offset}`, { headers });
      
      let filteredNotifications = response.data.notifications || [];
      
      // Apply client-side filtering
      if (filter !== 'all') {
        if (filter === 'unread') {
          filteredNotifications = filteredNotifications.filter((n: Notification) => !n.isRead);
        } else {
          filteredNotifications = filteredNotifications.filter((n: Notification) => n.type === filter);
        }
      }
      
      setNotifications(filteredNotifications);
      setUnreadCount(response.data.unreadCount || 0);
      setTotalPages(Math.ceil((response.data.total || 0) / limit));
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error fetching notifications');
      console.error('Error fetching notifications:', err);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notificationId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };
      await api.put(`/notifications/${notificationId}/read`, {}, { headers });
      
      // Update local state
      setNotifications(prev => 
        prev.map(n => n.id === notificationId ? { ...n, isRead: true } : n)
      );
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const markAllAsRead = async () => {
    try {
      setMarkingAllRead(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };
      await api.put('/notifications/mark-all-read', {}, { headers });
      
      // Update local state
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    } finally {
      setMarkingAllRead(false);
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    if (!notification.isRead) {
      await markAsRead(notification.id);
    }

    if (notification.actionUrl) {
      // Check if it's an external URL
      if (notification.actionUrl.startsWith('http://') || notification.actionUrl.startsWith('https://')) {
        // Open external links in new tab
        window.open(notification.actionUrl, '_blank', 'noopener,noreferrer');
      } else {
        // Use internal navigation for app routes
        navigate(notification.actionUrl);
      }
    }
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'event_created':
      case 'event_approved':
      case 'event_rejected':
      case 'event_updated':
        return <EventIcon color="primary" />;
      case 'system_announcement':
        return <AnnouncementIcon color="info" />;
      case 'reminder':
        return <ReminderIcon color="warning" />;
      case 'budget_approved':
      case 'budget_rejected':
        return <BusinessIcon color="secondary" />;
      default:
        return <NotificationsIcon color="action" />;
    }
  };

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case 'event_created':
        return 'Event Created';
      case 'event_approved':
        return 'Event Approved';
      case 'event_rejected':
        return 'Event Rejected';
      case 'event_updated':
        return 'Event Updated';
      case 'system_announcement':
        return 'Announcement';
      case 'reminder':
        return 'Reminder';
      case 'budget_approved':
        return 'Budget Approved';
      case 'budget_rejected':
        return 'Budget Rejected';
      default:
        return 'Notification';
    }
  };

  const formatTime = (createdAt: string) => {
    const now = new Date();
    const notificationTime = new Date(createdAt);
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hour${Math.floor(diffInMinutes / 60) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffInMinutes / 1440)} day${Math.floor(diffInMinutes / 1440) > 1 ? 's' : ''} ago`;
  };

  if (loading && notifications.length === 0) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <Badge badgeContent={unreadCount} color="error">
            {unreadCount > 0 ? <NotificationsActiveIcon color="primary" /> : <NotificationsIcon color="primary" />}
          </Badge>
          <Typography variant="h4" component="h1" fontWeight="600">
            Notifications
          </Typography>
        </Box>
        
        {/* Controls */}
        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel>Filter</InputLabel>
            <Select
              value={filter}
              label="Filter"
              onChange={(e) => {
                setFilter(e.target.value);
                setPage(1);
              }}
              startAdornment={<FilterIcon sx={{ mr: 1, color: 'action' }} />}
            >
              <MenuItem value="all">All Notifications</MenuItem>
              <MenuItem value="unread">Unread Only</MenuItem>
              <MenuItem value="event_approved">Event Approved</MenuItem>
              <MenuItem value="event_rejected">Event Rejected</MenuItem>
              <MenuItem value="event_updated">Event Updates</MenuItem>
              <MenuItem value="system_announcement">Announcements</MenuItem>
              <MenuItem value="reminder">Reminders</MenuItem>
            </Select>
          </FormControl>
          
          {unreadCount > 0 && (
            <Button
              variant="outlined"
              size="small"
              onClick={markAllAsRead}
              disabled={markingAllRead}
              startIcon={markingAllRead ? <CircularProgress size={16} /> : <ClearAllIcon />}
            >
              Mark All Read
            </Button>
          )}
        </Stack>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {/* Notifications List */}
      <Paper elevation={1}>
        {notifications.length === 0 ? (
          <Box sx={{ p: 4, textAlign: 'center' }}>
            <NotificationsIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No notifications found
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {filter === 'unread' ? 'You have no unread notifications.' : 'You have no notifications yet.'}
            </Typography>
          </Box>
        ) : (
          <List disablePadding>
            {notifications.map((notification, index) => (
              <ListItem
                key={notification.id}
                button
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  borderBottom: index < notifications.length - 1 ? `1px solid ${theme.palette.divider}` : 'none',
                  backgroundColor: !notification.isRead ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
                  '&:hover': {
                    backgroundColor: !notification.isRead 
                      ? alpha(theme.palette.primary.main, 0.1) 
                      : alpha(theme.palette.action.hover, 0.5)
                  },
                  py: 2
                }}
              >
                <ListItemIcon>
                  {getNotificationIcon(notification.type)}
                </ListItemIcon>
                
                <ListItemText
                  primary={
                    <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 0.5 }}>
                      <Typography 
                        variant="subtitle1" 
                        sx={{ 
                          fontWeight: !notification.isRead ? 600 : 400,
                          flexGrow: 1,
                          wordWrap: 'break-word',
                          whiteSpace: 'normal',
                          lineHeight: 1.3
                        }}
                      >
                        {notification.title}
                      </Typography>
                      <Chip 
                        label={getNotificationTypeLabel(notification.type)} 
                        size="small" 
                        variant="outlined"
                        sx={{ fontSize: '0.7rem', flexShrink: 0 }}
                      />
                    </Box>
                  }
                  secondary={
                    <Box>
                      <Typography 
                        variant="body2" 
                        color="text.secondary"
                        sx={{ 
                          mb: 0.5, 
                          lineHeight: 1.4,
                          wordWrap: 'break-word',
                          whiteSpace: 'normal'
                        }}
                      >
                        {notification.message}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ fontSize: '0.75rem' }}
                      >
                        {formatTime(notification.createdAt)}
                      </Typography>
                    </Box>
                  }
                />
                
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  {!notification.isRead && (
                    <Tooltip title="Mark as read">
                      <IconButton
                        size="small"
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.id);
                        }}
                      >
                        <UnreadIcon color="primary" />
                      </IconButton>
                    </Tooltip>
                  )}
                  {notification.isRead && (
                    <CheckIcon color="success" sx={{ fontSize: 20 }} />
                  )}
                </Box>
              </ListItem>
            ))}
          </List>
        )}
      </Paper>

      {/* Pagination */}
      {totalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={page}
            onChange={(_, newPage) => setPage(newPage)}
            color="primary"
          />
        </Box>
      )}
    </Box>
  );
};

export default Notifications; 