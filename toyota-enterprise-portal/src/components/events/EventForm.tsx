import React, { useEffect, useState, ChangeEvent } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Paper,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Chip,
  SelectChangeEvent,
  TextFieldProps,
} from '@mui/material';
import Grid from '@mui/material/Unstable_Grid2';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import { useNavigate, useParams } from 'react-router-dom';
import { api } from '../../config/api';
import { Event, EventStatus } from '../../types/event';

interface Branch {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
}

interface FormData {
  title: string;
  description: string;
  location: string;
  startDate: Dayjs;
  endDate: Dayjs;
  budget: number;
  status: EventStatus;
  branchId: string;
  productIds: number[];
}

const INITIAL_EVENT: FormData = {
  title: '',
  description: '',
  location: '',
  startDate: dayjs(),
  endDate: dayjs(),
  budget: 0,
  status: 'draft',
  branchId: '',
  productIds: [],
};

const handleTextFieldChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, setFormData: React.Dispatch<React.SetStateAction<FormData>>) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));
};

const handleSelectChange = (e: SelectChangeEvent<string>, setFormData: React.Dispatch<React.SetStateAction<FormData>>) => {
  const { name, value } = e.target;
  setFormData(prev => ({ ...prev, [name]: value }));
};

export const EventForm: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormData>(INITIAL_EVENT);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchBranches();
    fetchProducts();
    if (id) {
      fetchEvent(parseInt(id));
    }
  }, [id]);

  const fetchBranches = async () => {
    try {
      const response = await api.get('/branches');
      setBranches(response.data);
    } catch (error) {
      console.error('Error fetching branches:', error);
    }
  };

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const fetchEvent = async (eventId: number) => {
    try {
      const response = await api.get(`/events/${eventId}`);
      const event = response.data;
      setFormData({
        ...formData,
        ...event,
        startDate: dayjs(event.startDate),
        endDate: dayjs(event.endDate),
        branchId: event.branch.id,
        productIds: event.products.map((p: Product) => p.id),
      });
      setSelectedProducts(event.products);
    } catch (error) {
      console.error('Error fetching event:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        startDate: formData.startDate.toISOString(),
        endDate: formData.endDate.toISOString(),
      };

      if (id) {
        await api.put(`/events/${id}`, submitData);
      } else {
        await api.post('/events', submitData);
      }
              navigate('/marketing/events');
    } catch (error) {
      console.error('Error saving event:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | SelectChangeEvent<string>) => {
    if ('type' in e.target) {
      handleTextFieldChange(e as ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, setFormData);
    } else {
      handleSelectChange(e as SelectChangeEvent<string>, setFormData);
    }
  };

  const handleDateChange = (field: 'startDate' | 'endDate') => (value: Dayjs | null) => {
    if (value) {
      setFormData(prev => ({ ...prev, [field]: value }));
    }
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>
        {id ? 'Edit Event' : 'Create Event'}
      </Typography>

      <Paper sx={{ p: 3 }}>
        <form onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid xs={12}>
              <TextField
                fullWidth
                label="Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid xs={12}>
              <TextField
                fullWidth
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                multiline
                rows={4}
                required
              />
            </Grid>

            <Grid xs={12}>
              <TextField
                fullWidth
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateTimePicker
                  label="Start Date"
                  value={formData.startDate}
                  onChange={handleDateChange('startDate')}
                  sx={{ width: '100%' }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid xs={12} md={6}>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateTimePicker
                  label="End Date"
                  value={formData.endDate}
                  onChange={handleDateChange('endDate')}
                  sx={{ width: '100%' }}
                />
              </LocalizationProvider>
            </Grid>

            <Grid xs={12} md={6}>
              <TextField
                fullWidth
                label="Budget"
                name="budget"
                type="number"
                value={formData.budget}
                onChange={handleChange}
                required
              />
            </Grid>

            <Grid xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  name="status"
                  value={formData.status}
                  onChange={handleChange}
                  label="Status"
                >
                  <MenuItem value="draft">Draft</MenuItem>
                  <MenuItem value="pending">Pending</MenuItem>
                  <MenuItem value="approved">Approved</MenuItem>
                  <MenuItem value="rejected">Rejected</MenuItem>
                  <MenuItem value="completed">Completed</MenuItem>
                </Select>
              </FormControl>
            </Grid>

            <Grid xs={12} md={6}>
              <FormControl fullWidth>
                <InputLabel>Branch</InputLabel>
                <Select
                  name="branchId"
                  value={formData.branchId}
                  onChange={handleChange}
                  label="Branch"
                  required
                >
                  {branches.map(branch => (
                    <MenuItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid xs={12}>
              <Autocomplete
                multiple
                options={products}
                getOptionLabel={(option) => option.name}
                value={selectedProducts}
                onChange={(_, newValue) => {
                  setSelectedProducts(newValue);
                  setFormData(prev => ({
                    ...prev,
                    productIds: newValue.map(p => p.id)
                  }));
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Products"
                    placeholder="Select products"
                  />
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option.name}
                      {...getTagProps({ index })}
                      key={option.id}
                    />
                  ))
                }
              />
            </Grid>

            <Grid xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate('/marketing/events')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                >
                  {loading ? 'Saving...' : (id ? 'Update' : 'Create')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </form>
      </Paper>
    </Box>
  );
}; 