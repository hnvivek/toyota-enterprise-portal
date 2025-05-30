import React, { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Typography,
  Chip,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import PrintIcon from '@mui/icons-material/Print';
import { api } from '../../config/api';
import { Event, EventStatus } from '../../types/event';

const statusColors: Record<EventStatus, 'default' | 'primary' | 'secondary' | 'error' | 'success'> = {
  draft: 'default',
  pending: 'primary',
  approved: 'success',
  rejected: 'error',
  completed: 'secondary',
};

export const EventList: React.FC = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      const response = await api.get('/events');
      setEvents(response.data);
    } catch (error) {
      console.error('Error fetching events:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (window.confirm('Are you sure you want to delete this event?')) {
      try {
        await api.delete(`/events/${id}`);
        setEvents(events.filter(event => event.id !== id));
      } catch (error) {
        console.error('Error deleting event:', error);
      }
    }
  };

  const handlePrint = async (id: number) => {
    try {
      const response = await api.get(`/events/${id}/report`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `event-report-${id}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Error generating report:', error);
    }
  };

  if (loading) {
    return <Typography>Loading...</Typography>;
  }

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h4">Events</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          href="/events/new"
        >
          Create Event
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Location</TableCell>
              <TableCell>Start Date</TableCell>
              <TableCell>End Date</TableCell>
              <TableCell>Budget</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {events.map((event) => (
              <TableRow key={event.id}>
                <TableCell>{event.title}</TableCell>
                <TableCell>{event.location}</TableCell>
                <TableCell>{new Date(event.startDate).toLocaleDateString()}</TableCell>
                <TableCell>{new Date(event.endDate).toLocaleDateString()}</TableCell>
                <TableCell>${event.budget.toFixed(2)}</TableCell>
                <TableCell>
                  <Chip
                    label={event.status}
                    color={statusColors[event.status]}
                    size="small"
                  />
                </TableCell>
                <TableCell>
                  <IconButton
                    color="primary"
                    href={`/events/${event.id}/edit`}
                    size="small"
                  >
                    <EditIcon />
                  </IconButton>
                  <IconButton
                    color="error"
                    onClick={() => handleDelete(event.id)}
                    size="small"
                  >
                    <DeleteIcon />
                  </IconButton>
                  <IconButton
                    color="primary"
                    onClick={() => handlePrint(event.id)}
                    size="small"
                  >
                    <PrintIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}; 