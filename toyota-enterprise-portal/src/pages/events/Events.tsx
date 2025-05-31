import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  IconButton,
  Chip,
  Alert,
  Tooltip,
  Paper,
  Stack,
  TextField,
  InputAdornment,
  Card,
  CardContent,
  Menu,
  MenuItem,
  ListItemText,
  Checkbox,
  Divider,
  Grid,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Refresh as RefreshIcon,
  Search as SearchIcon,
  FileDownload as ExportIcon,
  FilterList as FilterIcon,
  CalendarToday as CalendarIcon,
  BarChart as StatsIcon,
  NotificationImportant as ImportantIcon,
  Business as BranchIcon,
  Science as ScienceIcon,
  Close as CloseIcon,
  Clear as ClearIcon,
  ViewColumn as ViewColumnIcon,
  Event as EventIcon,
  MoreVert as MoreVertIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from '@mui/icons-material';
import { DataTable } from 'primereact/datatable';
import { Column } from 'primereact/column';
import { Calendar } from 'primereact/calendar';
import { Dropdown } from 'primereact/dropdown';
import { InputText } from 'primereact/inputtext';
import { Button as PrimeButton } from 'primereact/button';
import { Toolbar as PrimeToolbar } from 'primereact/toolbar';
import { ConfirmDialog, confirmDialog } from 'primereact/confirmdialog';
import { Toast } from 'primereact/toast';
import { FilterMatchMode, FilterOperator } from 'primereact/api';
import { api } from '../../config/api';
import { formatINR } from '../../utils/format';
import { useUser } from '../../contexts/UserContext';

// PrimeReact imports
import { MultiSelect } from 'primereact/multiselect';
import { Tag } from 'primereact/tag';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Menu as PrimeMenu } from 'primereact/menu';
import { styled } from '@mui/material/styles';
import { useTheme } from '@mui/material/styles';

// PrimeReact CSS with custom styling
import 'primereact/resources/themes/lara-light-indigo/theme.css';
import 'primereact/resources/primereact.min.css';
import 'primeicons/primeicons.css';

import { 
  eventService, 
  EventFilters, 
  FilterOptions, 
  EventsResponse, 
  Event 
} from '../../services/eventService';
import { alpha } from '@mui/material/styles';

// Custom styled DataTable to match Material-UI theme
const StyledDataTableWrapper = styled(Box)(({ theme }) => ({
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  padding: 0,
  backgroundColor: theme.palette.background.paper,
  borderRadius: theme.shape.borderRadius,
  border: `1px solid ${theme.palette.divider}`,
  overflow: 'hidden',
  '& .p-datatable': {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: theme.shape.borderRadius,
    '& .p-datatable-header': {
      backgroundColor: theme.palette.background.paper,
      borderBottom: `1px solid ${theme.palette.divider}`,
      padding: theme.spacing(1),
      flexShrink: 0,
    },
    '& .p-datatable-wrapper': {
      flex: 1,
      overflow: 'auto',
      minHeight: 0,
    },
    '& .p-datatable-table': {
      width: '100%',
    },
    '& .p-datatable-thead > tr > th': {
      backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[50],
      borderBottom: `1px solid ${theme.palette.divider}`,
      color: theme.palette.text.primary,
      fontWeight: 600,
      fontSize: '0.75rem',
      padding: theme.spacing(0.5),
      position: 'sticky',
      top: 0,
      zIndex: 1,
      '& .p-column-header-content': {
        color: theme.palette.text.primary,
        fontWeight: 600,
        fontSize: '0.75rem',
      },
      '& .p-sortable-column-icon': {
        color: theme.palette.text.secondary,
      },
      '& .p-column-filter-menu-button': {
        color: theme.palette.primary.main,
      },
    },
    '& .p-datatable-tbody > tr': {
      backgroundColor: theme.palette.background.paper,
      borderBottom: `1px solid ${alpha(theme.palette.divider, 0.5)}`,
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      height: '40px',
      '&:hover': {
        backgroundColor: alpha(theme.palette.primary.main, 0.08),
        transform: 'translateY(-1px)',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      },
      '&.p-highlight': {
        backgroundColor: alpha(theme.palette.error.main, 0.08),
        borderLeft: `6px solid ${theme.palette.error.main}`,
        boxShadow: `inset 6px 0 0 ${theme.palette.error.main}`,
        '&:hover': {
          backgroundColor: alpha(theme.palette.error.main, 0.12),
          transform: 'translateY(-1px)',
          boxShadow: `inset 6px 0 0 ${theme.palette.error.main}, 0 2px 8px rgba(0,0,0,0.1)`,
        },
      },
      '&:nth-of-type(even)': {
        backgroundColor: theme.palette.mode === 'dark' ? alpha(theme.palette.grey[800], 0.3) : alpha(theme.palette.grey[50], 0.5),
      },
      '&:nth-of-type(even).p-highlight': {
        backgroundColor: alpha(theme.palette.error.main, 0.12),
      },
    },
    '& .p-datatable-tbody > tr > td': {
      color: theme.palette.text.primary,
      padding: theme.spacing(0.25, 0.5),
      borderBottom: `1px solid ${alpha(theme.palette.divider, 0.3)}`,
      verticalAlign: 'middle',
      overflow: 'hidden',
      fontSize: '0.75rem',
      lineHeight: 1.2,
    },
    '& .p-paginator': {
      backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[800] : theme.palette.grey[50],
      borderTop: `1px solid ${theme.palette.divider}`,
      color: theme.palette.text.primary,
      flexShrink: 0,
      padding: theme.spacing(0.5, 1),
      fontSize: '0.7rem',
      minHeight: '50px',
      height: '50px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: theme.spacing(0.5),
      overflow: 'hidden',
      '& .p-paginator-left': {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(0.25),
        flex: '1 1 auto',
        minWidth: 0,
        overflow: 'hidden',
      },
      '& .p-paginator-right': {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(0.5),
        flex: '0 0 auto',
        whiteSpace: 'nowrap',
      },
      '& .p-paginator-pages': {
        display: 'flex',
        alignItems: 'center',
        gap: theme.spacing(0.2),
        flex: '0 0 auto',
        overflow: 'hidden',
      },
      '& .p-paginator-pages .p-paginator-page': {
        color: theme.palette.text.primary,
        backgroundColor: 'transparent',
        border: `1px solid ${theme.palette.divider}`,
        fontSize: '0.65rem',
        minWidth: '1.4rem',
        height: '1.4rem',
        padding: '0.05rem',
        margin: '0 0.02rem',
        flexShrink: 0,
        '&.p-highlight': {
          backgroundColor: theme.palette.primary.main,
          color: theme.palette.primary.contrastText,
          borderColor: theme.palette.primary.main,
        },
        '&:hover': {
          backgroundColor: alpha(theme.palette.primary.main, 0.1),
        },
      },
      '& .p-paginator-first, & .p-paginator-prev, & .p-paginator-next, & .p-paginator-last': {
        color: theme.palette.text.primary,
        backgroundColor: 'transparent',
        border: `1px solid ${theme.palette.divider}`,
        fontSize: '0.65rem',
        minWidth: '1.4rem',
        height: '1.4rem',
        padding: '0.05rem',
        margin: '0 0.02rem',
        flexShrink: 0,
        '&:hover': {
          backgroundColor: alpha(theme.palette.primary.main, 0.1),
        },
      },
      '& .p-dropdown': {
        fontSize: '0.65rem',
        height: '1.4rem',
        minWidth: '3rem',
        flexShrink: 0,
        '& .p-dropdown-label': {
          fontSize: '0.65rem',
          padding: '0.1rem 0.2rem',
        },
      },
      '& .p-paginator-current': {
        fontSize: '0.65rem',
        color: theme.palette.text.secondary,
        margin: '0 0.5rem',
        flexShrink: 1,
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        minWidth: 0,
      },
    },
    '& .p-column-resizer': {
      borderRight: `1px solid ${theme.palette.divider}`,
    },
  },
  '& .p-multiselect, & .p-dropdown, & .p-inputtext, & .p-calendar input': {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    color: theme.palette.text.primary,
    fontSize: '0.75rem',
    '&:focus': {
      borderColor: theme.palette.primary.main,
      boxShadow: `0 0 0 2px ${alpha(theme.palette.primary.main, 0.2)}`,
    },
  },
  '& .p-multiselect-panel, & .p-dropdown-panel, & .p-calendar-panel': {
    backgroundColor: theme.palette.background.paper,
    border: `1px solid ${theme.palette.divider}`,
    borderRadius: theme.shape.borderRadius,
    color: theme.palette.text.primary,
    boxShadow: theme.shadows[8],
  },
  '& .p-inputtext::placeholder': {
    color: theme.palette.text.secondary,
  },
  '& .p-tag': {
    borderRadius: theme.shape.borderRadius,
    fontWeight: 500,
  },
}));

const Events = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [filterOptions, setFilterOptions] = useState<FilterOptions | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<{ id: number; role: string; branch?: { id: number; name: string } } | null>(null);
  
  // PrimeReact DataTable state
  const [globalFilterValue, setGlobalFilterValue] = useState('');
  const [filters, setFilters] = useState<any>({
    global: { value: null, matchMode: FilterMatchMode.CONTAINS },
    title: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    'branch.name': { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.IN }] },
    status: { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
    'eventType.name': { value: null, matchMode: FilterMatchMode.IN },
    startDate: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }] },
    budget: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.GREATER_THAN_OR_EQUAL_TO }] },
  });
  
  // Column visibility state - Optimized for better space utilization
  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    title: true,        // Essential - Event name and description
    branch: true,       // Important - Location context
    status: true,       // Critical - Current state
    startDate: true,    // Important - When event happens
    location: false,    // Secondary - Can be hidden initially
    budget: false,      // Secondary - Financial info
    eventType: false,   // Secondary - Category info
    products: false,    // Secondary - Product details
  });
  
  // Column toggle menu state
  const [columnMenuAnchor, setColumnMenuAnchor] = useState<null | HTMLElement>(null);
  
  // Refs
  const dt = useRef<any>(null);
  const toast = useRef<any>(null);
  const menu = useRef<any>(null);
  
  const theme = useTheme();

  // Fetch current user info
  const fetchCurrentUser = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await api.get('/auth/me', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCurrentUser({ 
        id: response.data.id, 
        role: response.data.role,
        branch: response.data.branch 
      });
    } catch (err) {
      console.error('Error fetching current user:', err);
    }
  }, []);

  // Check if user can edit the event
  const canEditEvent = (event: Event) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    
    const status = event.status.toLowerCase();
    const isEventCreator = currentUser.id === event.userId;
    const isSameBranch = currentUser.branch?.id === event.branchId;
    
    if (currentUser.role === 'sales_manager' && isEventCreator) {
      return status === 'draft' || status === 'rejected' || status === 'pending_gm';
    }
    
    if (currentUser.role === 'general_manager' && isSameBranch) {
      return status === 'draft' || status === 'pending_gm';
    }
    
    if (currentUser.role === 'marketing_head') {
      return status === 'pending_marketing';
    }
    
    return false;
  };

  // Check if user can delete the event
  const canDeleteEvent = (event: Event) => {
    if (!currentUser) return false;
    if (currentUser.role === 'admin') return true;
    
    const status = event.status.toLowerCase();
    const isEventCreator = currentUser.id === event.userId;
    const isSameBranch = currentUser.branch?.id === event.branchId;
    
    if (status === 'approved' || status === 'completed') {
      return false;
    }
    
    if (currentUser.role === 'sales_manager' && isEventCreator) {
      return status === 'draft' || status === 'rejected';
    }
    
    if (currentUser.role === 'general_manager' && isSameBranch) {
      return status === 'draft' || status === 'pending_gm' || status === 'rejected';
    }
    
    if (currentUser.role === 'marketing_head') {
      return status === 'pending_marketing';
    }
    
    return false;
  };

  // Check if user can create events
  const canCreateEvent = () => {
    if (!currentUser) return false;
    return ['sales_manager', 'general_manager', 'admin'].includes(currentUser.role);
  };

  // Fetch filter options
  const fetchFilterOptions = useCallback(async () => {
    try {
      const options = await eventService.getFilterOptions();
      setFilterOptions(options);
    } catch (err) {
      console.error('Error fetching filter options:', err);
    }
  }, []);

  // Fetch events
  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await eventService.getEvents({ page: 1, limit: 1000 }); // Get all events for client-side operations
      setEvents(data.events);
      setFilteredEvents(data.events);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Error fetching events');
      console.error('Error fetching events:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initialize data
  useEffect(() => {
    fetchCurrentUser();
    fetchFilterOptions();
  }, [fetchCurrentUser, fetchFilterOptions]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Mark events as seen when page loads
  useEffect(() => {
    const markEventsAsSeen = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          await api.post('/stats/events/mark-seen', {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          if ((window as any).refreshEventBadge) {
            await (window as any).refreshEventBadge();
          }
        }
      } catch (error) {
        console.error('Error marking events as seen:', error);
      }
    };

    const timer = setTimeout(() => {
      markEventsAsSeen();
    }, 30000);

    return () => clearTimeout(timer);
  }, []);

  const handleRefresh = () => {
    fetchEvents();
    toast.current?.show({ severity: 'success', summary: 'Refreshed', detail: 'Events data refreshed successfully' });
  };

  const handleDelete = async (id: number) => {
    confirmDialog({
      message: 'Are you sure you want to delete this event?',
      header: 'Delete Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: async () => {
        try {
          await eventService.deleteEvent(id);
          fetchEvents();
          toast.current?.show({ severity: 'success', summary: 'Deleted', detail: 'Event deleted successfully' });
        } catch (err: any) {
          toast.current?.show({ severity: 'error', summary: 'Error', detail: err.response?.data?.message || 'Error deleting event' });
        }
      }
    });
  };

  // Global filter
  const onGlobalFilterChange = (e: any) => {
    const value = e.target.value;
    let _filters = { ...filters };
    _filters['global'].value = value;
    setFilters(_filters);
    setGlobalFilterValue(value);
  };

  // Clear all filters
  const clearFilter = () => {
    initFilters();
    setGlobalFilterValue('');
  };

  const initFilters = () => {
    setFilters({
      global: { value: null, matchMode: FilterMatchMode.CONTAINS },
      title: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
      'branch.name': { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.IN }] },
      status: { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
      'eventType.name': { value: null, matchMode: FilterMatchMode.IN },
      startDate: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }] },
      budget: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.GREATER_THAN_OR_EQUAL_TO }] },
    } as any);
  };

  // Export functions
  const exportCSV = () => {
    dt.current?.exportCSV();
  };

  const exportPdf = () => {
    import('jspdf').then((jsPDF) => {
      import('jspdf-autotable').then(() => {
        const doc = new jsPDF.default('l', 'mm', 'a4');
        const cols = [
          { title: 'Title', dataKey: 'title' },
          { title: 'Branch', dataKey: 'branch' },
          { title: 'Status', dataKey: 'status' },
          { title: 'Start Date', dataKey: 'startDate' },
          { title: 'Budget', dataKey: 'budget' }
        ];
        const rows = events.map(event => ({
          title: event.title,
          branch: event.branch.name,
          status: event.status,
          startDate: new Date(event.startDate).toLocaleDateString(),
          budget: formatINR(event.budget)
        }));
        
        (doc as any).autoTable({
          columns: cols,
          body: rows,
          startY: 30,
          head: [['Title', 'Branch', 'Status', 'Start Date', 'Budget']],
          styles: { fontSize: 8 },
          headStyles: { fillColor: [71, 85, 105] }
        });
        
        doc.save('events.pdf');
      });
    });
  };

  const exportExcel = () => {
    import('xlsx').then((xlsx) => {
      const worksheet = xlsx.utils.json_to_sheet(
        events.map(event => ({
          Title: event.title,
          Description: event.description,
          Branch: event.branch.name,
          Location: event.location,
          Status: event.status,
          'Start Date': new Date(event.startDate).toLocaleDateString(),
          'End Date': new Date(event.endDate).toLocaleDateString(),
          Budget: event.budget,
          'Event Type': event.eventType?.name || 'No Type',
          Products: event.products?.map((p: any) => p.name).join(', ') || ''
        }))
      );
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Events');
      xlsx.writeFile(workbook, 'events.xlsx');
    });
  };

  // Column templates - Optimized for space efficiency
  const eventDetailsTemplate = (rowData: Event) => (
    <Box sx={{ py: 0.25, position: 'relative' }}>
      {rowData.isNew && (
        <Box
          sx={{
            position: 'absolute',
            top: 2,
            left: -8,
            width: 6,
            height: 6,
            borderRadius: '50%',
            backgroundColor: 'error.main',
            zIndex: 1,
          }}
        />
      )}
      <Typography variant="subtitle2" fontWeight="600" sx={{ fontSize: '0.75rem', lineHeight: 1.1, mb: 0.125 }}>
        {rowData.title}
      </Typography>
      <Typography 
        variant="caption" 
        color="text.secondary" 
        sx={{ 
          fontSize: '0.65rem',
          display: '-webkit-box',
          WebkitLineClamp: 1,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          lineHeight: 1.1
        }}
      >
        {rowData.description}
      </Typography>
    </Box>
  );

  const branchTemplate = (rowData: Event) => (
    <Box sx={{ py: 0.25 }}>
      <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.75rem', lineHeight: 1.1, mb: 0.125 }}>
        {rowData.branch.name}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', lineHeight: 1 }}>
        📍 {rowData.branch.location}
      </Typography>
    </Box>
  );

  const statusTemplate = (rowData: Event) => {
    const status = rowData.status.toLowerCase();
    const getStatusProps = () => {
      switch (status) {
        case 'draft':
          return { severity: 'info', icon: 'pi-file-edit', label: 'Draft' };
        case 'pending_gm':
          return { severity: 'warning', icon: 'pi-clock', label: 'Pending GM' };
        case 'pending_marketing':
          return { severity: 'warning', icon: 'pi-clock', label: 'Pending Mkt' };
        case 'approved':
          return { severity: 'success', icon: 'pi-check-circle', label: 'Approved' };
        case 'completed':
          return { severity: 'success', icon: 'pi-star', label: 'Completed' };
        case 'rejected':
        case 'cancelled':
          return { severity: 'danger', icon: 'pi-times-circle', label: 'Rejected' };
        default:
          return { severity: 'info', icon: 'pi-info-circle', label: rowData.status };
      }
    };
    
    const statusProps = getStatusProps();
    
    return (
      <Tag 
        severity={statusProps.severity as any} 
        icon={statusProps.icon}
        value={statusProps.label}
        style={{ fontSize: '0.65rem', padding: '0.15rem 0.4rem' }}
      />
    );
  };

  const dateTemplate = (rowData: Event) => {
    const startDate = new Date(rowData.startDate);
    const endDate = new Date(rowData.endDate);
    const isToday = startDate.toDateString() === new Date().toDateString();
    const isPast = startDate < new Date();
    
    return (
      <Box sx={{ py: 0.25 }}>
        <Typography 
          variant="body2" 
          fontWeight="500" 
          sx={{ 
            fontSize: '0.75rem', 
            lineHeight: 1.1,
            mb: 0.125,
            color: isToday ? 'primary.main' : isPast ? 'text.secondary' : 'text.primary'
          }}
        >
          {isToday ? '🔥 Today' : startDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </Typography>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', lineHeight: 1 }}>
          to {endDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </Typography>
      </Box>
    );
  };

  const compactLocationTemplate = (rowData: Event) => (
    <Typography 
      variant="body2" 
      sx={{ 
        fontSize: '0.75rem',
        fontWeight: 500,
        color: 'text.primary',
        lineHeight: 1.1,
      }}
    >
      📍 {rowData.location}
    </Typography>
  );

  const budgetTemplate = (rowData: Event) => (
    <Typography 
      variant="body2" 
      fontWeight="600"
      sx={{ 
        fontSize: '0.75rem',
        color: 'success.main',
        fontFamily: 'monospace',
        lineHeight: 1.1,
      }}
    >
      {formatINR(rowData.budget)}
    </Typography>
  );

  const compactProductsTemplate = (rowData: Event) => {
    const products = rowData.products || [];
    
    return (
      <Box sx={{ py: 0.25 }}>
        {products.length > 0 ? (
          <>
            <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.75rem', lineHeight: 1.1, mb: 0.125 }}>
              {products[0]?.name}
              {products.length > 1 && ` +${products.length - 1}`}
            </Typography>
            <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', lineHeight: 1 }}>
              🚗 {products.length} item{products.length !== 1 ? 's' : ''}
            </Typography>
          </>
        ) : (
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.75rem' }}>
            No products
          </Typography>
        )}
      </Box>
    );
  };

  const eventTypeTemplate = (rowData: Event) => (
    <Box sx={{ py: 0.25 }}>
      <Typography variant="body2" fontWeight="500" sx={{ fontSize: '0.75rem', lineHeight: 1.1, mb: 0.125 }}>
        {rowData.eventType?.name || 'No Type'}
      </Typography>
      <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', lineHeight: 1 }}>
        📂 {rowData.eventType?.category || 'Uncategorized'}
      </Typography>
    </Box>
  );

  // Filter templates
  const statusFilterTemplate = (options: any) => {
    const statusOptions = [
      { label: '📝 Draft', value: 'draft' },
      { label: '⏳ Pending GM', value: 'pending_gm' },
      { label: '⏳ Pending Marketing', value: 'pending_marketing' },
      { label: '✅ Approved', value: 'approved' },
      { label: '🎉 Completed', value: 'completed' },
      { label: '❌ Rejected', value: 'rejected' },
      { label: '❌ Cancelled', value: 'cancelled' },
    ];

    return (
      <MultiSelect
        value={options.value}
        options={statusOptions}
        onChange={(e) => options.filterCallback(e.value)}
        optionLabel="label"
        placeholder="Select Status"
        className="p-column-filter"
        style={{ minWidth: '12rem' }}
      />
    );
  };

  const branchFilterTemplate = (options: any) => {
    const branchOptions = filterOptions?.branches.map(branch => ({
      label: `${branch.name} - ${branch.location}`,
      value: branch.name
    })) || [];

    return (
      <MultiSelect
        value={options.value}
        options={branchOptions}
        onChange={(e) => options.filterCallback(e.value)}
        optionLabel="label"
        placeholder="Select Branches"
        className="p-column-filter"
        style={{ minWidth: '12rem' }}
      />
    );
  };

  const eventTypeFilterTemplate = (options: any) => {
    const eventTypeOptions = filterOptions?.eventTypes.map(type => ({
      label: `${type.name} (${type.category})`,
      value: type.name
    })) || [];

    return (
      <MultiSelect
        value={options.value}
        options={eventTypeOptions}
        onChange={(e) => options.filterCallback(e.value)}
        optionLabel="label"
        placeholder="Select Event Types"
        className="p-column-filter"
        style={{ minWidth: '12rem' }}
      />
    );
  };

  // Table header
  const renderHeader = () => {
    const exportMenuItems = [
      {
        label: 'CSV',
        icon: 'pi pi-file',
        command: () => exportCSV()
      },
      {
        label: 'Excel',
        icon: 'pi pi-file-excel',
        command: () => exportExcel()
      },
      {
        label: 'PDF',
        icon: 'pi pi-file-pdf',
        command: () => exportPdf()
      }
    ];

    return (
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, mb: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <TextField
            value={globalFilterValue}
            onChange={(e) => onGlobalFilterChange(e)}
            placeholder="Global Search..."
            size="small"
            sx={{ minWidth: '300px' }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
          />
          <Button 
            variant="outlined" 
            startIcon={<CloseIcon />} 
            onClick={clearFilter}
            size="small"
          >
            Clear Filters
          </Button>
        </Box>
        
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            onClick={(e) => setColumnMenuAnchor(e.currentTarget)}
            size="small"
            sx={{ whiteSpace: 'nowrap' }}
          >
            Columns
          </Button>
          
          <Button
            variant="outlined"
            startIcon={<ExportIcon />}
            onClick={(e) => menu.current?.toggle(e)}
            size="small"
          >
            Export
          </Button>
          <PrimeMenu ref={menu} model={exportMenuItems} popup />
          
          <Button
            variant="outlined"
            startIcon={<RefreshIcon />}
            onClick={handleRefresh}
            size="small"
          >
            Refresh
          </Button>
        </Box>
      </Box>
    );
  };

  // Column toggle menu
  const handleColumnToggle = (columnKey: string) => {
    setVisibleColumns(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }));
  };

  const ColumnToggleMenu = () => (
    <Menu
      anchorEl={columnMenuAnchor}
      open={Boolean(columnMenuAnchor)}
      onClose={() => setColumnMenuAnchor(null)}
      PaperProps={{
        sx: {
          maxHeight: 400,
          minWidth: 200,
          mt: 1,
        }
      }}
    >
      <MenuItem disabled>
        <Typography variant="subtitle2" fontWeight="600">
          Show/Hide Columns
        </Typography>
      </MenuItem>
      <Divider />
      {Object.entries(visibleColumns).map(([key, visible]) => (
        <MenuItem key={key} onClick={() => handleColumnToggle(key)}>
          <Checkbox checked={visible} size="small" />
          <ListItemText 
            primary={key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1')}
            primaryTypographyProps={{ fontSize: '0.875rem' }}
          />
        </MenuItem>
      ))}
    </Menu>
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '400px' }}>
        <ProgressSpinner />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      p: 2, 
      backgroundColor: 'background.default', 
      minHeight: '100vh'
    }}>
      <Toast ref={toast} />
      <ConfirmDialog />
      <ColumnToggleMenu />
      
      {/* Header */}
      <Box sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        mb: 2,
        backgroundColor: 'background.paper',
        p: 1.5,
        borderRadius: 2,
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <EventIcon color="primary" sx={{ fontSize: 32 }} />
          <Typography variant="h4" fontWeight={700} color="text.primary">
            Events Management
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
          {/* Debug Buttons - Only for Admin */}
          {currentUser?.role === 'admin' && (
            <>
              <Button
                variant="outlined"
                size="small"
                onClick={async () => {
                  try {
                    const token = localStorage.getItem('token');
                    const response = await api.get('/stats/debug/badge-breakdown', {
                      headers: { Authorization: `Bearer ${token}` }
                    });
                    const data = response.data;
                    toast.current?.show({
                      severity: 'info',
                      summary: 'Badge Breakdown',
                      detail: `Your Badge Count: ${data.badgeTotal}`,
                      life: 5000
                    });
                  } catch (error) {
                    console.error('Debug error:', error);
                  }
                }}
                sx={{ fontSize: '0.75rem' }}
              >
                🔍 Debug Badge Count
              </Button>

              <Button
                variant="outlined"
                size="small"
                onClick={async () => {
                  try {
                    const token = localStorage.getItem('token');
                    const response = await api.post('/events/demo/create-new-event', {}, {
                      headers: { Authorization: `Bearer ${token}` }
                    });
                    toast.current?.show({
                      severity: 'success',
                      summary: 'Demo Event Created',
                      detail: response.data.message,
                      life: 3000
                    });
                    fetchEvents();
                    if ((window as any).refreshEventBadge) {
                      await (window as any).refreshEventBadge();
                    }
                  } catch (error) {
                    console.error('Demo error:', error);
                  }
                }}
                sx={{ fontSize: '0.75rem' }}
              >
                ➕ Demo: Create New Event
              </Button>
              
              <Button
                variant="outlined"
                size="small"
                color="success"
                onClick={() => {
                  toast.current?.show({
                    severity: 'success',
                    summary: 'PrimeReact DataTable Features',
                    detail: '🎉 Advanced filtering, sorting, export, selection, column management and more!',
                    life: 5000
                  });
                }}
                sx={{ fontSize: '0.75rem' }}
              >
                🎯 PrimeReact Features
              </Button>
            </>
          )}

          {canCreateEvent() && (
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => navigate('/events/new')}
              sx={{ 
                backgroundColor: 'primary.main',
                '&:hover': { backgroundColor: 'primary.dark' },
                fontWeight: 600,
                px: 3
              }}
            >
              Create Event
            </Button>
          )}
        </Box>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* PrimeReact DataTable with Custom Styling */}
      <Paper sx={{ 
        backgroundColor: 'background.paper', 
        boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
      }}>
        <StyledDataTableWrapper>
          <DataTable
            ref={dt}
            value={events}
            paginator
            rows={10}
            rowsPerPageOptions={[10, 25, 50, 100]}
            paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
            currentPageReportTemplate="Showing {first} to {last} of {totalRecords} events"
            globalFilterFields={['title', 'description', 'branch.name', 'status', 'eventType.name', 'location']}
            filters={filters}
            onFilter={(e) => setFilters(e.filters)}
            header={renderHeader()}
            emptyMessage="No events found."
            loading={loading}
            sortMode="multiple"
            removableSort
            sortField="updatedAt"
            sortOrder={-1}
            resizableColumns
            columnResizeMode="fit"
            reorderableColumns
            scrollable
            scrollHeight="calc(100vh - 280px)"
            stripedRows={false}
            showGridlines
            size="small"
            responsiveLayout="stack"
            breakpoint="960px"
            style={{ width: '100%' }}
            rowClassName={(data) => data.isNew ? 'p-highlight' : ''}
            onRowClick={(e) => navigate(`/events/${e.data.id}`)}
          >
            {visibleColumns.title && (
              <Column 
                field="title" 
                header="Event Details" 
                body={eventDetailsTemplate}
                sortable 
                filter 
                filterPlaceholder="Search by title..."
                style={{ minWidth: '14rem', maxWidth: '18rem' }}
                headerStyle={{ fontWeight: 600 }}
              />
            )}
            
            {visibleColumns.branch && (
              <Column 
                field="branch.name" 
                header="Branch" 
                body={branchTemplate}
                sortable 
                filter 
                filterElement={branchFilterTemplate}
                showFilterMatchModes={false}
                style={{ minWidth: '7rem', maxWidth: '9rem' }}
                headerStyle={{ fontWeight: 600 }}
              />
            )}
            
            {visibleColumns.status && (
              <Column 
                field="status" 
                header="Status" 
                body={statusTemplate}
                sortable 
                filter 
                filterElement={statusFilterTemplate}
                showFilterMatchModes={false}
                style={{ minWidth: '6rem', maxWidth: '7rem' }}
                headerStyle={{ fontWeight: 600 }}
              />
            )}
            
            {visibleColumns.startDate && (
              <Column 
                field="startDate" 
                header="Event Period" 
                body={dateTemplate}
                sortable 
                filter 
                filterElement={(options) => <Calendar value={options.value} onChange={(e) => options.filterCallback(e.value)} dateFormat="mm/dd/yy" placeholder="mm/dd/yyyy" />}
                style={{ minWidth: '7rem', maxWidth: '9rem' }}
                headerStyle={{ fontWeight: 600 }}
              />
            )}
            
            {visibleColumns.location && (
              <Column 
                field="location" 
                header="Location" 
                body={compactLocationTemplate}
                sortable 
                filter 
                filterPlaceholder="Search by location..."
                style={{ minWidth: '6rem', maxWidth: '8rem' }}
                headerStyle={{ fontWeight: 600 }}
              />
            )}
            
            {visibleColumns.budget && (
              <Column 
                field="budget" 
                header="Budget" 
                body={budgetTemplate}
                sortable 
                filter 
                dataType="numeric"
                style={{ minWidth: '5rem', maxWidth: '7rem' }}
                headerStyle={{ fontWeight: 600 }}
              />
            )}
            
            {visibleColumns.eventType && (
              <Column 
                field="eventType.name" 
                header="Event Type" 
                body={eventTypeTemplate}
                sortable 
                filter 
                filterElement={eventTypeFilterTemplate}
                showFilterMatchModes={false}
                style={{ minWidth: '7rem', maxWidth: '9rem' }}
                headerStyle={{ fontWeight: 600 }}
              />
            )}
            
            {visibleColumns.products && (
              <Column 
                field="products" 
                header="Products" 
                body={compactProductsTemplate}
                style={{ minWidth: '7rem', maxWidth: '9rem' }}
                headerStyle={{ fontWeight: 600 }}
              />
            )}
          </DataTable>
        </StyledDataTableWrapper>
      </Paper>
    </Box>
  );
};

export default Events; 