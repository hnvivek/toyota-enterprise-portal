import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  TextField,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Alert,
  CircularProgress,
  Grid,
  Card,
  CardContent,
  CardHeader,
  Divider,
  Stack,
  Autocomplete,
  Switch,
  FormControlLabel,
  useTheme,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  Campaign as AnnouncementIcon,
  Schedule as ReminderIcon,
  Send as SendIcon,
  People as PeopleIcon,
  Person as PersonIcon,
  Notifications as NotificationsIcon,
  CheckCircle as SuccessIcon,
  CleaningServices as CleanupIcon,
  BarChart as StatsIcon,
  Refresh as RefreshIcon,
  Info as InfoIcon,
  Repeat as RecurringIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PlayArrow as PlayIcon,
  Pause as PauseIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { api } from '../../config/api';
import { useUser } from '../../contexts/UserContext';

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
}

interface RecurringReminder {
  id: number;
  title: string;
  message: string;
  recurringType: 'daily' | 'weekly' | 'monthly';
  actionUrl?: string;
  targetRoles?: string[];
  targetUserIds?: number[];
  endDate?: string;
  isActive: boolean;
  lastExecuted?: string;
  nextExecution?: string;
  recipientCount: number;
  createdBy: {
    id: number;
    username: string;
    role: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface NotificationStats {
  total: number;
  unread: number;
  read: number;
  byType: Record<string, number>;
  byAge: {
    recent: number;
    medium: number;
    old: number;
  };
  retentionPolicy: {
    readNotifications: string;
    systemAnnouncements: string;
    allNotifications: string;
    autoMarkReminders: string;
  };
  lastUpdated: string;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`notification-tabpanel-${index}`}
      aria-labelledby={`notification-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const NotificationManager = () => {
  const [tabValue, setTabValue] = useState(0);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  
  // Unified Notification State (replaces both announcement and reminder states)
  const [notificationData, setNotificationData] = useState({
    type: 'announcement' as 'announcement' | 'reminder',
    title: '',
    message: '',
    targetRoles: [] as string[],
    selectedUsers: [] as User[],
    actionUrl: '',
    sendToAll: false,
    sendToRoles: false,
    isRecurring: false,
    recurringType: 'daily' as 'daily' | 'weekly' | 'monthly',
    recurringEndDate: '',
  });

  // Cleanup & Stats State
  const [stats, setStats] = useState<NotificationStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<any>(null);

  // Recurring Reminders State
  const [recurringReminders, setRecurringReminders] = useState<RecurringReminder[]>([]);
  const [loadingRecurring, setLoadingRecurring] = useState(false);
  const [editingReminder, setEditingReminder] = useState<RecurringReminder | null>(null);
  const [showEditDialog, setShowEditDialog] = useState(false);

  const theme = useTheme();
  const { currentUser } = useUser();

  const roles = [
    { value: 'admin', label: 'Administrators' },
    { value: 'sales_manager', label: 'Sales Managers' },
    { value: 'general_manager', label: 'General Managers' },
    { value: 'marketing_manager', label: 'Marketing Managers' },
    { value: 'marketing_head', label: 'Marketing Heads' },
  ];

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found for fetching users');
        return;
      }

      const headers = { Authorization: `Bearer ${token}` };
      console.log('Fetching users...');
      const response = await api.get('/users', { headers });
      console.log('Users response:', response.data);
      
      // Handle both direct array response and object with users property
      const usersData = Array.isArray(response.data) ? response.data : response.data.users || [];
      setUsers(usersData);
      console.log(`Loaded ${usersData.length} users`);
    } catch (err: any) {
      console.error('Error fetching users:', err);
      console.error('Error response:', err.response?.data);
      setError(err.response?.data?.message || 'Error fetching users');
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
    clearMessages();
    
    // Load stats when cleanup tab is opened
    if (newValue === 2) {
      fetchStats();
    }
    
    // Load recurring reminders when that tab is opened
    if (newValue === 1) {
      fetchRecurringReminders();
    }
  };

  const clearMessages = () => {
    setSuccess(null);
    setError(null);
  };

  const fetchStats = async () => {
    try {
      setLoadingStats(true);
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No token found for stats request');
        return;
      }

      console.log('Fetching notification stats with token:', token.substring(0, 20) + '...');
      const headers = { Authorization: `Bearer ${token}` };
      
      console.log('Making request to:', '/notifications/admin/stats');
      const response = await api.get('/notifications/admin/stats', { headers });
      console.log('Stats response received:', response.data);
      
      setStats(response.data);
    } catch (err: any) {
      console.error('Error fetching stats:', err);
      console.error('Error response:', err.response?.data);
      console.error('Error status:', err.response?.status);
      setError(err.response?.data?.message || 'Error fetching notification statistics');
    } finally {
      setLoadingStats(false);
    }
  };

  const fetchRecurringReminders = async () => {
    try {
      setLoadingRecurring(true);
      const token = localStorage.getItem('token');
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };
      const response = await api.get('/notifications/recurring-reminders', { headers });
      setRecurringReminders(response.data);
    } catch (err: any) {
      console.error('Error fetching recurring reminders:', err);
      setError(err.response?.data?.message || 'Error fetching recurring reminders');
    } finally {
      setLoadingRecurring(false);
    }
  };

  const updateRecurringReminder = async (id: number, updates: Partial<RecurringReminder>) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const headers = { Authorization: `Bearer ${token}` };
      await api.put(`/notifications/recurring-reminders/${id}`, updates, { headers });
      
      setSuccess('Recurring reminder updated successfully!');
      await fetchRecurringReminders();
      setShowEditDialog(false);
      setEditingReminder(null);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error updating recurring reminder');
    } finally {
      setLoading(false);
    }
  };

  const deleteRecurringReminder = async (id: number) => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const headers = { Authorization: `Bearer ${token}` };
      await api.delete(`/notifications/recurring-reminders/${id}`, { headers });
      
      setSuccess('Recurring reminder deleted successfully!');
      await fetchRecurringReminders();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error deleting recurring reminder');
    } finally {
      setLoading(false);
    }
  };

  const triggerCleanup = async () => {
    try {
      setLoading(true);
      clearMessages();

      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const headers = { Authorization: `Bearer ${token}` };
      const response = await api.post('/notifications/admin/cleanup', {}, { headers });
      
      setCleanupResult(response.data);
      setSuccess(`Cleanup completed! Deleted ${response.data.deletedTotal} notifications total.`);
      
      // Refresh stats after cleanup
      await fetchStats();
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error during cleanup');
    } finally {
      setLoading(false);
    }
  };

  const sendSystemAnnouncement = async () => {
    try {
      setLoading(true);
      clearMessages();

      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const headers = { Authorization: `Bearer ${token}` };
      
      const payload = {
        title: notificationData.title,
        message: notificationData.message,
        targetRoles: notificationData.sendToAll ? [] : notificationData.targetRoles,
        actionUrl: notificationData.actionUrl || undefined,
      };

      const response = await api.post('/notifications/system-announcement', payload, { headers });
      
      setSuccess(`System announcement sent successfully to ${response.data.recipientCount} users!`);
      
      // Reset form
      setNotificationData({
        type: 'announcement',
        title: '',
        message: '',
        targetRoles: [],
        selectedUsers: [],
        actionUrl: '',
        sendToAll: false,
        sendToRoles: false,
        isRecurring: false,
        recurringType: 'daily',
        recurringEndDate: '',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error sending system announcement');
    } finally {
      setLoading(false);
    }
  };

  const sendReminder = async () => {
    try {
      setLoading(true);
      clearMessages();

      const token = localStorage.getItem('token');
      if (!token) throw new Error('No authentication token');

      const headers = { Authorization: `Bearer ${token}` };
      
      // Validate that either users or roles are selected
      if (!notificationData.sendToRoles && notificationData.selectedUsers.length === 0) {
        setError('Please select at least one user to send the reminder to');
        return;
      }
      
      if (notificationData.sendToRoles && notificationData.targetRoles.length === 0) {
        setError('Please select at least one role to send the reminder to');
        return;
      }

      const payload: any = {
        title: notificationData.title,
        message: notificationData.message,
        actionUrl: notificationData.actionUrl || undefined,
        isRecurring: notificationData.isRecurring,
      };

      // Add recurring details if applicable
      if (notificationData.isRecurring) {
        payload.recurringType = notificationData.recurringType;
        payload.recurringEndDate = notificationData.recurringEndDate || undefined;
      }

      // Add either userIds or targetRoles
      if (notificationData.sendToRoles) {
        payload.targetRoles = notificationData.targetRoles;
      } else {
        payload.userIds = notificationData.selectedUsers.map(user => user.id);
      }

      const response = await api.post('/notifications/reminder', payload, { headers });
      
      const recipientCount = response.data.recipientCount;
      const recurringText = notificationData.isRecurring ? ` (recurring ${notificationData.recurringType})` : '';
      setSuccess(`Reminder sent successfully to ${recipientCount} users${recurringText}!`);
      
      // Reset form
      setNotificationData({
        type: 'reminder',
        title: '',
        message: '',
        targetRoles: [],
        selectedUsers: [],
        actionUrl: '',
        sendToAll: false,
        sendToRoles: false,
        isRecurring: false,
        recurringType: 'daily',
        recurringEndDate: '',
      });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error sending reminder');
    } finally {
      setLoading(false);
    }
  };

  const isNotificationValid = () => {
    const hasTitle = notificationData.title.trim();
    const hasMessage = notificationData.message.trim();
    
    if (notificationData.type === 'announcement') {
      const hasRecipients = notificationData.sendToAll || notificationData.targetRoles.length > 0;
      return hasTitle && hasMessage && hasRecipients;
    } else {
      const hasRecipients = notificationData.sendToRoles 
        ? notificationData.targetRoles.length > 0 
        : notificationData.selectedUsers.length > 0;
      return hasTitle && hasMessage && hasRecipients;
    }
  };

  // Check if user is admin
  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error">
          Access denied. Only administrators can manage notifications.
        </Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
          <NotificationsIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" component="h1" fontWeight="600">
            Notification Manager
          </Typography>
        </Box>
        <Typography variant="body1" color="text.secondary">
          Send system announcements and reminders to users across the organization.
        </Typography>
      </Box>

      {/* Success/Error Messages */}
      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess(null)}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <SuccessIcon />
            {success}
          </Box>
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Main Content */}
      <Paper elevation={1}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange}>
            <Tab
              icon={<SendIcon />}
              label="Send Notifications"
              id="notification-tab-0"
              aria-controls="notification-tabpanel-0"
            />
            <Tab
              icon={<RecurringIcon />}
              label="Recurring Reminders"
              id="notification-tab-1"
              aria-controls="notification-tabpanel-1"
            />
            <Tab
              icon={<CleanupIcon />}
              label="Cleanup & Stats"
              id="notification-tab-2"
              aria-controls="notification-tabpanel-2"
            />
          </Tabs>
        </Box>

        {/* Send Notifications Tab (Unified) */}
        <TabPanel value={tabValue} index={0}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Card>
                <CardHeader
                  title="Send Notifications"
                  subheader="Send announcements or reminders to users across the organization"
                  avatar={<SendIcon color="primary" />}
                />
                <CardContent>
                  <Stack spacing={3}>
                    <FormControl fullWidth>
                      <InputLabel>Notification Type</InputLabel>
                      <Select
                        value={notificationData.type}
                        onChange={(e) => setNotificationData(prev => ({ 
                          ...prev, 
                          type: e.target.value as 'announcement' | 'reminder'
                        }))}
                        label="Notification Type"
                      >
                        <MenuItem value="announcement">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <AnnouncementIcon />
                            📢 System Announcement
                          </Box>
                        </MenuItem>
                        <MenuItem value="reminder">
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ReminderIcon />
                            ⏰ Reminder
                          </Box>
                        </MenuItem>
                      </Select>
                    </FormControl>

                    <TextField
                      label={`${notificationData.type === 'announcement' ? 'Announcement' : 'Reminder'} Title`}
                      fullWidth
                      value={notificationData.title}
                      onChange={(e) => setNotificationData(prev => ({ ...prev, title: e.target.value }))}
                      placeholder={notificationData.type === 'announcement' 
                        ? "e.g., New Event Submission Guidelines" 
                        : "e.g., Monthly Report Due"}
                      required
                    />

                    <TextField
                      label="Message"
                      fullWidth
                      multiline
                      rows={4}
                      value={notificationData.message}
                      onChange={(e) => setNotificationData(prev => ({ ...prev, message: e.target.value }))}
                      placeholder={`Enter your ${notificationData.type} message here...`}
                      required
                    />

                    {notificationData.type === 'announcement' ? (
                      <>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={notificationData.sendToAll}
                              onChange={(e) => setNotificationData(prev => ({ 
                                ...prev, 
                                sendToAll: e.target.checked,
                                targetRoles: e.target.checked ? [] : prev.targetRoles
                              }))}
                            />
                          }
                          label="Send to all users"
                        />

                        {!notificationData.sendToAll && (
                          <FormControl fullWidth>
                            <InputLabel>Target Roles</InputLabel>
                            <Select
                              multiple
                              value={notificationData.targetRoles}
                              onChange={(e) => setNotificationData(prev => ({ 
                                ...prev, 
                                targetRoles: e.target.value as string[] 
                              }))}
                              renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {selected.map((value) => (
                                    <Chip 
                                      key={value} 
                                      label={roles.find(role => role.value === value)?.label || value}
                                      size="small"
                                    />
                                  ))}
                                </Box>
                              )}
                              required={!notificationData.sendToAll}
                            >
                              {roles.map((role) => (
                                <MenuItem key={role.value} value={role.value}>
                                  <PeopleIcon sx={{ mr: 1 }} />
                                  {role.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        )}
                      </>
                    ) : (
                      <>
                        <FormControlLabel
                          control={
                            <Switch
                              checked={notificationData.sendToRoles}
                              onChange={(e) => setNotificationData(prev => ({ 
                                ...prev, 
                                sendToRoles: e.target.checked,
                                selectedUsers: e.target.checked ? [] : prev.selectedUsers,
                                targetRoles: e.target.checked ? prev.targetRoles : []
                              }))}
                            />
                          }
                          label="Send to specific roles instead of individual users"
                        />

                        {notificationData.sendToRoles ? (
                          <FormControl fullWidth>
                            <InputLabel>Target Roles</InputLabel>
                            <Select
                              multiple
                              value={notificationData.targetRoles}
                              onChange={(e) => setNotificationData(prev => ({ 
                                ...prev, 
                                targetRoles: e.target.value as string[] 
                              }))}
                              renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                  {selected.map((value) => (
                                    <Chip 
                                      key={value} 
                                      label={roles.find(role => role.value === value)?.label || value}
                                      size="small"
                                    />
                                  ))}
                                </Box>
                              )}
                              required
                            >
                              {roles.map((role) => (
                                <MenuItem key={role.value} value={role.value}>
                                  <PeopleIcon sx={{ mr: 1 }} />
                                  {role.label}
                                </MenuItem>
                              ))}
                            </Select>
                          </FormControl>
                        ) : (
                          <Autocomplete
                            multiple
                            options={users}
                            getOptionLabel={(option) => `${option.username} (${option.email}) - ${option.role.replace('_', ' ')}`}
                            value={notificationData.selectedUsers}
                            onChange={(event, newValue) => {
                              setNotificationData(prev => ({ ...prev, selectedUsers: newValue }));
                            }}
                            renderTags={(value, getTagProps) =>
                              value.map((option, index) => (
                                <Chip
                                  variant="outlined"
                                  label={`${option.username} (${option.role.replace('_', ' ')})`}
                                  {...getTagProps({ index })}
                                  key={option.id}
                                />
                              ))
                            }
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                label="Select Users"
                                placeholder="Search and select users..."
                                required={!notificationData.sendToRoles && notificationData.selectedUsers.length === 0}
                                helperText={`${users.length} users available`}
                              />
                            )}
                            renderOption={(props, option) => (
                              <Box component="li" {...props}>
                                <PersonIcon sx={{ mr: 2 }} />
                                <Box>
                                  <Typography variant="body2">{option.username}</Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {option.email} • {option.role.replace('_', ' ')}
                                  </Typography>
                                </Box>
                              </Box>
                            )}
                            limitTags={3}
                            ChipProps={{ size: "small" }}
                          />
                        )}

                        <FormControlLabel
                          control={
                            <Switch
                              checked={notificationData.isRecurring}
                              onChange={(e) => setNotificationData(prev => ({ ...prev, isRecurring: e.target.checked }))}
                            />
                          }
                          label="Make this a recurring reminder"
                        />

                        {notificationData.isRecurring && (
                          <Stack spacing={2}>
                            <FormControl fullWidth>
                              <InputLabel>Recurring Frequency</InputLabel>
                              <Select
                                value={notificationData.recurringType}
                                onChange={(e) => setNotificationData(prev => ({ 
                                  ...prev, 
                                  recurringType: e.target.value as 'daily' | 'weekly' | 'monthly'
                                }))}
                              >
                                <MenuItem value="daily">Daily</MenuItem>
                                <MenuItem value="weekly">Weekly</MenuItem>
                                <MenuItem value="monthly">Monthly</MenuItem>
                              </Select>
                            </FormControl>

                            <TextField
                              label="End Date (Optional)"
                              type="date"
                              fullWidth
                              value={notificationData.recurringEndDate}
                              onChange={(e) => setNotificationData(prev => ({ ...prev, recurringEndDate: e.target.value }))}
                              InputLabelProps={{ shrink: true }}
                              helperText="Leave empty for indefinite recurring"
                            />
                          </Stack>
                        )}
                      </>
                    )}

                    <TextField
                      label="Action URL (Optional)"
                      fullWidth
                      value={notificationData.actionUrl}
                      onChange={(e) => setNotificationData(prev => ({ ...prev, actionUrl: e.target.value }))}
                      placeholder="e.g., /events or https://docs.toyota.com"
                      helperText="Internal routes (e.g., /events) or external URLs (e.g., https://docs.toyota.com) - external links open in new tab"
                    />

                    <Button
                      variant="contained"
                      size="large"
                      startIcon={loading ? <CircularProgress size={20} /> : <SendIcon />}
                      onClick={notificationData.type === 'announcement' ? sendSystemAnnouncement : sendReminder}
                      disabled={loading || !isNotificationValid()}
                      fullWidth
                    >
                      {loading ? 'Sending...' : 
                        `Send ${notificationData.isRecurring ? 'Recurring ' : ''}${
                          notificationData.type === 'announcement' ? 'Announcement' : 'Reminder'
                        }${
                          notificationData.type === 'announcement' 
                            ? (notificationData.sendToAll ? ' to All Users' : 
                               notificationData.targetRoles.length > 0 ? ` to ${notificationData.targetRoles.length} role${notificationData.targetRoles.length > 1 ? 's' : ''}` : '')
                            : (notificationData.sendToRoles 
                                ? notificationData.targetRoles.length > 0 ? ` to ${notificationData.targetRoles.length} role${notificationData.targetRoles.length > 1 ? 's' : ''}` : ''
                                : notificationData.selectedUsers.length > 0 ? ` to ${notificationData.selectedUsers.length} user${notificationData.selectedUsers.length > 1 ? 's' : ''}` : '')
                        }`}
                    </Button>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            <Grid item xs={12} md={4}>
              <Stack spacing={3}>
                <Card sx={{ 
                  bgcolor: notificationData.type === 'announcement' ? theme.palette.info.main : theme.palette.warning.main, 
                  color: 'white' 
                }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      {notificationData.type === 'announcement' ? '📢 System Announcements' : '⏰ Reminders'}
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      {notificationData.type === 'announcement' 
                        ? 'Perfect for organization-wide updates, policy changes, or important notices.'
                        : 'Send targeted reminders to specific individuals or roles, with optional recurring schedules.'}
                    </Typography>
                    {notificationData.type === 'announcement' ? (
                      <Typography variant="body2">
                        <strong>Examples:</strong>
                        <br />• New submission deadlines
                        <br />• System maintenance notices
                        <br />• Policy updates
                        <br />• Training announcements
                      </Typography>
                    ) : (
                      <>
                        <Typography variant="body2" sx={{ mb: 1 }}>
                          <strong>Recipient Options:</strong>
                          <br />• Individual users (searchable)
                          <br />• Specific roles (bulk selection)
                        </Typography>
                        <Typography variant="body2">
                          <strong>Examples:</strong>
                          <br />• Report submission deadlines
                          <br />• Event completion reminders
                          <br />• Meeting notifications
                          <br />• Training schedule reminders
                        </Typography>
                      </>
                    )}
                  </CardContent>
                </Card>
              </Stack>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Recurring Reminders Tab */}
        <TabPanel value={tabValue} index={1}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Card>
                <CardHeader
                  title="Recurring Reminders Management"
                  subheader="View, edit, and manage all recurring reminder schedules"
                  avatar={<RecurringIcon color="primary" />}
                  action={
                    <Button
                      startIcon={<RefreshIcon />}
                      onClick={fetchRecurringReminders}
                      disabled={loadingRecurring}
                      size="small"
                    >
                      Refresh
                    </Button>
                  }
                />
                <CardContent>
                  {loadingRecurring ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                      <CircularProgress />
                    </Box>
                  ) : recurringReminders.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <RecurringIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No Recurring Reminders
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Create your first recurring reminder in the Send Notifications tab above.
                      </Typography>
                    </Box>
                  ) : (
                    <Stack spacing={2}>
                      {recurringReminders.map((reminder) => (
                        <Card key={reminder.id} variant="outlined" sx={{ 
                          bgcolor: reminder.isActive ? 'background.paper' : 'grey.50',
                          border: reminder.isActive ? '1px solid' : '1px dashed',
                          borderColor: reminder.isActive ? 'primary.main' : 'grey.300'
                        }}>
                          <CardContent>
                            <Grid container spacing={2} alignItems="center">
                              <Grid item xs={12} md={6}>
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                  {reminder.isActive ? (
                                    <PlayIcon color="success" />
                                  ) : (
                                    <PauseIcon color="warning" />
                                  )}
                                  <Typography variant="h6" component="div">
                                    {reminder.title}
                                  </Typography>
                                  <Chip 
                                    label={reminder.recurringType} 
                                    size="small" 
                                    color="info"
                                    sx={{ textTransform: 'capitalize' }}
                                  />
                                </Box>
                                <Typography variant="body2" color="text.secondary" gutterBottom>
                                  {reminder.message}
                                </Typography>
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                                  <Chip 
                                    icon={<PeopleIcon />}
                                    label={`${reminder.recipientCount} recipient${reminder.recipientCount !== 1 ? 's' : ''}`}
                                    size="small"
                                    variant="outlined"
                                  />
                                  {reminder.targetRoles && reminder.targetRoles.length > 0 && (
                                    <Chip 
                                      label={`Roles: ${reminder.targetRoles.join(', ')}`}
                                      size="small"
                                      variant="outlined"
                                    />
                                  )}
                                  {reminder.endDate && (
                                    <Chip 
                                      icon={<CalendarIcon />}
                                      label={`Until: ${new Date(reminder.endDate).toLocaleDateString()}`}
                                      size="small"
                                      variant="outlined"
                                      color="warning"
                                    />
                                  )}
                                </Box>
                              </Grid>
                              
                              <Grid item xs={12} md={3}>
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Created by:</strong> {reminder.createdBy.username}
                                </Typography>
                                <Typography variant="body2" color="text.secondary">
                                  <strong>Created:</strong> {new Date(reminder.createdAt).toLocaleDateString()}
                                </Typography>
                                {reminder.nextExecution && (
                                  <Typography variant="body2" color="primary.main">
                                    <strong>Next:</strong> {new Date(reminder.nextExecution).toLocaleString()}
                                  </Typography>
                                )}
                                {reminder.lastExecuted && (
                                  <Typography variant="body2" color="text.secondary">
                                    <strong>Last:</strong> {new Date(reminder.lastExecuted).toLocaleString()}
                                  </Typography>
                                )}
                              </Grid>
                              
                              <Grid item xs={12} md={3}>
                                <Stack direction="row" spacing={1} justifyContent="flex-end">
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={reminder.isActive ? <PauseIcon /> : <PlayIcon />}
                                    onClick={() => updateRecurringReminder(reminder.id, { isActive: !reminder.isActive })}
                                    color={reminder.isActive ? "warning" : "success"}
                                  >
                                    {reminder.isActive ? 'Pause' : 'Resume'}
                                  </Button>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<EditIcon />}
                                    onClick={() => {
                                      setEditingReminder(reminder);
                                      setShowEditDialog(true);
                                    }}
                                  >
                                    Edit
                                  </Button>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    startIcon={<DeleteIcon />}
                                    onClick={() => {
                                      if (window.confirm(`Are you sure you want to delete the recurring reminder "${reminder.title}"?`)) {
                                        deleteRecurringReminder(reminder.id);
                                      }
                                    }}
                                    color="error"
                                  >
                                    Delete
                                  </Button>
                                </Stack>
                              </Grid>
                            </Grid>
                          </CardContent>
                        </Card>
                      ))}
                    </Stack>
                  )}
                </CardContent>
              </Card>
            </Grid>
            
            <Grid item xs={12} md={4}>
              <Card sx={{ bgcolor: theme.palette.primary.main, color: 'white' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    🔄 Recurring Reminders
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    Manage automated reminder schedules that run at specified intervals.
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    <strong>Management Options:</strong>
                    <br />• Pause/Resume reminders
                    <br />• Edit content and schedules
                    <br />• View execution history
                    <br />• Delete unused reminders
                  </Typography>
                  <Typography variant="body2">
                    <strong>Status Indicators:</strong>
                    <br />• <PlayIcon sx={{ fontSize: 16, verticalAlign: 'middle' }} /> Active reminders
                    <br />• <PauseIcon sx={{ fontSize: 16, verticalAlign: 'middle' }} /> Paused reminders
                    <br />• Solid border = Active
                    <br />• Dashed border = Inactive
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </TabPanel>

        {/* Cleanup Tab */}
        <TabPanel value={tabValue} index={2}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={8}>
              <Stack spacing={3}>
                {/* Manual Cleanup Card */}
                <Card>
                  <CardHeader
                    title="Manual Cleanup"
                    subheader="Trigger immediate cleanup of old notifications"
                    avatar={<CleanupIcon color="error" />}
                  />
                  <CardContent>
                    <Stack spacing={3}>
                      <Button
                        variant="contained"
                        color="error"
                        size="large"
                        startIcon={loading ? <CircularProgress size={20} /> : <CleanupIcon />}
                        onClick={triggerCleanup}
                        disabled={loading}
                        fullWidth
                      >
                        {loading ? 'Cleaning up...' : 'Trigger Manual Cleanup'}
                      </Button>
                      
                      {cleanupResult && (
                        <Card variant="outlined" sx={{ bgcolor: 'success.light', color: 'success.contrastText' }}>
                          <CardContent>
                            <Typography variant="h6" gutterBottom>
                              ✅ Last Cleanup Results
                            </Typography>
                            <Typography variant="body2">
                              • Read notifications deleted: {cleanupResult.deletedRead}
                            </Typography>
                            <Typography variant="body2">
                              • Old notifications deleted: {cleanupResult.deletedOld}
                            </Typography>
                            <Typography variant="body2">
                              • Total deleted: {cleanupResult.deletedTotal}
                            </Typography>
                            <Typography variant="body2">
                              • Completed: {new Date(cleanupResult.timestamp).toLocaleString()}
                            </Typography>
                          </CardContent>
                        </Card>
                      )}
                    </Stack>
                  </CardContent>
                </Card>

                {/* Statistics Card */}
                <Card>
                  <CardHeader
                    title="Notification Statistics"
                    subheader="Current state of the notification system"
                    avatar={<StatsIcon color="info" />}
                    action={
                      <Button
                        startIcon={<RefreshIcon />}
                        onClick={fetchStats}
                        disabled={loadingStats}
                        size="small"
                      >
                        Refresh
                      </Button>
                    }
                  />
                  <CardContent>
                    {loadingStats ? (
                      <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                        <CircularProgress />
                      </Box>
                    ) : stats ? (
                      <Grid container spacing={2}>
                        <Grid item xs={12} sm={6} md={3}>
                          <Card variant="outlined">
                            <CardContent sx={{ textAlign: 'center' }}>
                              <Typography variant="h4" color="primary.main">
                                {stats.total.toLocaleString()}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Total Notifications
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Card variant="outlined">
                            <CardContent sx={{ textAlign: 'center' }}>
                              <Typography variant="h4" color="warning.main">
                                {stats.unread.toLocaleString()}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Unread
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Card variant="outlined">
                            <CardContent sx={{ textAlign: 'center' }}>
                              <Typography variant="h4" color="success.main">
                                {stats.read.toLocaleString()}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Read
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                        <Grid item xs={12} sm={6} md={3}>
                          <Card variant="outlined">
                            <CardContent sx={{ textAlign: 'center' }}>
                              <Typography variant="h4" color="error.main">
                                {stats.byAge.old.toLocaleString()}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                Old (30+ days)
                              </Typography>
                            </CardContent>
                          </Card>
                        </Grid>
                        
                        <Grid item xs={12}>
                          <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                            By Type
                          </Typography>
                          {Object.entries(stats.byType).map(([type, count]) => (
                            <Chip
                              key={type}
                              label={`${type}: ${count}`}
                              sx={{ mr: 1, mb: 1 }}
                              variant="outlined"
                            />
                          ))}
                        </Grid>
                        
                        <Grid item xs={12}>
                          <Typography variant="body2" color="text.secondary">
                            Last updated: {new Date(stats.lastUpdated).toLocaleString()}
                          </Typography>
                        </Grid>
                      </Grid>
                    ) : (
                      <Typography color="text.secondary">
                        Click refresh to load statistics
                      </Typography>
                    )}
                  </CardContent>
                </Card>
              </Stack>
            </Grid>

            <Grid item xs={12} md={4}>
              <Stack spacing={3}>
                {/* Retention Policy Card */}
                <Card sx={{ bgcolor: theme.palette.warning.main, color: 'white' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      📋 Retention Policy
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      Automatic cleanup runs daily at 2:00 AM with these rules:
                    </Typography>
                    {stats?.retentionPolicy && (
                      <Box>
                        <Typography variant="body2">
                          • Read notifications: {stats.retentionPolicy.readNotifications}
                        </Typography>
                        <Typography variant="body2">
                          • System announcements: {stats.retentionPolicy.systemAnnouncements}
                        </Typography>
                        <Typography variant="body2">
                          • All notifications: {stats.retentionPolicy.allNotifications}
                        </Typography>
                        <Typography variant="body2">
                          • Auto-mark reminders: {stats.retentionPolicy.autoMarkReminders}
                        </Typography>
                      </Box>
                    )}
                  </CardContent>
                </Card>

                {/* Info Card */}
                <Card sx={{ bgcolor: theme.palette.info.main, color: 'white' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom>
                      <InfoIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                      Cleanup Information
                    </Typography>
                    <Typography variant="body2" sx={{ mb: 2 }}>
                      The cleanup process helps maintain system performance by removing old notifications.
                    </Typography>
                    <Typography variant="body2">
                      <strong>What gets cleaned:</strong>
                      <br />• Read notifications older than 7 days
                      <br />• All notifications older than 90 days
                      <br />• Old reminders past their relevance
                      <br />• Read system announcements (30+ days)
                    </Typography>
                  </CardContent>
                </Card>
              </Stack>
            </Grid>
          </Grid>
        </TabPanel>
      </Paper>

      {/* Edit Recurring Reminder Dialog */}
      <Dialog 
        open={showEditDialog} 
        onClose={() => {
          setShowEditDialog(false);
          setEditingReminder(null);
        }}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EditIcon color="primary" />
            Edit Recurring Reminder
          </Box>
        </DialogTitle>
        <DialogContent>
          {editingReminder && (
            <Stack spacing={3} sx={{ mt: 1 }}>
              <TextField
                label="Title"
                fullWidth
                value={editingReminder.title}
                onChange={(e) => setEditingReminder(prev => prev ? { ...prev, title: e.target.value } : null)}
                required
              />

              <TextField
                label="Message"
                fullWidth
                multiline
                rows={4}
                value={editingReminder.message}
                onChange={(e) => setEditingReminder(prev => prev ? { ...prev, message: e.target.value } : null)}
                required
              />

              <FormControl fullWidth>
                <InputLabel>Recurring Frequency</InputLabel>
                <Select
                  value={editingReminder.recurringType}
                  onChange={(e) => setEditingReminder(prev => prev ? { 
                    ...prev, 
                    recurringType: e.target.value as 'daily' | 'weekly' | 'monthly'
                  } : null)}
                  label="Recurring Frequency"
                >
                  <MenuItem value="daily">Daily</MenuItem>
                  <MenuItem value="weekly">Weekly</MenuItem>
                  <MenuItem value="monthly">Monthly</MenuItem>
                </Select>
              </FormControl>

              <TextField
                label="Action URL (Optional)"
                fullWidth
                value={editingReminder.actionUrl || ''}
                onChange={(e) => setEditingReminder(prev => prev ? { ...prev, actionUrl: e.target.value } : null)}
                placeholder="e.g., /events or https://docs.toyota.com"
                helperText="Internal routes (e.g., /events) or external URLs (e.g., https://docs.toyota.com) - external links open in new tab"
              />

              <TextField
                label="End Date (Optional)"
                type="date"
                fullWidth
                value={editingReminder.endDate ? editingReminder.endDate.split('T')[0] : ''}
                onChange={(e) => setEditingReminder(prev => prev ? { 
                  ...prev, 
                  endDate: e.target.value || undefined 
                } : null)}
                InputLabelProps={{ shrink: true }}
                helperText="Leave empty for indefinite recurring"
              />

              <FormControlLabel
                control={
                  <Switch
                    checked={editingReminder.isActive}
                    onChange={(e) => setEditingReminder(prev => prev ? { 
                      ...prev, 
                      isActive: e.target.checked 
                    } : null)}
                  />
                }
                label={`Reminder is ${editingReminder.isActive ? 'Active' : 'Inactive'}`}
              />

              <Card variant="outlined" sx={{ bgcolor: 'grey.50' }}>
                <CardContent>
                  <Typography variant="h6" gutterBottom>
                    Current Recipients ({editingReminder.recipientCount})
                  </Typography>
                  {editingReminder.targetRoles && editingReminder.targetRoles.length > 0 ? (
                    <Box>
                      <Typography variant="body2" color="text.secondary" gutterBottom>
                        <strong>Target Roles:</strong>
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {editingReminder.targetRoles.map((role) => (
                          <Chip 
                            key={role} 
                            label={roles.find(r => r.value === role)?.label || role}
                            size="small"
                            color="primary"
                            variant="outlined"
                          />
                        ))}
                      </Box>
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">
                      <strong>Individual Users:</strong> {editingReminder.targetUserIds?.length || 0} selected users
                    </Typography>
                  )}
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                    Note: To change recipients, create a new recurring reminder
                  </Typography>
                </CardContent>
              </Card>
            </Stack>
          )}
        </DialogContent>
        <DialogActions>
          <Button 
            onClick={() => {
              setShowEditDialog(false);
              setEditingReminder(null);
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button 
            variant="contained"
            onClick={() => {
              if (editingReminder) {
                updateRecurringReminder(editingReminder.id, {
                  title: editingReminder.title,
                  message: editingReminder.message,
                  recurringType: editingReminder.recurringType,
                  actionUrl: editingReminder.actionUrl,
                  endDate: editingReminder.endDate,
                  isActive: editingReminder.isActive
                });
              }
            }}
            disabled={loading || !editingReminder?.title.trim() || !editingReminder?.message.trim()}
            startIcon={loading ? <CircularProgress size={16} /> : <EditIcon />}
          >
            {loading ? 'Updating...' : 'Update Reminder'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default NotificationManager; 