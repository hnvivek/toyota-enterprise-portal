import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
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
  Chip,
  Button,
  CircularProgress,
  Alert,
  Card,
  CardContent,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Visibility as ViewIcon,
  Notifications as NotificationsIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { eventService, Event } from '../../services/eventService';
import { formatINR } from '../../utils/format';

const PendingApprovals = () => {
  const navigate = useNavigate();
  const [pendingEvents, setPendingEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPendingApprovals();
  }, []);

  const fetchPendingApprovals = async () => {
    try {
      setLoading(true);
      setError(null);
      const events = await eventService.getPendingApprovals();
      setPendingEvents(events);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error fetching pending approvals');
      console.error('Error fetching pending approvals:', err);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending_gm':
        return 'warning';
      case 'pending_marketing':
        return 'info';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const getStatusLabel = (status: string) => {
    switch (status.toLowerCase()) {
      case 'pending_gm':
        return 'Pending GM Approval';
      case 'pending_marketing':
        return 'Pending Marketing Approval';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <NotificationsIcon sx={{ mr: 2, color: 'warning.main', fontSize: 28 }} />
          <Typography variant="h6" fontWeight="bold" color="text.primary">
            Pending Approvals
          </Typography>
          {pendingEvents.length > 0 && (
            <Chip
              label={pendingEvents.length}
              color="warning"
              size="small"
              sx={{ ml: 2, fontWeight: 600 }}
            />
          )}
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {pendingEvents.length === 0 ? (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <ScheduleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary" gutterBottom>
              No Pending Approvals
            </Typography>
            <Typography variant="body2" color="text.secondary">
              All events are up to date! No actions required at this time.
            </Typography>
          </Box>
        ) : (
          <TableContainer component={Paper} sx={{ border: '1px solid', borderColor: 'divider' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ backgroundColor: 'warning.50' }}>
                  <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>Event</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>Branch</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>Start Date</TableCell>
                  <TableCell sx={{ fontWeight: 700, color: 'text.primary' }}>Status</TableCell>
                  <TableCell align="right" sx={{ fontWeight: 700, color: 'text.primary' }}>Budget</TableCell>
                  <TableCell align="center" sx={{ fontWeight: 700, color: 'text.primary' }}>Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pendingEvents.map((event) => (
                  <TableRow 
                    key={event.id} 
                    sx={{ 
                      '&:hover': { backgroundColor: 'action.hover' },
                      cursor: 'pointer'
                    }}
                    onClick={() => navigate(`/marketing/events/${event.id}`)}
                  >
                    <TableCell>
                      <Box>
                        <Typography variant="subtitle2" fontWeight="600" color="text.primary">
                          {event.title}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" noWrap>
                          {event.description.length > 40 
                            ? `${event.description.substring(0, 40)}...`
                            : event.description
                          }
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="medium">
                        {event.branch.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">
                        {formatDate(event.startDate)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={getStatusLabel(event.status)}
                        color={getStatusColor(event.status)}
                        size="small"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Typography variant="body2" fontWeight="medium">
                        {formatINR(event.budget)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <Tooltip title="View & Approve">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={(e) => {
                            e.stopPropagation();
                            navigate(`/marketing/events/${event.id}`);
                          }}
                        >
                          <ViewIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        {pendingEvents.length > 0 && (
          <Box sx={{ mt: 2, textAlign: 'center' }}>
            <Button
              variant="outlined"
              onClick={() => navigate('/marketing/events')}
              size="small"
            >
              View All Events
            </Button>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default PendingApprovals; 