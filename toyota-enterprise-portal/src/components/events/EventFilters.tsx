import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  TextField,
  MenuItem,
  Button,
  Typography,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  InputAdornment,
} from '@mui/material';
import {
  FilterList as FilterIcon,
  Clear as ClearIcon,
  Search as SearchIcon,
  CalendarToday as CalendarIcon,
} from '@mui/icons-material';
import { EventFilters, FilterOptions } from '../../services/eventService';

interface EventFiltersProps {
  filters: EventFilters;
  onFiltersChange: (filters: EventFilters) => void;
  filterOptions: FilterOptions | null;
  loading?: boolean;
}

const EventFiltersComponent: React.FC<EventFiltersProps> = ({
  filters,
  onFiltersChange,
  filterOptions,
  loading = false,
}) => {
  const [localFilters, setLocalFilters] = useState<EventFilters>(filters);

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleFilterChange = (key: keyof EventFilters, value: any) => {
    const newFilters = { ...localFilters, [key]: value, page: 1 };
    setLocalFilters(newFilters);
    onFiltersChange(newFilters); // Apply immediately
  };

  const clearFilters = () => {
    const clearedFilters: EventFilters = {
      page: 1,
      limit: filters.limit || 10,
      sortBy: 'updatedAt',
      sortOrder: 'DESC',
    };
    setLocalFilters(clearedFilters);
    onFiltersChange(clearedFilters);
  };

  const getActiveFilterCount = () => {
    let count = 0;
    if (localFilters.branchId && localFilters.branchId !== 'all') count++;
    if (localFilters.status && localFilters.status !== 'all') count++;
    if (localFilters.eventTypeId && localFilters.eventTypeId !== 'all') count++;
    if (localFilters.search) count++;
    if (localFilters.startDate) count++;
    if (localFilters.endDate) count++;
    if (localFilters.minBudget || localFilters.maxBudget) count++;
    return count;
  };

  const activeFilterCount = getActiveFilterCount();

  return (
    <Paper sx={{ p: 2, mb: 3 }}>
      {/* Header */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <FilterIcon fontSize="small" />
          <Typography variant="subtitle1" fontWeight="medium">Filters</Typography>
          {activeFilterCount > 0 && (
            <Chip label={activeFilterCount} size="small" color="primary" />
          )}
        </Box>
        {activeFilterCount > 0 && (
          <Button
            size="small"
            startIcon={<ClearIcon />}
            onClick={clearFilters}
            disabled={loading}
          >
            Clear All
          </Button>
        )}
      </Box>

      {/* Compact Filter Row */}
      <Box sx={{ 
        display: 'flex', 
        gap: 2, 
        flexWrap: 'wrap', 
        alignItems: 'flex-end',
        '& .MuiFormControl-root': { minWidth: 120 }
      }}>
        {/* Search */}
        <TextField
          size="small"
          label="Search"
          placeholder="Search events..."
          value={localFilters.search || ''}
          onChange={(e) => handleFilterChange('search', e.target.value)}
          sx={{ minWidth: 200, flexGrow: 1, maxWidth: 300 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        {/* Branch Filter */}
        <FormControl size="small">
          <InputLabel>Branch</InputLabel>
          <Select
            value={localFilters.branchId || 'all'}
            label="Branch"
            onChange={(e) => handleFilterChange('branchId', e.target.value === 'all' ? undefined : e.target.value)}
            disabled={loading || !filterOptions}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="all">All Branches</MenuItem>
            {filterOptions?.branches.map((branch) => (
              <MenuItem key={branch.id} value={branch.id}>
                {branch.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Status Filter */}
        <FormControl size="small">
          <InputLabel>Status</InputLabel>
          <Select
            value={localFilters.status || 'all'}
            label="Status"
            onChange={(e) => handleFilterChange('status', e.target.value === 'all' ? undefined : e.target.value)}
            disabled={loading || !filterOptions}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="all">All Status</MenuItem>
            {filterOptions?.statuses.map((status) => (
              <MenuItem key={status.value} value={status.value}>
                {status.label}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Event Type Filter */}
        <FormControl size="small">
          <InputLabel>Event Type</InputLabel>
          <Select
            value={localFilters.eventTypeId || 'all'}
            label="Event Type"
            onChange={(e) => handleFilterChange('eventTypeId', e.target.value === 'all' ? undefined : e.target.value)}
            disabled={loading || !filterOptions}
            sx={{ minWidth: 150 }}
          >
            <MenuItem value="all">All Types</MenuItem>
            {filterOptions?.eventTypes.map((eventType) => (
              <MenuItem key={eventType.id} value={eventType.id}>
                {eventType.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Budget Range - Min */}
        <TextField
          size="small"
          type="number"
          label="Min Budget"
          placeholder="0"
          value={localFilters.minBudget || ''}
          onChange={(e) => handleFilterChange('minBudget', e.target.value)}
          sx={{ minWidth: 120 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                ₹
              </InputAdornment>
            ),
          }}
        />

        {/* Budget Range - Max */}
        <TextField
          size="small"
          type="number"
          label="Max Budget"
          placeholder="∞"
          value={localFilters.maxBudget || ''}
          onChange={(e) => handleFilterChange('maxBudget', e.target.value)}
          sx={{ minWidth: 120 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                ₹
              </InputAdornment>
            ),
          }}
        />

        {/* Start Date */}
        <TextField
          size="small"
          type="date"
          label="From Date"
          value={localFilters.startDate || ''}
          onChange={(e) => handleFilterChange('startDate', e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 140 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <CalendarIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        {/* End Date */}
        <TextField
          size="small"
          type="date"
          label="To Date"
          value={localFilters.endDate || ''}
          onChange={(e) => handleFilterChange('endDate', e.target.value)}
          InputLabelProps={{ shrink: true }}
          sx={{ minWidth: 140 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <CalendarIcon fontSize="small" />
              </InputAdornment>
            ),
          }}
        />

        {/* Sort By */}
        <FormControl size="small">
          <InputLabel>Sort</InputLabel>
          <Select
            value={localFilters.sortBy || 'startDate'}
            label="Sort"
            onChange={(e) => handleFilterChange('sortBy', e.target.value)}
            sx={{ minWidth: 140 }}
          >
            <MenuItem value="updatedAt">📅 Last Modified</MenuItem>
            <MenuItem value="createdAt">🆕 Created Date</MenuItem>
            <MenuItem value="startDate">📆 Event Date</MenuItem>
            <MenuItem value="title">📝 Title</MenuItem>
            <MenuItem value="status">⚡ Status</MenuItem>
            <MenuItem value="budget">💰 Budget</MenuItem>
          </Select>
        </FormControl>

        {/* Sort Order */}
        <FormControl size="small">
          <InputLabel>Order</InputLabel>
          <Select
            value={localFilters.sortOrder || 'DESC'}
            label="Order"
            onChange={(e) => handleFilterChange('sortOrder', e.target.value as 'ASC' | 'DESC')}
            sx={{ minWidth: 100 }}
          >
            <MenuItem value="DESC">↓ Desc</MenuItem>
            <MenuItem value="ASC">↑ Asc</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Active Filters Display */}
      {activeFilterCount > 0 && (
        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap', alignItems: 'center' }}>
          <Typography variant="caption" color="text.secondary">
            Active filters:
          </Typography>
          {localFilters.search && (
            <Chip
              label={`Search: "${localFilters.search}"`}
              size="small"
              onDelete={() => handleFilterChange('search', '')}
              color="primary"
              variant="outlined"
            />
          )}
          {localFilters.branchId && localFilters.branchId !== 'all' && (
            <Chip
              label={`Branch: ${filterOptions?.branches.find(b => b.id.toString() === String(localFilters.branchId))?.name}`}
              size="small"
              onDelete={() => handleFilterChange('branchId', undefined)}
              color="primary"
              variant="outlined"
            />
          )}
          {localFilters.status && localFilters.status !== 'all' && (
            <Chip
              label={`Status: ${filterOptions?.statuses.find(s => s.value === localFilters.status)?.label}`}
              size="small"
              onDelete={() => handleFilterChange('status', undefined)}
              color="primary"
              variant="outlined"
            />
          )}
          {localFilters.startDate && (
            <Chip
              label={`From: ${new Date(localFilters.startDate).toLocaleDateString()}`}
              size="small"
              onDelete={() => handleFilterChange('startDate', '')}
              color="primary"
              variant="outlined"
            />
          )}
          {localFilters.endDate && (
            <Chip
              label={`To: ${new Date(localFilters.endDate).toLocaleDateString()}`}
              size="small"
              onDelete={() => handleFilterChange('endDate', '')}
              color="primary"
              variant="outlined"
            />
          )}
          {localFilters.eventTypeId && localFilters.eventTypeId !== 'all' && (
            <Chip
              label={`Event Type: ${filterOptions?.eventTypes.find(et => et.id.toString() === String(localFilters.eventTypeId))?.name}`}
              size="small"
              onDelete={() => handleFilterChange('eventTypeId', undefined)}
              color="primary"
              variant="outlined"
            />
          )}
          {(localFilters.minBudget || localFilters.maxBudget) && (
            <Chip
              label={`Budget: ${localFilters.minBudget ? `₹${localFilters.minBudget}` : '₹0'} - ${localFilters.maxBudget ? `₹${localFilters.maxBudget}` : '∞'}`}
              size="small"
              onDelete={() => {
                handleFilterChange('minBudget', '');
                handleFilterChange('maxBudget', '');
              }}
              color="primary"
              variant="outlined"
            />
          )}
        </Box>
      )}
    </Paper>
  );
};

export default EventFiltersComponent; 