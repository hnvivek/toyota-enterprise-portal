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

// Add PrimeReact configuration
import { PrimeReactProvider } from 'primereact/api';

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
    global: { value: '', matchMode: FilterMatchMode.CONTAINS },
    title: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
    'branch.name': { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.IN }] },
    status: { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
    'eventType.name': { value: null, matchMode: FilterMatchMode.IN },
    startDate: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }] },
    budget: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.GREATER_THAN_OR_EQUAL_TO }] },
    actualEnquiries: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.GREATER_THAN_OR_EQUAL_TO }] },
    actualOrders: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.GREATER_THAN_OR_EQUAL_TO }] },
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
    enquiriesMetrics: true,  // Important - Planned vs Actual enquiries
    ordersMetrics: true,     // Important - Planned vs Actual orders
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

  // Mark events as seen when user navigates away from the page
  useEffect(() => {
    let hasViewedPage = false;
    
    // Mark that user has viewed the page after a short delay
    const viewTimer = setTimeout(() => {
      hasViewedPage = true;
      console.log('User has viewed the Events page');
    }, 500); // 500ms - reasonable time to ensure they actually viewed the page

    const markEventsAsSeen = async () => {
      // Only mark as seen if user actually viewed the page
      if (!hasViewedPage) {
        console.log('User left too quickly, not marking events as seen');
        return;
      }

      try {
        const token = localStorage.getItem('token');
        if (token) {
          console.log('Marking events as seen on page exit...');
          await api.post('/stats/events/mark-seen', {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
          
          // Refresh badge immediately after marking as seen
          if ((window as any).refreshEventBadge) {
            await (window as any).refreshEventBadge();
          }
          console.log('Events marked as seen and badge refreshed on exit');
        }
      } catch (error) {
        console.error('Error marking events as seen:', error);
      }
    };

    // Handle browser tab/window close
    const handleBeforeUnload = () => {
      if (hasViewedPage) {
        const token = localStorage.getItem('token');
        if (token) {
          try {
            // Use sendBeacon for reliable data sending during page unload
            const formData = new FormData();
            formData.append('_method', 'POST');
            navigator.sendBeacon('/api/stats/events/mark-seen', formData);
          } catch (error) {
            console.error('Error with sendBeacon:', error);
          }
        }
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup function - only runs when component unmounts (user navigates away)
    return () => {
      clearTimeout(viewTimer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Only mark as seen if user actually viewed the page
      markEventsAsSeen();
    };
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
      global: { value: '', matchMode: FilterMatchMode.CONTAINS },
      title: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.STARTS_WITH }] },
      'branch.name': { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.IN }] },
      status: { operator: FilterOperator.OR, constraints: [{ value: null, matchMode: FilterMatchMode.EQUALS }] },
      'eventType.name': { value: null, matchMode: FilterMatchMode.IN },
      startDate: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.DATE_IS }] },
      budget: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.GREATER_THAN_OR_EQUAL_TO }] },
      actualEnquiries: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.GREATER_THAN_OR_EQUAL_TO }] },
      actualOrders: { operator: FilterOperator.AND, constraints: [{ value: null, matchMode: FilterMatchMode.GREATER_THAN_OR_EQUAL_TO }] },
    } as any);
  };

  // Helper function to get filtered data from DataTable
  const getFilteredData = () => {
    // Use the filtered events state if available and not empty
    if (filteredEvents.length > 0) {
      return filteredEvents;
    }
    
    // Fallback to all events if no filtering has been applied
    return events;
  };

  // Export functions with proper column names and filtered data
  const exportCSV = () => {
    // Use PrimeReact's built-in CSV export
    dt.current?.exportCSV();
    
    // Show success message
    const filteredData = getFilteredData();
    toast.current?.show({ 
      severity: 'success', 
      summary: 'CSV Export Complete', 
      detail: `${filteredData.length} events exported to CSV` 
    });
  };

  const exportPdf = () => {
    import('jspdf').then((jsPDFModule) => {
      import('jspdf-autotable').then((autoTableModule) => {
        const jsPDF = jsPDFModule.default;
        
        // Create document in landscape mode for better table fit
        const doc = new jsPDF({
          orientation: 'landscape',
          unit: 'mm',
          format: 'a4'
        });
        
        // Get filtered data
        const filteredData = getFilteredData();
        console.log('PDF Export - Starting with data count:', filteredData.length);
        
        // Add header with clean styling
        doc.setFillColor(220, 38, 38); // Toyota red
        doc.rect(0, 0, 297, 30, 'F');
        
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(20);
        doc.setFont('helvetica', 'bold');
        doc.text('TOYOTA - Events Performance Report', 15, 20);
        
        // Reset colors and add report info
        doc.setTextColor(0, 0, 0);
        doc.setFontSize(14);
        doc.setFont('helvetica', 'bold');
        doc.text('Report Summary', 15, 45);
        
        // Calculate totals first
        const totalBudget = filteredData.reduce((sum, event) => {
          const budget = Number(event.budget) || 0;
          return sum + budget;
        }, 0);
        const totalPlannedEnq = filteredData.reduce((sum, event) => sum + (event.plannedEnquiries || 0), 0);
        const totalActualEnq = filteredData.reduce((sum, event) => sum + (event.actualEnquiries || 0), 0);
        const totalPlannedOrd = filteredData.reduce((sum, event) => sum + (event.plannedOrders || 0), 0);
        const totalActualOrd = filteredData.reduce((sum, event) => sum + (event.actualOrders || 0), 0);
        
        // Format budget display cleanly
        const budgetFormatted = totalBudget > 0 ? 
          `Rs. ${totalBudget.toLocaleString('en-IN')}` : 'Rs. 0';
        
        // SECTION 1: Basic Information
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(`Generated: ${new Date().toLocaleString()}`, 15, 55);
        doc.text(`Total Events: ${filteredData.length}`, 15, 62);
        doc.text(`Total Budget: ${budgetFormatted}`, 15, 69);
        
        // SECTION 2: Performance Metrics (with visual separation)
        // Add a subtle line separator
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.5);
        doc.line(140, 52, 140, 76);
        
        // Performance calculations
        const enquiryPerformance = totalPlannedEnq > 0 ? 
          Math.round((totalActualEnq / totalPlannedEnq) * 100) : 0;
        const orderPerformance = totalPlannedOrd > 0 ? 
          Math.round((totalActualOrd / totalPlannedOrd) * 100) : 0;
        
        // Enquiries section
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('ENQUIRIES', 150, 55);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`Planned: ${totalPlannedEnq.toLocaleString()}`, 150, 62);
        doc.text(`Actual: ${totalActualEnq.toLocaleString()} (${enquiryPerformance}%)`, 150, 68);
        
        // Orders section  
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(11);
        doc.text('ORDERS', 220, 55);
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.text(`Planned: ${totalPlannedOrd.toLocaleString()}`, 220, 62);
        doc.text(`Actual: ${totalActualOrd.toLocaleString()} (${orderPerformance}%)`, 220, 68);
        
        // Prepare table data with clean formatting
        const tableHeaders = [
          'S.No', 'Event Title', 'Branch', 'Status', 'Start Date', 'End Date', 
          'Location', 'Budget', 'Event Type', 'Plan Enq', 'Act Enq', 'Plan Ord', 'Act Ord'
        ];
        
        const tableData = filteredData.map((event: Event, index: number) => [
          (index + 1).toString(),
          event.title || '',
          event.branch?.name || '',
          event.status || '',
          new Date(event.startDate).toLocaleDateString() || '',
          new Date(event.endDate).toLocaleDateString() || '',
          event.location || '',
          formatINR(event.budget || 0).replace('₹', 'Rs.'),
          (event.eventType?.name || 'N/A').substring(0, 15), // Truncate long event type names
          (event.plannedEnquiries || 0).toString(),
          (event.actualEnquiries || 0).toString(),
          (event.plannedOrders || 0).toString(),
          (event.actualOrders || 0).toString()
        ]);
        
        console.log('Table Headers:', tableHeaders);
        console.log('Table Data Sample:', tableData[0]);
        console.log('autoTable available:', typeof (doc as any).autoTable);
        
        // Create the table using autoTable
        try {
          if (typeof (doc as any).autoTable === 'function') {
            console.log('Using autoTable for PDF generation');
            
            (doc as any).autoTable({
              head: [tableHeaders],
              body: tableData,
              startY: 88,
              margin: { left: 8, right: 8 },
              styles: {
                fontSize: 7,
                cellPadding: 2,
                lineColor: [128, 128, 128],
                lineWidth: 0.1,
                textColor: [0, 0, 0],
                font: 'helvetica',
                overflow: 'linebreak'
              },
              headStyles: {
                fillColor: [52, 73, 93],
                textColor: [255, 255, 255],
                fontSize: 8,
                fontStyle: 'bold',
                halign: 'center'
              },
              columnStyles: {
                0: { cellWidth: 12, halign: 'center' }, // S.No
                1: { cellWidth: 38 }, // Event Title - increased width
                2: { cellWidth: 18 }, // Branch
                3: { cellWidth: 18, halign: 'center' }, // Status
                4: { cellWidth: 18, halign: 'center' }, // Start Date
                5: { cellWidth: 18, halign: 'center' }, // End Date
                6: { cellWidth: 22 }, // Location
                7: { cellWidth: 20, halign: 'right' }, // Budget
                8: { cellWidth: 25 }, // Event Type - increased width
                9: { cellWidth: 14, halign: 'center' }, // Plan Enq
                10: { cellWidth: 14, halign: 'center' }, // Act Enq
                11: { cellWidth: 14, halign: 'center' }, // Plan Ord
                12: { cellWidth: 14, halign: 'center' } // Act Ord
              },
              alternateRowStyles: {
                fillColor: [245, 245, 245]
              },
              tableLineColor: [128, 128, 128],
              tableLineWidth: 0.1,
              theme: 'grid',
              didDrawPage: function(data: any) {
                // Footer
                doc.setFontSize(8);
                doc.setTextColor(128, 128, 128);
                doc.text('Generated by Toyota Enterprise Portal', 15, doc.internal.pageSize.height - 10);
                doc.text(`Page ${data.pageNumber}`, doc.internal.pageSize.width - 30, doc.internal.pageSize.height - 10);
              }
            });
            
            console.log('autoTable completed successfully');
            
          } else {
            throw new Error('autoTable function not available');
          }
        } catch (error) {
          console.error('autoTable failed, using manual table creation:', error);
          
          // Manual table creation as fallback with adjusted widths
          let currentY = 90;
          const rowHeight = 6;
          const colWidths = [12, 38, 18, 18, 18, 18, 22, 20, 25, 14, 14, 14, 14]; // Adjusted widths
          let currentX = 8;
          
          // Draw headers
          doc.setFillColor(52, 73, 93);
          doc.rect(currentX, currentY, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'F');
          
          doc.setTextColor(255, 255, 255);
          doc.setFont('helvetica', 'bold');
          doc.setFontSize(8);
          
          tableHeaders.forEach((header, i) => {
            doc.text(header, currentX + colWidths[i]/2, currentY + 4, { align: 'center' });
            currentX += colWidths[i];
          });
          
          currentY += rowHeight;
          
          // Draw data rows
          doc.setTextColor(0, 0, 0);
          doc.setFont('helvetica', 'normal');
          doc.setFontSize(7);
          
          tableData.forEach((row, rowIndex) => {
            currentX = 8;
            
            // Alternate row colors
            if (rowIndex % 2 === 1) {
              doc.setFillColor(245, 245, 245);
              doc.rect(currentX, currentY, colWidths.reduce((a, b) => a + b, 0), rowHeight, 'F');
            }
            
            row.forEach((cell, colIndex) => {
              const maxLength = colIndex === 1 ? 25 : colIndex === 8 ? 15 : 20; // Different limits for different columns
              const text = cell.toString().substring(0, maxLength);
              const align = [0, 3, 4, 5, 7, 9, 10, 11, 12].includes(colIndex) ? 'center' : 'left';
              const x = align === 'center' ? currentX + colWidths[colIndex]/2 : currentX + 2;
              
              doc.text(text, x, currentY + 4, { align: align as any });
              currentX += colWidths[colIndex];
            });
            
            currentY += rowHeight;
            
            // Add new page if needed
            if (currentY > 180) {
              doc.addPage();
              currentY = 20;
            }
          });
        }
        
        // Save the PDF
        const fileName = `toyota_events_${new Date().toISOString().split('T')[0]}.pdf`;
        doc.save(fileName);
        
        toast.current?.show({
          severity: 'success',
          summary: 'PDF Generated',
          detail: `Report with ${filteredData.length} events saved as ${fileName}`
        });
        
      }).catch((autoTableError) => {
        console.error('Failed to load jspdf-autotable:', autoTableError);
        toast.current?.show({
          severity: 'error',
          summary: 'PDF Library Error',
          detail: 'Could not load PDF table library'
        });
      });
    }).catch((jsPDFError) => {
      console.error('Failed to load jsPDF:', jsPDFError);
      toast.current?.show({
        severity: 'error',
        summary: 'PDF Export Failed',
        detail: 'Could not load PDF library'
      });
    });
  };

  const exportExcel = () => {
    import('xlsx').then((xlsx) => {
      // Get filtered data from DataTable - use helper function
      const filteredData = getFilteredData();
      
      // Create worksheet with proper column names
      const worksheet = xlsx.utils.json_to_sheet(
        filteredData.map((event: Event) => ({
          'Title': event.title,
          'Description': event.description,
          'Branch': event.branch.name,
          'Location': event.location,
          'Status': event.status,
          'Start Date': new Date(event.startDate).toLocaleDateString(),
          'End Date': new Date(event.endDate).toLocaleDateString(),
          'Budget': event.budget,
          'Event Type': event.eventType?.name || 'No Type',
          'Products': event.products?.map((p: any) => p.name).join(', ') || 'None',
          'Planned Enquiries': event.plannedEnquiries || 0,
          'Actual Enquiries': event.actualEnquiries || 0,
          'Enquiries Achievement %': event.plannedEnquiries > 0 ? Math.round(((event.actualEnquiries || 0) / event.plannedEnquiries) * 100) : 0,
          'Planned Orders': event.plannedOrders || 0,
          'Actual Orders': event.actualOrders || 0,
          'Orders Achievement %': event.plannedOrders > 0 ? Math.round(((event.actualOrders || 0) / event.plannedOrders) * 100) : 0
        }))
      );
      
      const workbook = xlsx.utils.book_new();
      xlsx.utils.book_append_sheet(workbook, worksheet, 'Events');
      xlsx.writeFile(workbook, `events_${new Date().toISOString().split('T')[0]}.xlsx`);
      
      toast.current?.show({ 
        severity: 'success', 
        summary: 'Excel Export Complete', 
        detail: `${filteredData.length} events exported to Excel` 
      });
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

  // Planned vs Actual Enquiries Template
  const enquiriesMetricsTemplate = (rowData: Event) => {
    const planned = rowData.plannedEnquiries || 0;
    const actual = rowData.actualEnquiries || 0;
    const percentage = planned > 0 ? Math.round((actual / planned) * 100) : 0;
    const isOverAchieving = actual > planned;
    const isUnderAchieving = actual < planned && planned > 0;
    
    return (
      <Box sx={{ py: 0.25 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.125 }}>
          <Typography variant="body2" fontWeight="600" sx={{ fontSize: '0.75rem', lineHeight: 1.1 }}>
            {actual}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
            / {planned}
          </Typography>
          {planned > 0 && (
            <Typography 
              variant="caption" 
              sx={{ 
                fontSize: '0.6rem',
                fontWeight: 600,
                color: isOverAchieving ? 'success.main' : isUnderAchieving ? 'error.main' : 'text.secondary',
                ml: 0.25
              }}
            >
              ({percentage}%)
            </Typography>
          )}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', lineHeight: 1 }}>
          🎯 Enquiries
        </Typography>
      </Box>
    );
  };

  // Planned vs Actual Orders Template
  const ordersMetricsTemplate = (rowData: Event) => {
    const planned = rowData.plannedOrders || 0;
    const actual = rowData.actualOrders || 0;
    const percentage = planned > 0 ? Math.round((actual / planned) * 100) : 0;
    const isOverAchieving = actual > planned;
    const isUnderAchieving = actual < planned && planned > 0;
    
    return (
      <Box sx={{ py: 0.25 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.125 }}>
          <Typography variant="body2" fontWeight="600" sx={{ fontSize: '0.75rem', lineHeight: 1.1 }}>
            {actual}
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem' }}>
            / {planned}
          </Typography>
          {planned > 0 && (
            <Typography 
              variant="caption" 
              sx={{ 
                fontSize: '0.6rem',
                fontWeight: 600,
                color: isOverAchieving ? 'success.main' : isUnderAchieving ? 'error.main' : 'text.secondary',
                ml: 0.25
              }}
            >
              ({percentage}%)
            </Typography>
          )}
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.65rem', lineHeight: 1 }}>
          🛒 Orders
        </Typography>
      </Box>
    );
  };

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
        value={options.value || []}
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
        value={options.value || []}
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
        value={options.value || []}
        options={eventTypeOptions}
        onChange={(e) => options.filterCallback(e.value)}
        optionLabel="label"
        placeholder="Select Event Types"
        className="p-column-filter"
        style={{ minWidth: '12rem' }}
      />
    );
  };

  // Enquiries filter template
  const enquiriesFilterTemplate = (options: any) => {
    return (
      <InputText
        value={options.value}
        onChange={(e) => options.filterCallback(e.target.value)}
        placeholder="Min enquiries"
        className="p-column-filter"
        style={{ minWidth: '8rem' }}
        type="number"
      />
    );
  };

  // Orders filter template
  const ordersFilterTemplate = (options: any) => {
    return (
      <InputText
        value={options.value}
        onChange={(e) => options.filterCallback(e.target.value)}
        placeholder="Min orders"
        className="p-column-filter"
        style={{ minWidth: '8rem' }}
        type="number"
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
    <PrimeReactProvider>
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
              value={events}
              paginator
              rows={10}
              rowsPerPageOptions={[10, 25, 50, 100]}
              paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
              currentPageReportTemplate="Showing {first} to {last} of {totalRecords} events"
              globalFilterFields={['title', 'description', 'branch.name', 'status', 'eventType.name', 'location', 'plannedEnquiries', 'actualEnquiries', 'plannedOrders', 'actualOrders']}
              filters={filters}
              onFilter={(e) => {
                setFilters(e.filters);
              }}
              onValueChange={(filteredData) => {
                console.log('DataTable onValueChange:', { 
                  type: typeof filteredData, 
                  isArray: Array.isArray(filteredData),
                  length: filteredData?.length,
                  data: filteredData 
                });
                setFilteredEvents(filteredData || []);
              }}
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
              exportFilename={`events_${new Date().toISOString().split('T')[0]}`}
              ref={dt}
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
                  header="Start Date"
                  body={dateTemplate}
                  sortable 
                  filter 
                  filterElement={(options) => <Calendar value={options.value} onChange={(e) => options.filterCallback(e.value)} dateFormat="mm/dd/yy" placeholder="mm/dd/yyyy" />}
                  style={{ minWidth: '7rem', maxWidth: '9rem' }}
                  headerStyle={{ fontWeight: 600 }}
                />
              )}
              
              {visibleColumns.startDate && (
                <Column 
                  field="endDate" 
                  header="End Date"
                  body={(rowData) => new Date(rowData.endDate).toLocaleDateString()}
                  sortable 
                  style={{ minWidth: '6rem', maxWidth: '8rem' }}
                  headerStyle={{ fontWeight: 600 }}
                  hidden={true}
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
              
              {visibleColumns.enquiriesMetrics && (
                <Column 
                  field="plannedEnquiries" 
                  header="Planned Enquiries"
                  body={(rowData) => rowData.plannedEnquiries || 0}
                  sortable 
                  dataType="numeric"
                  style={{ minWidth: '6rem', maxWidth: '8rem' }}
                  headerStyle={{ fontWeight: 600 }}
                  hidden={true}
                />
              )}
              
              {visibleColumns.enquiriesMetrics && (
                <Column 
                  field="actualEnquiries" 
                  header="Actual Enquiries"
                  body={(rowData) => rowData.actualEnquiries || 0}
                  sortable 
                  filter
                  filterElement={enquiriesFilterTemplate}
                  dataType="numeric"
                  style={{ minWidth: '6rem', maxWidth: '8rem' }}
                  headerStyle={{ fontWeight: 600 }}
                  hidden={true}
                />
              )}
              
              {visibleColumns.enquiriesMetrics && (
                <Column 
                  field="actualEnquiries" 
                  header="Enquiries (A/P)"
                  body={enquiriesMetricsTemplate}
                  sortable 
                  filter
                  filterElement={enquiriesFilterTemplate}
                  dataType="numeric"
                  style={{ minWidth: '6rem', maxWidth: '8rem' }}
                  headerStyle={{ fontWeight: 600 }}
                />
              )}
              
              {visibleColumns.ordersMetrics && (
                <Column 
                  field="plannedOrders" 
                  header="Planned Orders"
                  body={(rowData) => rowData.plannedOrders || 0}
                  sortable 
                  dataType="numeric"
                  style={{ minWidth: '6rem', maxWidth: '8rem' }}
                  headerStyle={{ fontWeight: 600 }}
                  hidden={true}
                />
              )}

              {visibleColumns.ordersMetrics && (
                <Column 
                  field="actualOrders" 
                  header="Actual Orders"
                  body={(rowData) => rowData.actualOrders || 0}
                  sortable 
                  filter
                  filterElement={ordersFilterTemplate}
                  dataType="numeric"
                  style={{ minWidth: '6rem', maxWidth: '8rem' }}
                  headerStyle={{ fontWeight: 600 }}
                  hidden={true}
                />
              )}

              {visibleColumns.ordersMetrics && (
                <Column 
                  field="actualOrders" 
                  header="Orders (A/P)"
                  body={ordersMetricsTemplate}
                  sortable 
                  filter
                  filterElement={ordersFilterTemplate}
                  dataType="numeric"
                  style={{ minWidth: '6rem', maxWidth: '8rem' }}
                  headerStyle={{ fontWeight: 600 }}
                />
              )}
            </DataTable>
          </StyledDataTableWrapper>
        </Paper>
      </Box>
    </PrimeReactProvider>
  );
};

export default Events; 