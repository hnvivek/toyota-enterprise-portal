import React, { useState, useEffect, useMemo } from 'react';
import { Calendar, momentLocalizer, Views, View, ToolbarProps } from 'react-big-calendar';
import moment from 'moment';
import {
  Box,
  Typography,
  Paper,
  Chip,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Card,
  CardContent,
  Alert,
  CircularProgress,
  Tooltip,
  IconButton,
  ButtonGroup,
  Stack,
  Badge,
} from '@mui/material';
import {
  Add as AddIcon,
  Event as EventIcon,
  Refresh as RefreshIcon,
  ViewWeek as WeekIcon,
  ViewDay as DayIcon,
  ViewModule as MonthIcon,
  FilterList as FilterIcon,
  Today as TodayIcon,
} from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { api } from '../../config/api';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import './EventCalendar.css';
import { useUser } from '../../contexts/UserContext';

// Configure moment localizer
const localizer = momentLocalizer(moment);

interface Event {
  id: number;
  title: string;
  description: string;
  location: string;
  startDate: string;
  endDate: string;
  status: string;
  budget: number;
  branch: {
    id: number;
    name: string;
    location: string;
  };
  eventType: {
    id: number;
    name: string;
    category: string;
  };
}

interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource: Event;
}

interface Branch {
  id: number;
  name: string;
  location: string;
}

const EventCalendar = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedBranch, setSelectedBranch] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [calendarView, setCalendarView] = useState<View>(Views.MONTH);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [currentUser, setCurrentUser] = useState<{ role: string } | null>(null);
  
  const navigate = useNavigate();

  // Fetch events and branches
  useEffect(() => {
    fetchData();
    fetchCurrentUser();
  }, []);

  useEffect(() => {
    fetchData();
  }, [selectedBranch, selectedStatus]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      
      // Build query parameters
      const params = new URLSearchParams();
      if (selectedBranch !== 'all') params.append('branchId', selectedBranch);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      
      const [eventsRes, branchesRes] = await Promise.all([
        api.get(`/events?${params.toString()}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        api.get('/branches', {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setEvents(eventsRes.data.events || []);
      setBranches(branchesRes.data);
    } catch (error: any) {
      console.error('Error fetching data:', error);
      setError(error.response?.data?.message || 'Error fetching events');
    } finally {
      setLoading(false);
    }
  };

  const fetchCurrentUser = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentUser({ role: response.data.role });
    } catch (err) {
      console.error('Error fetching current user:', err);
    }
  };

  const canCreateEvent = () => {
    if (!currentUser) return false;
    return ['sales_manager', 'general_manager', 'admin'].includes(currentUser.role);
  };

  // Convert events to calendar format
  const calendarEvents: CalendarEvent[] = useMemo(() => {
    return events.map(event => ({
      id: event.id,
      title: event.title,
      start: new Date(event.startDate),
      end: new Date(event.endDate),
      resource: event,
    }));
  }, [events]);

  // Get branch color with modern palette
  const getBranchColor = (branchName: string) => {
    const branchColors = {
      // Updated with actual branch names from the database
      'Digital': { bg: '#3b82f6', border: '#2563eb' }, // Blue
      'Hosur road': { bg: '#10b981', border: '#059669' }, // Green
      'Whitefield': { bg: '#f59e0b', border: '#d97706' }, // Amber
      'KP Road': { bg: '#ef4444', border: '#dc2626' }, // Red
      'Qns road': { bg: '#8b5cf6', border: '#7c3aed' }, // Purple
      'Banashankari': { bg: '#06b6d4', border: '#0891b2' }, // Cyan
      'Jayanagar': { bg: '#f97316', border: '#ea580c' }, // Orange
      'Koramangala': { bg: '#ec4899', border: '#db2777' }, // Pink
      'Indiranagar': { bg: '#84cc16', border: '#65a30d' }, // Lime
      'Malleshwaram': { bg: '#f43f5e', border: '#e11d48' }, // Rose
      'Rajajinagar': { bg: '#14b8a6', border: '#0d9488' }, // Teal
      'Bannerghatta Road': { bg: '#a855f7', border: '#9333ea' }, // Violet
    };

    // Normalize branch name for lookup (handle case variations)
    const normalizedName = branchName.trim();
    
    // Check if we have a predefined color for this branch
    if (branchColors[normalizedName as keyof typeof branchColors]) {
      return branchColors[normalizedName as keyof typeof branchColors];
    }

    // Enhanced color options with more distinct colors
    const colorOptions = [
      { bg: '#3b82f6', border: '#2563eb' }, // Blue
      { bg: '#10b981', border: '#059669' }, // Emerald
      { bg: '#f59e0b', border: '#d97706' }, // Amber
      { bg: '#ef4444', border: '#dc2626' }, // Red
      { bg: '#8b5cf6', border: '#7c3aed' }, // Violet
      { bg: '#06b6d4', border: '#0891b2' }, // Cyan
      { bg: '#f97316', border: '#ea580c' }, // Orange
      { bg: '#ec4899', border: '#db2777' }, // Pink
      { bg: '#84cc16', border: '#65a30d' }, // Lime
      { bg: '#f43f5e', border: '#e11d48' }, // Rose
      { bg: '#14b8a6', border: '#0d9488' }, // Teal
      { bg: '#a855f7', border: '#9333ea' }, // Purple
      { bg: '#0ea5e9', border: '#0284c7' }, // Sky
      { bg: '#22c55e', border: '#16a34a' }, // Green
      { bg: '#eab308', border: '#ca8a04' }, // Yellow
      { bg: '#dc2626', border: '#b91c1c' }, // Red-600
      { bg: '#7c3aed', border: '#6d28d9' }, // Violet-600
      { bg: '#0891b2', border: '#0e7490' }, // Cyan-600
    ];

    // Improved hash function for better distribution
    let hash = 0;
    for (let i = 0; i < normalizedName.length; i++) {
      const char = normalizedName.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    
    // Use absolute value and ensure good distribution
    const colorIndex = Math.abs(hash) % colorOptions.length;
    return colorOptions[colorIndex];
  };

  // Helper function to get status indicator for tooltips
  const getStatusIndicator = (status: string) => {
    const indicators = {
      completed: '✅',
      approved: '✔️',
      pending_gm: '⏳',
      pending_marketing: '⏳',
      rejected: '❌',
      draft: '📝',
    };
    return indicators[status.toLowerCase() as keyof typeof indicators] || '📝';
  };

  // Enhanced event component with branch-based colors
  const EventComponent = ({ event }: { event: CalendarEvent }) => {
    const eventData = event.resource;
    const branchColor = getBranchColor(eventData.branch.name);
    const statusIndicator = getStatusIndicator(eventData.status);
    
    return (
      <Tooltip
        title={
          <Box sx={{ p: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
              {eventData.title}
            </Typography>
            <Stack spacing={0.25}>
              <Typography variant="caption">📍 {eventData.location}</Typography>
              <Typography variant="caption">🏢 {eventData.branch.name}</Typography>
              <Typography variant="caption">{statusIndicator} {eventData.status.replace('_', ' ').toUpperCase()}</Typography>
              <Typography variant="caption">🏷️ {eventData.eventType.name}</Typography>
              <Typography variant="caption">💰 ₹{eventData.budget?.toLocaleString() || 'N/A'}</Typography>
            </Stack>
          </Box>
        }
        arrow
        placement="top"
        PopperProps={{
          modifiers: [{ name: 'offset', options: { offset: [0, -8] } }],
        }}
      >
        <Box
          sx={{
            background: `linear-gradient(135deg, ${branchColor.bg} 0%, ${branchColor.border} 100%)`,
            color: 'white',
            padding: '3px 8px',
            borderRadius: '6px',
            fontSize: '0.7rem',
            fontWeight: 600,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            cursor: 'pointer',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
            border: `1px solid ${branchColor.border}`,
            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
            position: 'relative',
            '&:hover': {
              transform: 'translateY(-1px) scale(1.02)',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            },
            // Add status indicator as a small badge
            '&::after': {
              content: `"${getStatusIndicator(eventData.status)}"`,
              position: 'absolute',
              top: '-2px',
              right: '-2px',
              fontSize: '0.6rem',
              backgroundColor: 'rgba(255,255,255,0.9)',
              borderRadius: '50%',
              width: '12px',
              height: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
            },
          }}
                        onClick={() => navigate(`/marketing/events/${eventData.id}`)}
        >
          {eventData.title}
        </Box>
      </Tooltip>
    );
  };

  // Compact modern toolbar
  const CustomToolbar = ({ label, onNavigate, onView }: ToolbarProps<CalendarEvent, object>) => (
    <Box sx={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      mb: 2,
      flexWrap: 'wrap',
      gap: 1.5
    }}>
      {/* Navigation Controls */}
      <ButtonGroup variant="outlined" size="small" sx={{ '& .MuiButton-root': { minWidth: 'auto', px: 1.5 } }}>
        <Button onClick={() => onNavigate('PREV')}>‹</Button>
        <Button 
          onClick={() => onNavigate('TODAY')} 
          startIcon={<TodayIcon />}
          sx={{ px: 2 }}
        >
          Today
        </Button>
        <Button onClick={() => onNavigate('NEXT')}>›</Button>
      </ButtonGroup>
      
      {/* Current Period */}
      <Typography 
        variant="h6" 
        sx={{ 
          fontWeight: 700, 
          color: 'text.primary',
          fontSize: { xs: '1rem', md: '1.25rem' },
          textAlign: 'center',
          minWidth: '200px'
        }}
      >
        {label}
      </Typography>
      
      {/* View Switcher */}
      <ButtonGroup variant="outlined" size="small">
        <Button 
          onClick={() => onView(Views.MONTH)} 
          variant={calendarView === Views.MONTH ? 'contained' : 'outlined'}
          sx={{ minWidth: 'auto', px: 1 }}
        >
          <MonthIcon />
        </Button>
        <Button 
          onClick={() => onView(Views.WEEK)} 
          variant={calendarView === Views.WEEK ? 'contained' : 'outlined'}
          sx={{ minWidth: 'auto', px: 1 }}
        >
          <WeekIcon />
        </Button>
        <Button 
          onClick={() => onView(Views.DAY)} 
          variant={calendarView === Views.DAY ? 'contained' : 'outlined'}
          sx={{ minWidth: 'auto', px: 1 }}
        >
          <DayIcon />
        </Button>
      </ButtonGroup>
    </Box>
  );

  const handleSelectEvent = (event: CalendarEvent) => {
            navigate(`/marketing/events/${event.resource.id}`);
  };

  const handleSelectSlot = ({ start }: { start: Date }) => {
    if (canCreateEvent()) {
      const startISO = moment(start).toISOString();
              navigate(`/marketing/events/new?startDate=${startISO}`);
    }
  };

  // Filter summary
  const filteredCount = events.length;
  const activeFilters = [selectedBranch !== 'all', selectedStatus !== 'all'].filter(Boolean).length;

  // Create branch legend from available branches
  const branchLegend = useMemo(() => {
    return branches.map(branch => ({
      name: branch.name,
      color: getBranchColor(branch.name)
    }));
  }, [branches]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  return (
    <Box sx={{ p: { xs: 2, md: 3 }, backgroundColor: 'background.default', minHeight: '100vh' }}>
      {/* Compact Header */}
      <Paper sx={{ 
        p: { xs: 2, md: 2.5 }, 
        mb: 3,
        background: 'linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)',
        border: '1px solid',
        borderColor: 'divider'
      }}>
        <Box sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: 2
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <EventIcon color="primary" sx={{ fontSize: 28 }} />
            <Box>
              <Typography variant="h5" fontWeight={700} color="text.primary">
                Event Calendar
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {filteredCount} event{filteredCount !== 1 ? 's' : ''} 
                {activeFilters > 0 && ` • ${activeFilters} filter${activeFilters !== 1 ? 's' : ''} active`}
              </Typography>
            </Box>
          </Box>
          
          <Stack direction="row" spacing={1}>
            {canCreateEvent() && (
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => navigate('/marketing/events/new')}
                sx={{ 
                  fontWeight: 600,
                  borderRadius: 2,
                  textTransform: 'none',
                  px: 3
                }}
              >
                New Event
              </Button>
            )}
            <IconButton 
              onClick={fetchData} 
              color="primary"
              sx={{ 
                backgroundColor: 'background.paper',
                '&:hover': { backgroundColor: 'action.hover' }
              }}
            >
              <RefreshIcon />
            </IconButton>
          </Stack>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {/* Compact Filters Row */}
      <Paper sx={{ p: 2, mb: 3, borderRadius: 2 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Branch</InputLabel>
              <Select
                value={selectedBranch}
                label="Branch"
                onChange={(e) => setSelectedBranch(e.target.value)}
              >
                <MenuItem value="all">All Branches</MenuItem>
                {branches.map((branch) => (
                  <MenuItem key={branch.id} value={branch.id.toString()}>
                    {branch.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12} sm={4} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Status</InputLabel>
              <Select
                value={selectedStatus}
                label="Status"
                onChange={(e) => setSelectedStatus(e.target.value)}
              >
                <MenuItem value="all">All Statuses</MenuItem>
                <MenuItem value="draft">Draft</MenuItem>
                <MenuItem value="pending_gm">Pending GM</MenuItem>
                <MenuItem value="pending_marketing">Pending Marketing</MenuItem>
                <MenuItem value="approved">Approved</MenuItem>
                <MenuItem value="completed">Completed</MenuItem>
                <MenuItem value="rejected">Rejected</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={4} md={6}>
            {/* Branch Color Legend */}
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, alignItems: 'center' }}>
              <Typography variant="caption" color="text.secondary" sx={{ mr: 1, fontWeight: 600 }}>
                Branches:
              </Typography>
              {branchLegend.slice(0, 6).map((branch) => (
                <Chip
                  key={branch.name}
                  label={branch.name}
                  size="small"
                  sx={{
                    backgroundColor: branch.color.bg,
                    color: 'white',
                    fontSize: '0.65rem',
                    height: 20,
                    '& .MuiChip-label': { px: 1 }
                  }}
                />
              ))}
              {branchLegend.length > 6 && (
                <Typography variant="caption" color="text.secondary">
                  +{branchLegend.length - 6} more
                </Typography>
              )}
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Modern Calendar Container */}
      <Paper 
        sx={{ 
          p: { xs: 1, md: 2 }, 
          backgroundColor: 'background.paper',
          borderRadius: 3,
          boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
          border: '1px solid',
          borderColor: 'divider'
        }}
      >
        <Calendar
          localizer={localizer}
          events={calendarEvents}
          startAccessor="start"
          endAccessor="end"
          style={{ height: 650 }}
          onSelectEvent={handleSelectEvent}
          onSelectSlot={handleSelectSlot}
          selectable={canCreateEvent()}
          popup
          view={calendarView}
          onView={setCalendarView}
          date={currentDate}
          onNavigate={setCurrentDate}
          components={{
            event: EventComponent,
            toolbar: CustomToolbar,
          }}
          eventPropGetter={(event: CalendarEvent) => {
            const branchColor = getBranchColor(event.resource.branch.name);
            return {
              style: {
                backgroundColor: branchColor.bg,
                borderColor: branchColor.border,
                color: 'white',
              },
            };
          }}
          dayPropGetter={(date: Date) => ({
            style: {
              backgroundColor: moment(date).isSame(moment(), 'day') ? '#f0f9ff' : undefined,
            },
          })}
        />
      </Paper>

      {/* Compact Help Footer */}
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Typography variant="caption" color="text.secondary">
          💡 Click events to view details{canCreateEvent() ? ' • Click empty spaces to create events' : ''} • Use view buttons to switch layouts
        </Typography>
      </Box>
    </Box>
  );
};

export default EventCalendar; 