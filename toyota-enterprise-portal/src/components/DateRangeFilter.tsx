import React, { useState } from 'react';
import {
  Box,
  Button,
  Popover,
  Typography,
  Chip,
  Stack,
  Divider,
  Grid,
  Tooltip,
} from '@mui/material';
import {
  DateRange as DateRangeIcon,
  Info as InfoIcon,
} from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';

export interface DateRange {
  startDate: Dayjs;
  endDate: Dayjs;
  label: string;
}

interface DateRangeFilterProps {
  value: DateRange;
  onChange: (dateRange: DateRange) => void;
  size?: 'small' | 'medium' | 'large';
}

const predefinedRanges = [
  {
    label: 'Last 7 Days',
    getValue: () => ({
      startDate: dayjs().subtract(7, 'days').startOf('day'),
      endDate: dayjs().endOf('day'),
      label: 'Last 7 Days'
    })
  },
  {
    label: 'This Month',
    getValue: () => ({
      startDate: dayjs().startOf('month'),
      endDate: dayjs().endOf('month'),
      label: 'This Month'
    })
  },
  {
    label: 'Last 30 Days',
    getValue: () => ({
      startDate: dayjs().subtract(30, 'days').startOf('day'),
      endDate: dayjs().endOf('day'),
      label: 'Last 30 Days'
    })
  },
  {
    label: 'Last 3 Months',
    getValue: () => ({
      startDate: dayjs().subtract(3, 'months').startOf('month'),
      endDate: dayjs().endOf('month'),
      label: 'Last 3 Months'
    })
  },
  {
    label: 'This Year',
    getValue: () => ({
      startDate: dayjs().startOf('year'),
      endDate: dayjs().endOf('year'),
      label: 'This Year'
    })
  },
];

const DateRangeFilter: React.FC<DateRangeFilterProps> = ({ 
  value, 
  onChange, 
  size = 'medium' 
}) => {
  const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
  const [tempStartDate, setTempStartDate] = useState<Dayjs | null>(value.startDate);
  const [tempEndDate, setTempEndDate] = useState<Dayjs | null>(value.endDate);

  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    // Reset temp values to current value
    setTempStartDate(value.startDate);
    setTempEndDate(value.endDate);
  };

  const handlePresetSelect = (preset: typeof predefinedRanges[0]) => {
    const newRange = preset.getValue();
    onChange(newRange);
    handleClose();
  };

  const handleCustomApply = () => {
    if (tempStartDate && tempEndDate) {
      const newRange: DateRange = {
        startDate: tempStartDate.startOf('day'),
        endDate: tempEndDate.endOf('day'),
        label: `${tempStartDate.format('MMM DD')} - ${tempEndDate.format('MMM DD, YYYY')}`
      };
      onChange(newRange);
      handleClose();
    }
  };

  const formatDisplayValue = () => {
    if (value.label !== 'Custom') {
      return value.label;
    }
    return `${value.startDate.format('MMM DD')} - ${value.endDate.format('MMM DD, YYYY')}`;
  };

  const getButtonSize = () => {
    switch (size) {
      case 'small': return 'small' as const;
      case 'large': return 'large' as const;
      default: return 'medium' as const;
    }
  };

  const isValidRange = tempStartDate && tempEndDate && tempStartDate.isBefore(tempEndDate);

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <Box>
        <Button
          variant="outlined"
          onClick={handleClick}
          startIcon={<DateRangeIcon />}
          size={getButtonSize()}
          sx={{
            minWidth: 200,
            justifyContent: 'flex-start',
            textTransform: 'none',
            backgroundColor: 'background.paper',
            borderColor: 'divider',
            color: 'text.primary',
            '&:hover': {
              backgroundColor: 'action.hover',
              borderColor: 'primary.main',
            },
            px: 2,
            py: size === 'small' ? 0.75 : size === 'large' ? 1.5 : 1,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, width: '100%' }}>
            <Typography variant="body2" sx={{ flexGrow: 1, textAlign: 'left' }}>
              {formatDisplayValue()}
            </Typography>
            <Chip 
              label={`${value.endDate.diff(value.startDate, 'days') + 1} days`} 
              size="small" 
              color="primary" 
              variant="outlined"
              sx={{ fontSize: '0.7rem', height: 20 }}
            />
            <Tooltip title="Filters events by their start date" arrow>
              <InfoIcon sx={{ fontSize: 16, color: 'text.secondary', ml: 0.5 }} />
            </Tooltip>
          </Box>
        </Button>

        <Popover
          open={open}
          anchorEl={anchorEl}
          onClose={handleClose}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          PaperProps={{
            sx: {
              p: 2,
              minWidth: 400,
              maxWidth: 500,
              mt: 1,
              boxShadow: '0 8px 32px rgba(0,0,0,0.12)',
              border: '1px solid',
              borderColor: 'divider',
            }
          }}
        >
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>
            Select Date Range
          </Typography>

          {/* Preset Buttons */}
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 1.5, color: 'text.secondary' }}>
            Quick Options
          </Typography>
          
          <Grid container spacing={1} sx={{ mb: 3 }}>
            {predefinedRanges.map((preset) => (
              <Grid item xs={6} sm={2.4} key={preset.label}>
                <Button
                  fullWidth
                  variant={value.label === preset.label ? 'contained' : 'outlined'}
                  size="small"
                  onClick={() => handlePresetSelect(preset)}
                  sx={{
                    textTransform: 'none',
                    fontSize: '0.7rem',
                    py: 0.75,
                    px: 1.5,
                    height: 32,
                    minHeight: 32,
                    maxHeight: 32,
                    border: '1px solid',
                    borderColor: value.label === preset.label ? 'primary.main' : 'divider',
                    '&:hover': {
                      borderColor: 'primary.main',
                    },
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {preset.label}
                </Button>
              </Grid>
            ))}
          </Grid>

          <Divider sx={{ my: 2 }} />

          {/* Custom Date Range */}
          <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, mb: 1.5, color: 'text.secondary' }}>
            Custom Range
          </Typography>
          
          <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
            <DatePicker
              label="Start Date"
              value={tempStartDate}
              onChange={(newValue) => setTempStartDate(newValue)}
              slotProps={{
                textField: { 
                  size: 'small',
                  fullWidth: true,
                }
              }}
            />
            <DatePicker
              label="End Date"
              value={tempEndDate}
              onChange={(newValue) => setTempEndDate(newValue)}
              minDate={tempStartDate}
              slotProps={{
                textField: { 
                  size: 'small',
                  fullWidth: true,
                }
              }}
            />
          </Stack>

          {/* Action Buttons */}
          <Stack direction="row" spacing={1} justifyContent="flex-end">
            <Button 
              variant="outlined" 
              size="small" 
              onClick={handleClose}
              sx={{ textTransform: 'none' }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={handleCustomApply}
              disabled={!isValidRange}
              sx={{ textTransform: 'none' }}
            >
              Apply
            </Button>
          </Stack>
        </Popover>
      </Box>
    </LocalizationProvider>
  );
};

export default DateRangeFilter; 