import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Divider,
  Card,
  CardContent,
  Chip,
  Stack,
  FormControlLabel,
  Switch,
  Autocomplete,
} from '@mui/material';
import { ArrowBack as ArrowBackIcon, Event as EventIcon, Schedule as ScheduleIcon, AttachFile as AttachFileIcon, Delete as DeleteIcon, Download as DownloadIcon } from '@mui/icons-material';
import { LocalizationProvider, DateTimePicker, StaticDatePicker, TimePicker } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import { api } from '../../config/api';

interface Branch {
  id: number;
  name: string;
}

interface Product {
  id: number;
  name: string;
}

interface EventType {
  id: number;
  name: string;
  category: string;
}

interface Attachment {
  id: number;
  filename: string;
  fileUrl: string;
  fileType: string;
  createdAt: string;
}

const EventForm = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const [error, setError] = useState('');
  const [branches, setBranches] = useState<Branch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<Product[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);

  // Check if we're in metrics-only edit mode
  const isMetricsMode = searchParams.get('mode') === 'metrics';

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    startDate: dayjs(),
    endDate: dayjs().add(1, 'hour'),
    budget: '',
    branchId: '',
    productIds: [] as number[],
    eventTypeId: '',
    isPlanned: true,
    // Planned Metrics
    plannedBudget: '',
    plannedLeads: '',
    plannedEnquiries: '',
    plannedOrders: '',
    // Actual Metrics (these are the only editable fields in metrics mode)
    actualBudget: '',
    actualLeads: '',
    actualEnquiries: '',
    actualOrders: '',
    notes: '',
  });

  const [attachments, setAttachments] = useState<File[]>([]);
  const [existingAttachments, setExistingAttachments] = useState<Attachment[]>([]);
  const [attachmentsToDelete, setAttachmentsToDelete] = useState<number[]>([]);

  const [dateErrors, setDateErrors] = useState({
    startDate: '',
    endDate: '',
  });

  // Validation state
  const [formSubmitted, setFormSubmitted] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        // Fetch branches, products, event types, and current user info
        const [branchesRes, productsRes, eventTypesRes, userRes] = await Promise.all([
          api.get('branches', { headers }),
          api.get('products', { headers }),
          api.get('event-types', { headers }),
          api.get('auth/me', { headers }),
        ]);

        console.log('Fetched branches:', branchesRes.data);
        console.log('Fetched products:', productsRes.data);
        console.log('Fetched event types:', eventTypesRes.data);
        console.log('Current user:', userRes.data);

        setBranches(branchesRes.data);
        setProducts(productsRes.data);
        setEventTypes(eventTypesRes.data);

        // If editing, fetch event data
        if (id) {
          const eventRes = await api.get(`events/${id}`, { headers });
          const event = eventRes.data;
          console.log('Fetched event for editing:', event);
          console.log('Event products:', event.products);
          console.log('Event eventType:', event.eventType);
          console.log('Event attachments:', event.attachments);
          
          const productIds = event.products?.map((p: Product) => p.id) || [];
          console.log('Mapped productIds:', productIds);
          
          const newFormData = {
            title: event.title,
            description: event.description,
            location: event.location,
            startDate: dayjs(event.startDate),
            endDate: dayjs(event.endDate),
            budget: event.budget.toString(),
            branchId: event.branch?.id || '',
            productIds: productIds,
            eventTypeId: event.eventType?.id || '',
            isPlanned: event.isPlanned,
            plannedBudget: event.plannedBudget?.toString() || '',
            plannedLeads: event.plannedLeads?.toString() || '',
            plannedEnquiries: event.plannedEnquiries?.toString() || '',
            plannedOrders: event.plannedOrders?.toString() || '',
            actualBudget: event.actualBudget?.toString() || '',
            actualLeads: event.actualLeads?.toString() || '',
            actualEnquiries: event.actualEnquiries?.toString() || '',
            actualOrders: event.actualOrders?.toString() || '',
            notes: event.notes || '',
          };
          
          console.log('Setting formData:', newFormData);
          console.log('FormData productIds:', newFormData.productIds);
          setFormData(newFormData);
          setSelectedProducts(event.products || []);
          
          // Reset validation states for editing mode
          setFormSubmitted(false);
          
          // Set existing attachments
          if (event.attachments && event.attachments.length > 0) {
            setExistingAttachments(event.attachments);
            console.log('Loaded existing attachments:', event.attachments);
          }
          
          // Reset deletion tracking
          setAttachmentsToDelete([]);
        } else {
          // For new events, auto-fill the user's branch
          const currentUser = userRes.data;
          if (currentUser.branch && currentUser.branch.id) {
            console.log('Auto-filling branch for new event:', currentUser.branch);
            setFormData(prev => ({
              ...prev,
              branchId: currentUser.branch.id.toString()
            }));
          }
        }
      } catch (err: any) {
        setError(err.response?.data?.message || 'Error loading data');
      }
    };

    fetchData();
  }, [id]);

  // Debug logging for products state
  useEffect(() => {
    console.log('Products state updated:', products);
    console.log('Products length:', products.length);
  }, [products]);

  // Debug logging for formData.productIds state
  useEffect(() => {
    console.log('FormData.productIds updated:', formData.productIds);
    console.log('Selected products:', selectedProducts);
  }, [formData.productIds, selectedProducts]);

  // Validation function for dates
  const validateDates = (startDate: dayjs.Dayjs, endDate: dayjs.Dayjs) => {
    const errors = { startDate: '', endDate: '' };
    
    if (startDate && endDate) {
      if (startDate.isAfter(endDate)) {
        errors.startDate = 'Start date cannot be after end date';
        errors.endDate = 'End date cannot be before start date';
      } else if (startDate.isSame(endDate)) {
        errors.endDate = 'End date should be after start date';
      }
    }
    
    if (startDate && startDate.isBefore(dayjs().subtract(1, 'day'))) {
      errors.startDate = 'Start date cannot be in the past';
    }
    
    setDateErrors(errors);
    return Object.values(errors).every(error => error === '');
  };

  const handleStartDateChange = (newValue: dayjs.Dayjs | null) => {
    const newStartDate = newValue || dayjs();
    setFormData({ ...formData, startDate: newStartDate });
    validateDates(newStartDate, formData.endDate);
  };

  const handleEndDateChange = (newValue: dayjs.Dayjs | null) => {
    const newEndDate = newValue || dayjs().add(1, 'hour');
    setFormData({ ...formData, endDate: newEndDate });
    validateDates(formData.startDate, newEndDate);
  };

  const handleFileAttachment = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      const newFiles = Array.from(files);
      setAttachments([...attachments, ...newFiles]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  const removeExistingAttachment = (index: number) => {
    const attachmentToDelete = existingAttachments[index];
    setAttachmentsToDelete([...attachmentsToDelete, attachmentToDelete.id]);
    setExistingAttachments(existingAttachments.filter((_, i) => i !== index));
  };

  const downloadAttachment = (attachment: Attachment) => {
    const url = `${(api.defaults.baseURL || 'http://localhost:8080/api').replace('/api', '')}${attachment.fileUrl}`;
    window.open(url, '_blank');
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFormSubmitted(true);

    try {
      const token = localStorage.getItem('token');
      
      // In metrics mode, only send actual metrics data
      if (isMetricsMode) {
        const metricsData = {
          actualBudget: formData.actualBudget ? parseFloat(formData.actualBudget) : null,
          actualLeads: formData.actualLeads ? parseInt(formData.actualLeads) : null,
          actualEnquiries: formData.actualEnquiries ? parseInt(formData.actualEnquiries) : null,
          actualOrders: formData.actualOrders ? parseInt(formData.actualOrders) : null,
          notes: formData.notes || null,
        };

        await api.put(`events/${id}`, metricsData, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        navigate(`/events/${id}`);
        return;
      }

      // Validate products are selected
      if (!isMetricsMode && selectedProducts.length === 0) {
        setError('Please select at least one product for the event');
        return;
      }
      
      // Rest of the existing handleSubmit logic for full event editing
      // First, delete any attachments marked for deletion
      if (attachmentsToDelete.length > 0 && id) {
        console.log('Deleting attachments:', attachmentsToDelete);
        await api.delete(`events/${id}/attachments`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          data: { attachmentIds: attachmentsToDelete }
        });
      }
      
      // Check if we have attachments
      const hasAttachments = attachments.length > 0;
      
      let response;
      
      if (hasAttachments) {
        // Use FormData for file uploads
        const formDataToSend = new FormData();
        
        // Add form fields
        formDataToSend.append('title', formData.title);
        formDataToSend.append('description', formData.description);
        formDataToSend.append('location', formData.location);
        formDataToSend.append('startDate', formData.startDate.toISOString());
        formDataToSend.append('endDate', formData.endDate.toISOString());
        formDataToSend.append('budget', formData.budget);
        formDataToSend.append('branchId', formData.branchId);
        formDataToSend.append('eventTypeId', formData.eventTypeId);
        formDataToSend.append('isPlanned', formData.isPlanned.toString());
        
        // Add product IDs
        if (formData.productIds && formData.productIds.length > 0) {
          formData.productIds.forEach(productId => {
            formDataToSend.append('productIds', productId.toString());
          });
        }
        
        // Add optional metrics
        if (formData.plannedBudget) formDataToSend.append('plannedBudget', formData.plannedBudget);
        if (formData.plannedLeads) formDataToSend.append('plannedLeads', formData.plannedLeads);
        if (formData.plannedEnquiries) formDataToSend.append('plannedEnquiries', formData.plannedEnquiries);
        if (formData.plannedOrders) formDataToSend.append('plannedOrders', formData.plannedOrders);
        if (formData.actualBudget) formDataToSend.append('actualBudget', formData.actualBudget);
        if (formData.actualLeads) formDataToSend.append('actualLeads', formData.actualLeads);
        if (formData.actualEnquiries) formDataToSend.append('actualEnquiries', formData.actualEnquiries);
        if (formData.actualOrders) formDataToSend.append('actualOrders', formData.actualOrders);
        if (formData.notes) formDataToSend.append('notes', formData.notes);
        
        // Add attachments
        attachments.forEach((file, index) => {
          formDataToSend.append(`attachments`, file);
        });

        const headers = { 
          Authorization: `Bearer ${token}`,
          // Don't set Content-Type - let browser set it with boundary for multipart/form-data
        };

        if (id) {
          response = await api.put(`events/${id}`, formDataToSend, { headers });
        } else {
          response = await api.post('events', formDataToSend, { headers });
        }
      } else {
        // Use regular JSON for requests without attachments
        const headers = { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        };
        
        const data = {
          ...formData,
          productIds: formData.productIds,
          startDate: formData.startDate.toISOString(),
          endDate: formData.endDate.toISOString(),
          budget: parseFloat(formData.budget),
          branchId: parseInt(formData.branchId),
          eventTypeId: parseInt(formData.eventTypeId),
          plannedBudget: formData.plannedBudget ? parseFloat(formData.plannedBudget) : null,
          plannedLeads: formData.plannedLeads ? parseInt(formData.plannedLeads) : null,
          plannedEnquiries: formData.plannedEnquiries ? parseInt(formData.plannedEnquiries) : null,
          plannedOrders: formData.plannedOrders ? parseInt(formData.plannedOrders) : null,
          actualBudget: formData.actualBudget ? parseFloat(formData.actualBudget) : null,
          actualLeads: formData.actualLeads ? parseInt(formData.actualLeads) : null,
          actualEnquiries: formData.actualEnquiries ? parseInt(formData.actualEnquiries) : null,
          actualOrders: formData.actualOrders ? parseInt(formData.actualOrders) : null,
          notes: formData.notes || null,
        };

        if (id) {
          response = await api.put(`events/${id}`, data, { headers });
        } else {
          response = await api.post('events', data, { headers });
        }
      }

      // Redirect to the event's view page
      const eventId = id || response.data.id;
      navigate(`/events/${eventId}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error saving event');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // Custom Date-Time Range Picker Component
  const DateTimeRangePicker = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [tempStartDate, setTempStartDate] = useState(formData.startDate);
    const [tempEndDate, setTempEndDate] = useState(formData.endDate);

    const handleApply = () => {
      validateDates(tempStartDate, tempEndDate);
      setFormData({
        ...formData,
        startDate: tempStartDate,
        endDate: tempEndDate,
      });
      setIsOpen(false);
    };

    const handleCancel = () => {
      setTempStartDate(formData.startDate);
      setTempEndDate(formData.endDate);
      setIsOpen(false);
    };

    return (
      <Box>
        <TextField
          fullWidth
          size="small"
          label="Event Date & Time"
          value={`${formData.startDate.format('DD/MM/YYYY HH:mm')} - ${formData.endDate.format('DD/MM/YYYY HH:mm')}`}
          onClick={() => setIsOpen(true)}
          InputProps={{
            readOnly: true,
            startAdornment: <EventIcon sx={{ mr: 1, color: 'action.active' }} />,
          }}
          error={!!(dateErrors.startDate || dateErrors.endDate)}
          helperText={dateErrors.startDate || dateErrors.endDate || 'Click to select date and time range'}
          sx={{ cursor: 'pointer' }}
        />

        {isOpen && (
          <Card
            sx={{
              position: 'absolute',
              zIndex: 1300,
              mt: 1,
              minWidth: 400,
              boxShadow: 3,
            }}
          >
            <CardContent>
              {/* Header with Start/End Display */}
              <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
                <Box
                  sx={{
                    flex: 1,
                    p: 2,
                    border: '2px solid',
                    borderColor: 'primary.main',
                    borderRadius: 2,
                    bgcolor: 'primary.50',
                  }}
                >
                  <Typography variant="subtitle2" color="primary">
                    Start
                  </Typography>
                  <Typography variant="h6">
                    {tempStartDate.format('DD/MM/YYYY')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {tempStartDate.format('HH:mm')}
                  </Typography>
                </Box>
                <Box
                  sx={{
                    flex: 1,
                    p: 2,
                    border: '1px solid',
                    borderColor: 'grey.300',
                    borderRadius: 2,
                    bgcolor: 'grey.50',
                  }}
                >
                  <Typography variant="subtitle2">End</Typography>
                  <Typography variant="h6">
                    {tempEndDate.format('DD/MM/YYYY')}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {tempEndDate.format('HH:mm')}
                  </Typography>
                </Box>
              </Stack>

              {/* Date Selection */}
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <StaticDatePicker
                  value={tempStartDate}
                  onChange={(newValue) => {
                    const newStartDate = newValue || dayjs();
                    setTempStartDate(newStartDate);
                    if (tempEndDate.isBefore(newStartDate)) {
                      setTempEndDate(newStartDate.add(2, 'hours'));
                    }
                  }}
                  slotProps={{
                    actionBar: { actions: [] },
                  }}
                />
              </LocalizationProvider>

              {/* Time Selection */}
              <Stack direction="row" spacing={2} sx={{ mt: 2, mb: 2 }}>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <TimePicker
                    label="Start Time"
                    value={tempStartDate}
                    onChange={(newValue) => setTempStartDate(newValue || dayjs())}
                    format="HH:mm"
                    ampm={false}
                    slotProps={{
                      textField: { size: 'small', fullWidth: true },
                    }}
                  />
                </LocalizationProvider>
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <TimePicker
                    label="End Time"
                    value={tempEndDate}
                    onChange={(newValue) => setTempEndDate(newValue || tempStartDate.add(2, 'hours'))}
                    format="HH:mm"
                    ampm={false}
                    slotProps={{
                      textField: { size: 'small', fullWidth: true },
                    }}
                  />
                </LocalizationProvider>
              </Stack>

              {/* Quick Duration Presets */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  Quick Duration:
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip
                    label="4 Hours"
                    size="small"
                    onClick={() => setTempEndDate(tempStartDate.add(4, 'hours'))}
                    variant="outlined"
                  />
                  <Chip
                    label="8 Hours"
                    size="small"
                    onClick={() => setTempEndDate(tempStartDate.add(8, 'hours'))}
                    variant="outlined"
                  />
                  <Chip
                    label="2 Days"
                    size="small"
                    onClick={() => setTempEndDate(tempStartDate.add(2, 'days'))}
                    variant="outlined"
                  />
                  <Chip
                    label="1 Week"
                    size="small"
                    onClick={() => setTempEndDate(tempStartDate.add(1, 'week'))}
                    variant="outlined"
                  />
                </Stack>
              </Box>

              {/* Action Buttons */}
              <Stack direction="row" spacing={2} justifyContent="flex-end">
                <Button onClick={handleCancel} variant="outlined" size="small">
                  Cancel
                </Button>
                <Button onClick={handleApply} variant="contained" size="small">
                  Apply
                </Button>
              </Stack>
            </CardContent>
          </Card>
        )}
      </Box>
    );
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
        <IconButton onClick={() => navigate(id ? `/events/${id}` : '/events')} sx={{ mr: 2 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box>
          <Typography variant="h4">
            {isMetricsMode ? 'Edit Event Metrics' : (id ? 'Edit Event' : 'Create New Event')}
          </Typography>
          {isMetricsMode && (
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
              Only actual metrics can be edited. All other event details are read-only.
            </Typography>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {isMetricsMode && (
        <Alert severity="info" sx={{ mb: 2 }}>
          <Typography variant="subtitle2" gutterBottom>Metrics Edit Mode</Typography>
          You can only edit the actual results (cost, enquiries, orders) for this completed event. 
          All other fields are read-only to maintain event integrity.
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Box component="form" onSubmit={handleSubmit}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <TextField
                required={!isMetricsMode}
                fullWidth
                size="small"
                label="Event Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                InputProps={{ readOnly: isMetricsMode }}
                disabled={isMetricsMode}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required={!isMetricsMode}
                fullWidth
                size="small"
                multiline
                rows={3}
                label="Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                InputProps={{ readOnly: isMetricsMode }}
                disabled={isMetricsMode}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required={!isMetricsMode} size="small">
                <InputLabel>Branch</InputLabel>
                <Select
                  name="branchId"
                  value={formData.branchId}
                  onChange={(e) => setFormData({ ...formData, branchId: e.target.value })}
                  label="Branch"
                  disabled={isMetricsMode}
                >
                  {branches.map((branch) => (
                    <MenuItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </MenuItem>
                  ))}
                </Select>
                {!id && !isMetricsMode && (
                  <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, ml: 1.5 }}>
                    Pre-filled with your branch. You can change it if needed.
                  </Typography>
                )}
              </FormControl>
            </Grid>

            <Grid item xs={12} md={6}>
              <FormControl fullWidth required={!isMetricsMode} size="small">
                <InputLabel>Event Type</InputLabel>
                <Select
                  name="eventTypeId"
                  value={formData.eventTypeId}
                  onChange={(e) => setFormData({ ...formData, eventTypeId: e.target.value })}
                  label="Event Type"
                  disabled={isMetricsMode}
                >
                  {eventTypes.map((type) => (
                    <MenuItem key={type.id} value={type.id}>
                      {type.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            <Grid item xs={12}>
              <DateTimeRangePicker />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required={!isMetricsMode}
                fullWidth
                size="small"
                label="Location"
                name="location"
                value={formData.location}
                onChange={handleChange}
                InputProps={{ readOnly: isMetricsMode }}
                disabled={isMetricsMode}
              />
            </Grid>

            <Grid item xs={12}>
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
                renderInput={(params) => {
                  const hasNoProducts = selectedProducts.length === 0;
                  const shouldShowError = !isMetricsMode && hasNoProducts && formSubmitted;
                  return (
                    <TextField
                      {...params}
                      label="Products"
                      placeholder="Select products"
                      size="small"
                      error={shouldShowError}
                      helperText={
                        shouldShowError
                          ? "Please select at least one product" 
                          : "Select the products this event will promote"
                      }
                    />
                  );
                }}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip
                      label={option.name}
                      {...getTagProps({ index })}
                      key={option.id}
                      size="small"
                    />
                  ))
                }
                disabled={isMetricsMode}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                required={!isMetricsMode}
                fullWidth
                size="small"
                label="Event Cost"
                name="budget"
                type="number"
                value={formData.budget}
                onChange={handleChange}
                InputProps={{ readOnly: isMetricsMode }}
                disabled={isMetricsMode}
              />
            </Grid>

            {/* Attachments Section */}
            {!isMetricsMode && (
              <Grid item xs={12}>
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Attachments
                  </Typography>
                  
                  {/* Existing Attachments */}
                  {existingAttachments.length > 0 && (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Current Attachments:
                      </Typography>
                      {existingAttachments.map((attachment, index) => (
                        <Chip
                          key={attachment.id}
                          label={attachment.filename}
                          onDelete={() => removeExistingAttachment(index)}
                          deleteIcon={<DeleteIcon />}
                          onClick={() => downloadAttachment(attachment)}
                          variant="filled"
                          color="primary"
                          size="small"
                          sx={{ mr: 1, mb: 1, cursor: 'pointer' }}
                        />
                      ))}
                    </Box>
                  )}
                  
                  <Button
                    variant="outlined"
                    component="label"
                    startIcon={<AttachFileIcon />}
                    sx={{ mb: 1 }}
                  >
                    Add Files
                    <input
                      type="file"
                      hidden
                      multiple
                      accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.xlsx,.xls"
                      onChange={handleFileAttachment}
                    />
                  </Button>

                  {attachments.length > 0 && (
                    <Box sx={{ mt: 1 }}>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        New Attachments:
                      </Typography>
                      {attachments.map((file, index) => (
                        <Chip
                          key={index}
                          label={`${file.name} (${formatFileSize(file.size)})`}
                          onDelete={() => removeAttachment(index)}
                          deleteIcon={<DeleteIcon />}
                          variant="outlined"
                          size="small"
                          sx={{ mr: 1, mb: 1 }}
                        />
                      ))}
                    </Box>
                  )}
                  
                  <Typography variant="caption" color="text.secondary" display="block">
                    Supported formats: PDF, DOC, DOCX, JPG, PNG, XLSX, XLS (Max 10MB per file)
                  </Typography>
                </Box>
              </Grid>
            )}

            {/* Planned Metrics Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom>
                Expected Outcomes
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {isMetricsMode ? 'Original targets set for this event (read-only)' : 'Set targets and expectations for this event'}
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Expected Budget"
                name="plannedBudget"
                type="number"
                value={formData.plannedBudget}
                onChange={handleChange}
                helperText="Target budget amount"
                InputProps={{ readOnly: isMetricsMode }}
                disabled={isMetricsMode}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Expected Leads"
                name="plannedLeads"
                type="number"
                value={formData.plannedLeads}
                onChange={handleChange}
                helperText="Target number of leads"
                InputProps={{ readOnly: isMetricsMode }}
                disabled={isMetricsMode}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Expected Enquiries"
                name="plannedEnquiries"
                type="number"
                value={formData.plannedEnquiries}
                onChange={handleChange}
                helperText="Target number of enquiries"
                InputProps={{ readOnly: isMetricsMode }}
                disabled={isMetricsMode}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Expected Orders"
                name="plannedOrders"
                type="number"
                value={formData.plannedOrders}
                onChange={handleChange}
                helperText="Target number of orders"
                InputProps={{ readOnly: isMetricsMode }}
                disabled={isMetricsMode}
              />
            </Grid>

            {/* Actual Metrics Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ color: isMetricsMode ? 'primary.main' : 'text.primary' }}>
                Actual Results {isMetricsMode && '(Editable)'}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                {isMetricsMode ? 
                  'Update the actual performance after the event completion' : 
                  'These fields will be enabled after the event for recording actual performance'
                }
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Actual Cost"
                name="actualBudget"
                type="number"
                value={formData.actualBudget}
                onChange={handleChange}
                helperText="Actual amount spent"
                disabled={!isMetricsMode}
                sx={{ 
                  backgroundColor: isMetricsMode ? 'action.hover' : 'grey.100',
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: isMetricsMode ? 'background.paper' : 'grey.50',
                    '&.Mui-disabled': {
                      backgroundColor: 'grey.100',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'grey.300',
                      }
                    }
                  },
                  '& .MuiInputLabel-root.Mui-disabled': {
                    color: 'grey.500',
                  },
                  '& .MuiFormHelperText-root.Mui-disabled': {
                    color: 'grey.500',
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Actual Leads"
                name="actualLeads"
                type="number"
                value={formData.actualLeads}
                onChange={handleChange}
                helperText="Actual leads generated"
                disabled={!isMetricsMode}
                sx={{ 
                  backgroundColor: isMetricsMode ? 'action.hover' : 'grey.100',
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: isMetricsMode ? 'background.paper' : 'grey.50',
                    '&.Mui-disabled': {
                      backgroundColor: 'grey.100',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'grey.300',
                      }
                    }
                  },
                  '& .MuiInputLabel-root.Mui-disabled': {
                    color: 'grey.500',
                  },
                  '& .MuiFormHelperText-root.Mui-disabled': {
                    color: 'grey.500',
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Actual Enquiries"
                name="actualEnquiries"
                type="number"
                value={formData.actualEnquiries}
                onChange={handleChange}
                helperText="Actual enquiries received"
                disabled={!isMetricsMode}
                sx={{ 
                  backgroundColor: isMetricsMode ? 'action.hover' : 'grey.100',
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: isMetricsMode ? 'background.paper' : 'grey.50',
                    '&.Mui-disabled': {
                      backgroundColor: 'grey.100',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'grey.300',
                      }
                    }
                  },
                  '& .MuiInputLabel-root.Mui-disabled': {
                    color: 'grey.500',
                  },
                  '& .MuiFormHelperText-root.Mui-disabled': {
                    color: 'grey.500',
                  }
                }}
              />
            </Grid>

            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                size="small"
                label="Actual Orders"
                name="actualOrders"
                type="number"
                value={formData.actualOrders}
                onChange={handleChange}
                helperText="Actual orders received"
                disabled={!isMetricsMode}
                sx={{ 
                  backgroundColor: isMetricsMode ? 'action.hover' : 'grey.100',
                  '& .MuiOutlinedInput-root': {
                    backgroundColor: isMetricsMode ? 'background.paper' : 'grey.50',
                    '&.Mui-disabled': {
                      backgroundColor: 'grey.100',
                      '& .MuiOutlinedInput-notchedOutline': {
                        borderColor: 'grey.300',
                      }
                    }
                  },
                  '& .MuiInputLabel-root.Mui-disabled': {
                    color: 'grey.500',
                  },
                  '& .MuiFormHelperText-root.Mui-disabled': {
                    color: 'grey.500',
                  }
                }}
              />
            </Grid>

            {/* Notes Section */}
            <Grid item xs={12}>
              <Typography variant="h6" gutterBottom sx={{ mt: 2 }}>
                Notes & Additional Information
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Add any additional notes, observations, or comments about this event
              </Typography>
              <Divider sx={{ mb: 2 }} />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                multiline
                rows={4}
                size="small"
                label="Notes"
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                helperText="Optional notes about the event, challenges faced, lessons learned, etc."
                placeholder="Enter any additional information about this event..."
              />
            </Grid>

            <Grid item xs={12}>
              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => navigate(id ? `/events/${id}` : '/events')}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="contained"
                >
                  {isMetricsMode ? 'Update Metrics' : (id ? 'Update Event' : 'Create Event')}
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Box>
      </Paper>
    </Box>
  );
};

export default EventForm; 