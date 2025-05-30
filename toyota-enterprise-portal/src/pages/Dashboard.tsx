import React, { useState, useEffect } from 'react';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  LinearProgress,
  Tooltip,
  Stack,
  Alert,
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  SelectChangeEvent,
} from '@mui/material';
import {
  Event as EventIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  CurrencyRupee as RupeeIcon,
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  TrendingFlat as TrendingFlatIcon,
  BarChart as BarChartIcon,
  Analytics as AnalyticsIcon,
} from '@mui/icons-material';
import { api } from '../config/api';
import { formatINR } from '../utils/format';
import { useUser } from '../contexts/UserContext';

interface SummaryCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color?: string;
}

interface DashboardSummary {
  totalEvents: number;
  totalUsers: number;
  totalBranches: number;
  totalEventCost: number;
  upcomingEvents: number;
  totalPlannedEventCost: number;
  totalActualEventCost: number;
  totalPlannedEnquiries: number;
  totalActualEnquiries: number;
  totalPlannedOrders: number;
  totalActualOrders: number;
}

interface Branch {
  id: string;
  name: string;
  location: string;
}

const SummaryCard: React.FC<SummaryCardProps> = ({ title, value, icon, color = '#1976d2' }) => (
  <Card sx={{ 
    height: '100%', 
    transition: 'all 0.3s ease',
    '&:hover': { 
      transform: 'translateY(-4px)',
      boxShadow: '0 8px 25px rgba(0,0,0,0.15)'
    },
    backgroundColor: 'background.paper',
    border: (theme) => `1px solid ${theme.palette.divider}`
  }}>
    <CardContent sx={{ p: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" color="text.secondary" gutterBottom sx={{ fontWeight: 500, mb: 0.5 }}>
            {title}
          </Typography>
          <Typography variant="h4" component="div" fontWeight="700" color="text.primary" sx={{ mb: 0 }}>
            {value}
          </Typography>
        </Box>
        <Box sx={{ 
          p: 1.5, 
          borderRadius: '12px', 
          backgroundColor: `${color}15`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {React.cloneElement(icon as React.ReactElement, { 
            sx: { fontSize: 28, color: color }
          })}
        </Box>
      </Box>
    </CardContent>
  </Card>
);

const getTrendIcon = (actual: number, planned: number, isReversed: boolean = false) => {
  if (planned === 0) return <TrendingFlatIcon sx={{ color: '#9e9e9e' }} />;
  
  const percentage = (actual / planned) * 100;
  const isGood = isReversed ? percentage <= 100 : percentage >= 90;
  
  if (percentage > planned) {
    return <TrendingUpIcon sx={{ color: isGood ? '#4caf50' : '#f44336' }} />;
  } else if (percentage < planned) {
    return <TrendingDownIcon sx={{ color: isGood ? '#4caf50' : '#f44336' }} />;
  }
  return <TrendingFlatIcon sx={{ color: '#ff9800' }} />;
};

const getProgressColor = (percentage: number, isReversed: boolean = false): 'success' | 'info' | 'warning' | 'error' => {
  if (isReversed) {
    // For event cost metrics where lower is better
    if (percentage <= 90) return 'success';
    if (percentage <= 100) return 'info';
    if (percentage <= 110) return 'warning';
    return 'error';
  } else {
    // For performance metrics where higher is better
    if (percentage >= 90) return 'success';
    if (percentage >= 75) return 'info';
    if (percentage >= 50) return 'warning';
    return 'error';
  }
};

const colorMap = {
  success: { main: '#4caf50', light: '#e8f5e9' },
  error: { main: '#f44336', light: '#ffebee' },
  warning: { main: '#ff9800', light: '#fff3e0' },
  info: { main: '#2196f3', light: '#e3f2fd' }
};

const calculatePercentage = (actual: number, planned: number): number => {
  if (planned === 0) return 0;
  return Math.round((actual / planned) * 100);
};

const safeCalculate = (numerator: number, denominator: number, defaultValue: number = 0): number => {
  if (denominator === 0 || !denominator) return defaultValue;
  return numerator / denominator;
};

const MetricRow: React.FC<{
  label: string;
  planned: number;
  actual: number;
  isCurrency?: boolean;
  isReversed?: boolean;
}> = ({ label, planned, actual, isCurrency = false, isReversed = false }) => {
  const percentage = calculatePercentage(actual, planned);
  const format = isCurrency ? formatINR : (num: number) => num.toLocaleString();
  const status = getProgressColor(percentage, isReversed);
  const colors = colorMap[status];

  return (
    <Box sx={{ mb: 2, p: 1.5, borderRadius: 2, backgroundColor: colors.light, border: `1px solid ${colors.main}20` }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1.5 }}>
        <Typography variant="subtitle1" fontWeight="600" color="#666666" sx={{ fontSize: '0.875rem' }}>
          {label}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Typography variant="h6" color={colors.main} fontWeight="700" sx={{ fontSize: '1rem' }}>
            {format(actual)}
          </Typography>
          <Tooltip title={`${percentage}% of target`}>
            {getTrendIcon(actual, planned, isReversed)}
          </Tooltip>
        </Box>
      </Box>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
        <LinearProgress 
          variant="determinate" 
          value={Math.min(percentage, 100)} 
          sx={{ 
            flexGrow: 1, 
            height: 8, 
            borderRadius: 4,
            backgroundColor: 'rgba(0,0,0,0.1)',
            '& .MuiLinearProgress-bar': {
              backgroundColor: colors.main,
              borderRadius: 4
            }
          }}
        />
        <Typography variant="body2" fontWeight="600" color={colors.main} sx={{ minWidth: 45, fontSize: '0.75rem' }}>
          {percentage}%
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
          Target: {format(planned)}
        </Typography>
        <Typography variant="caption" color={colors.main} fontWeight="600" sx={{ fontSize: '0.7rem' }}>
          {percentage}% | {
            isReversed ? 
            (actual > planned ? 'Over Cost' : actual < planned ? 'Under Cost' : 'On Cost') : 
            (actual >= planned ? 'Target Met' : 'Below Target')
          }
        </Typography>
      </Box>
    </Box>
  );
};

const StatsTable: React.FC<{
  data: { label: string; value: string | number }[];
}> = ({ data }) => (
  <Box sx={{ backgroundColor: 'action.hover', borderRadius: 2, p: 2 }}>
    <Table size="small">
      <TableBody>
        {data.map((row, index) => (
          <TableRow key={index} sx={{ '&:last-child td': { border: 0 } }}>
            <TableCell sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}`, pl: 0, py: 1 }}>
              <Typography variant="body2" color="text.secondary" fontWeight="500">
                {row.label}
              </Typography>
            </TableCell>
            <TableCell align="right" sx={{ borderBottom: (theme) => `1px solid ${theme.palette.divider}`, pr: 0, py: 1 }}>
              <Typography variant="body2" fontWeight="700" color="text.primary">
                {row.value}
              </Typography>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  </Box>
);

const AnalysisCard: React.FC<{
  title: string;
  value: string | number;
  subtitle?: string;
  trend?: 'up' | 'down' | 'flat';
  color?: 'success' | 'error' | 'warning' | 'info';
}> = ({ title, value, subtitle, trend, color = 'info' }) => {
  const colors = colorMap[color];

  const getTrendIconByType = () => {
    switch(trend) {
      case 'up': return <TrendingUpIcon sx={{ color: colors.main, fontSize: 18 }} />;
      case 'down': return <TrendingDownIcon sx={{ color: colors.main, fontSize: 18 }} />;
      default: return <TrendingFlatIcon sx={{ color: colors.main, fontSize: 18 }} />;
    }
  };

  return (
    <Card variant="outlined" sx={{ 
      p: 1.5, 
      height: '100%',
      backgroundColor: colors.light,
      border: `1px solid ${colors.main}40`,
      transition: 'all 0.2s ease',
      '&:hover': {
        transform: 'translateY(-2px)',
        boxShadow: `0 4px 12px ${colors.main}20`
      }
    }}>
      <Typography variant="subtitle2" color="#666666" gutterBottom sx={{ fontWeight: 600, fontSize: '0.75rem', mb: 0.5 }}>
        {title}
      </Typography>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
        <Typography variant="h5" color={colors.main} fontWeight="700">
          {value}
        </Typography>
        {trend && getTrendIconByType()}
      </Stack>
      {subtitle && (
        <Typography variant="caption" color="#666666" sx={{ fontWeight: 500, fontSize: '0.7rem' }}>
          {subtitle}
        </Typography>
      )}
    </Card>
  );
};

const Dashboard = () => {
  const [summary, setSummary] = useState<DashboardSummary>({
    totalEvents: 0,
    totalUsers: 0,
    totalBranches: 0,
    totalEventCost: 0,
    upcomingEvents: 0,
    totalPlannedEventCost: 0,
    totalActualEventCost: 0,
    totalPlannedEnquiries: 0,
    totalActualEnquiries: 0,
    totalPlannedOrders: 0,
    totalActualOrders: 0
  });
  const [loading, setLoading] = useState(true);
  const [sectionLoading, setSectionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [selectedBranch, setSelectedBranch] = useState<string>('all');

  // Get the selected branch name
  const getSelectedBranchName = () => {
    if (selectedBranch === 'all') return 'All Branches';
    const branch = branches.find(b => b.id === selectedBranch);
    return branch ? branch.name : 'Unknown Branch';
  };

  const handleBranchChange = async (event: SelectChangeEvent) => {
    const branchId = event.target.value;
    setSelectedBranch(branchId);
    setSectionLoading(true);
    await fetchDashboardData(branchId);
    setSectionLoading(false);
  };

  const fetchDashboardData = async (branchId: string) => {
    try {
      setLoading(true);
      setError(null);
      
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const headers = { Authorization: `Bearer ${token}` };
      const branchParam = branchId === 'all' ? '' : `?branchId=${branchId}`;

      console.log('Fetching data for branch:', branchId);
      console.log('API URLs:', {
        summary: `http://localhost:8080/api/dashboard/summary${branchParam}`,
      });

      const [summaryRes] = await Promise.all([
        api.get(`/dashboard/summary${branchParam}`, { headers }),
      ]);

      console.log('Summary response:', summaryRes.data);

      // Map backend field names to frontend interface names
      const mappedSummary = {
        ...summaryRes.data,
        totalEventCost: parseFloat(summaryRes.data.totalBudget || '0'),
        totalPlannedEventCost: parseFloat(summaryRes.data.totalPlannedBudget || '0'),
        totalActualEventCost: parseFloat(summaryRes.data.totalActualBudget || '0')
      };

      setSummary(mappedSummary);
    } catch (error: any) {
      console.error("Error fetching dashboard data:", error);
      setError(error.response?.data?.message || error.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const fetchBranches = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        throw new Error('No authentication token found');
      }
      
      const headers = { Authorization: `Bearer ${token}` };
      const response = await api.get('/branches', { headers });
      setBranches(response.data);
    } catch (error: any) {
      console.error('Error fetching branches:', error);
      setError(error.response?.data?.message || error.message || 'Failed to load branches');
    }
  };

  useEffect(() => {
    const initializeDashboard = async () => {
      await Promise.all([
        fetchBranches(),
        fetchDashboardData('all')
      ]);
    };

    initializeDashboard();
  }, []);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '50vh' }}>
        <CircularProgress size={60} />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      </Box>
    );
  }

  // Safe calculations for all derived metrics
  const budgetVariance = summary.totalPlannedEventCost - summary.totalActualEventCost;
  const avgCostPerEvent = safeCalculate(summary.totalActualEventCost, summary.totalEvents);
  const budgetEfficiency = safeCalculate(summary.totalActualOrders, summary.totalActualEventCost, 0) * 100000;
  const costPerEnquiry = safeCalculate(summary.totalActualEventCost, summary.totalActualEnquiries);
  const costPerOrder = safeCalculate(summary.totalActualEventCost, summary.totalActualOrders);
  
  // Conversion rates (fixed calculations)
  const eventToEnquiryRate = safeCalculate(summary.totalActualEnquiries, summary.totalEvents) * 100;
  const enquiryToOrderRate = safeCalculate(summary.totalActualOrders, summary.totalActualEnquiries) * 100;
  const overallConversionRate = safeCalculate(summary.totalActualOrders, summary.totalEvents) * 100;
  
  // Per event metrics
  const ordersPerEvent = safeCalculate(summary.totalActualOrders, summary.totalEvents);
  const enquiriesPerEvent = safeCalculate(summary.totalActualEnquiries, summary.totalEvents);

  // Achievement percentages
  const enquiryAchievement = calculatePercentage(summary.totalActualEnquiries, summary.totalPlannedEnquiries);
  const orderAchievement = calculatePercentage(summary.totalActualOrders, summary.totalPlannedOrders);
  const budgetUtilization = calculatePercentage(summary.totalActualEventCost, summary.totalPlannedEventCost);

  return (
    <Box sx={{ p: 2, backgroundColor: 'background.default', minHeight: '100vh' }}>
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
        <Typography variant="h4" fontWeight={700} color="text.primary">
          Dashboard Overview
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 500 }}>
            Viewing data for:
          </Typography>
          <FormControl sx={{ minWidth: 250 }}>
            <InputLabel id="branch-select-label">Select Branch</InputLabel>
            <Select
              labelId="branch-select-label"
              id="branch-select"
              value={selectedBranch}
              label="Select Branch"
              onChange={handleBranchChange}
              sx={{
                backgroundColor: 'background.paper',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'divider',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: 'primary.main',
                },
              }}
            >
              <MenuItem value="all">All Branches</MenuItem>
              {branches.map((branch) => (
                <MenuItem key={branch.id} value={branch.id}>
                  {branch.name} - {branch.location}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      </Box>

      {/* Loading overlay for section updates */}
      {sectionLoading && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: (theme) => theme.palette.mode === 'dark' ? 'rgba(0, 0, 0, 0.7)' : 'rgba(255, 255, 255, 0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
        >
          <CircularProgress size={60} />
        </Box>
      )}

      {/* Summary Section */}
      <Typography variant="h5" gutterBottom sx={{ mb: 1.5, fontWeight: 700, color: 'primary.main' }}>
        Summary - {getSelectedBranchName()}
      </Typography>

      {/* Summary Cards */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Total Events"
            value={summary.totalEvents.toLocaleString()}
            icon={<EventIcon />}
            color="#e91e63"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Total Users"
            value={summary.totalUsers.toLocaleString()}
            icon={<PeopleIcon />}
            color="#e91e63"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Total Branches"
            value={summary.totalBranches.toLocaleString()}
            icon={<BusinessIcon />}
            color="#e91e63"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <SummaryCard
            title="Total Spent"
            value={formatINR(summary.totalEventCost)}
            icon={<RupeeIcon />}
            color="#e91e63"
          />
        </Grid>
      </Grid>

      {/* Event Cost Section - Overview and Analysis */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {/* Event Cost Overview */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', backgroundColor: 'background.paper', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, fontWeight: 700 }}>
                <RupeeIcon />
                Event Cost Overview - {getSelectedBranchName()}
              </Typography>
              
              <MetricRow
                label="Event Cost Utilization"
                planned={summary.totalPlannedEventCost}
                actual={summary.totalActualEventCost}
                isCurrency={true}
                isReversed={true}
              />
              
              <StatsTable 
                data={[
                  { label: 'Total Planned Event Cost', value: formatINR(summary.totalPlannedEventCost) },
                  { label: 'Total Actual Event Cost', value: formatINR(summary.totalActualEventCost) },
                  { 
                    label: 'Cost Status', 
                    value: `${summary.totalActualEventCost > summary.totalPlannedEventCost ? 'Over' : 'Under'} by ${formatINR(Math.abs(budgetVariance))}` 
                  }
                ]} 
              />
            </CardContent>
          </Card>
        </Grid>

        {/* Event Cost Analysis */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', backgroundColor: 'background.paper', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, fontWeight: 700 }}>
                <BarChartIcon />
                Event Cost Analysis - {getSelectedBranchName()}
              </Typography>
              
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <AnalysisCard
                    title="Cost Utilization"
                    value={`${budgetUtilization}%`}
                    color={budgetUtilization <= 100 ? 'success' : 'error'}
                    trend={budgetUtilization <= 100 ? 'down' : 'up'}
                  />
                </Grid>
                <Grid item xs={6}>
                  <AnalysisCard
                    title="Average Cost per Event"
                    value={formatINR(avgCostPerEvent)}
                    color="info"
                  />
                </Grid>
              </Grid>

              <Box>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700, mb: 1.5, color: 'text.primary' }}>
                  Event Cost Insights
                </Typography>
                <StatsTable 
                  data={[
                    { label: 'Avg Cost per Event', value: formatINR(avgCostPerEvent) },
                    { 
                      label: 'Cost Efficiency', 
                      value: `${budgetEfficiency.toFixed(2)} orders per lakh`
                    },
                    { label: 'Cost per Enquiry', value: formatINR(costPerEnquiry) },
                    { label: 'Cost per Order', value: formatINR(costPerOrder) }
                  ]} 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Performance Section - Metrics and Analysis */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        {/* Performance Metrics */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', backgroundColor: 'background.paper', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, fontWeight: 700 }}>
                <TrendingUpIcon />
                Performance Metrics - {getSelectedBranchName()}
              </Typography>

              <MetricRow
                label="Enquiries"
                planned={summary.totalPlannedEnquiries}
                actual={summary.totalActualEnquiries}
              />

              <MetricRow
                label="Orders"
                planned={summary.totalPlannedOrders}
                actual={summary.totalActualOrders}
              />

              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 700, mb: 1.5, color: 'text.primary' }}>
                  Detailed Statistics
                </Typography>
                <StatsTable 
                  data={[
                    { label: 'Total Planned Enquiries', value: summary.totalPlannedEnquiries.toLocaleString() },
                    { label: 'Total Actual Enquiries', value: summary.totalActualEnquiries.toLocaleString() },
                    { label: 'Total Planned Orders', value: summary.totalPlannedOrders.toLocaleString() },
                    { label: 'Total Actual Orders', value: summary.totalActualOrders.toLocaleString() }
                  ]} 
                />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Performance Analysis */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', backgroundColor: 'background.paper', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}>
            <CardContent sx={{ p: 2 }}>
              <Typography variant="h6" color="primary" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2, fontWeight: 700 }}>
                <AnalyticsIcon />
                Performance Analysis - {getSelectedBranchName()}
              </Typography>
              
              <Typography variant="subtitle2" gutterBottom color="text.primary" sx={{ mb: 1.5, fontWeight: 600 }}>
                Conversion Funnel
              </Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={4}>
                  <AnalysisCard
                    title="Event to Enquiry"
                    value={`${Math.round(eventToEnquiryRate)}%`}
                    color={eventToEnquiryRate > 50 ? 'success' : 'error'}
                    trend={eventToEnquiryRate > 50 ? 'up' : 'down'}
                  />
                </Grid>
                <Grid item xs={4}>
                  <AnalysisCard
                    title="Enquiry to Order"
                    value={`${Math.round(enquiryToOrderRate)}%`}
                    color={enquiryToOrderRate > 30 ? 'success' : 'error'}
                    trend={enquiryToOrderRate > 30 ? 'up' : 'down'}
                  />
                </Grid>
                <Grid item xs={4}>
                  <AnalysisCard
                    title="Overall Conversion"
                    value={`${Math.round(overallConversionRate)}%`}
                    color={overallConversionRate > 15 ? 'success' : 'error'}
                    trend={overallConversionRate > 15 ? 'up' : 'down'}
                  />
                </Grid>
              </Grid>

              <Typography variant="subtitle2" gutterBottom color="text.primary" sx={{ mb: 1.5, fontWeight: 600 }}>
                Efficiency Metrics
              </Typography>
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={6}>
                  <AnalysisCard
                    title="Orders per Event"
                    value={ordersPerEvent.toFixed(1)}
                    subtitle="Target: 2.0 orders/event"
                    color={ordersPerEvent > 2 ? 'success' : 'error'}
                    trend={ordersPerEvent > 2 ? 'up' : 'down'}
                  />
                </Grid>
                <Grid item xs={6}>
                  <AnalysisCard
                    title="Enquiries per Event"
                    value={enquiriesPerEvent.toFixed(1)}
                    subtitle="Target: 5.0 enquiries/event"
                    color={enquiriesPerEvent > 5 ? 'success' : 'error'}
                    trend={enquiriesPerEvent > 5 ? 'up' : 'down'}
                  />
                </Grid>
              </Grid>

              <Typography variant="subtitle2" gutterBottom color="text.primary" sx={{ mb: 1.5, fontWeight: 600 }}>
                Target Achievement
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <AnalysisCard
                    title="Enquiry Achievement"
                    value={`${enquiryAchievement}%`}
                    subtitle={`Target: ${summary.totalPlannedEnquiries.toLocaleString()} enquiries`}
                    color={enquiryAchievement >= 90 ? 'success' : enquiryAchievement >= 75 ? 'warning' : 'error'}
                    trend={enquiryAchievement >= 90 ? 'up' : 'down'}
                  />
                </Grid>
                <Grid item xs={6}>
                  <AnalysisCard
                    title="Order Achievement"
                    value={`${orderAchievement}%`}
                    subtitle={`Target: ${summary.totalPlannedOrders.toLocaleString()} orders`}
                    color={orderAchievement >= 90 ? 'success' : orderAchievement >= 75 ? 'warning' : 'error'}
                    trend={orderAchievement >= 90 ? 'up' : 'down'}
                  />
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;