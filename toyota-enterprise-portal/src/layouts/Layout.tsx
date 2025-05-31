import React, { useState, useContext, useEffect } from 'react';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  Drawer,
  IconButton,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  useTheme,
  Avatar,
  Badge,
  Menu,
  MenuItem,
  Divider,
  InputBase,
  alpha,
  Breadcrumbs,
  Link,
  Chip,
  Tooltip,
  ListItemButton,
  Collapse,
  Paper,
  Button,
  Fab,
  Dialog,
  DialogTitle,
  DialogContent,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  Event as EventIcon,
  People as PeopleIcon,
  Business as BusinessIcon,
  ShoppingCart as ProductIcon,
  Person as PersonIcon,
  Logout as LogoutIcon,
  PowerSettingsNew as PowerIcon,
  Notifications as NotificationsIcon,
  NotificationsActive as NotificationsActiveIcon,
  Search as SearchIcon,
  Settings as SettingsIcon,
  Help as HelpIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  ExpandLess,
  ExpandMore,
  Analytics as AnalyticsIcon,
  Assessment as ReportsIcon,
  Home as HomeIcon,
  Category as CategoryIcon,
  Add as AddIcon,
} from '@mui/icons-material';
import { AuthContext } from '../App';
import { useThemeContext } from '../config/theme';
import { useUser } from '../contexts/UserContext';
import ToyotaLogo from '../assets/images/toyota-logo.svg';
import { api } from '../config/api';

const drawerWidth = 280;

const Layout = () => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [notificationAnchor, setNotificationAnchor] = useState<null | HTMLElement>(null);
  const [expandedMenus, setExpandedMenus] = useState<{[key: string]: boolean}>({
    'Events': true,
    'Analytics': true,
  });
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [eventBadgeCount, setEventBadgeCount] = useState(0);
  const [pendingApprovalsBadgeCount, setPendingApprovalsBadgeCount] = useState(0);
  
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { setIsAuthenticated } = useContext(AuthContext);
  const { isDarkMode, toggleTheme } = useThemeContext();
  const { currentUser, logout, loading: userLoading } = useUser();

  // Fetch notifications and badge counts
  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };

      console.log('Fetching notifications and badges for user:', currentUser);

      // Fetch notifications
      const notificationResponse = await api.get('/notifications', { headers });
      console.log('Notification response:', notificationResponse.data);
      setNotifications(notificationResponse.data.notifications || []);
      setUnreadNotifications(notificationResponse.data.unreadCount || 0);

      // Fetch separate badge counts
      const badgeResponse = await api.get('/stats/events/badge', { headers });
      console.log('Events badge response:', badgeResponse.data);
      
      // Events badge should only show new events (not pending approvals)
      const newEventsCount = badgeResponse.data.newEvents || 0;
      setEventBadgeCount(newEventsCount);

      // Separate pending approvals badge
      const pendingApprovalsCount = badgeResponse.data.pendingApprovals || 0;
      setPendingApprovalsBadgeCount(pendingApprovalsCount);
      
      console.log('Badge counts:', { 
        newEvents: newEventsCount, 
        pendingApprovals: pendingApprovalsCount 
      });
    } catch (error) {
      console.error('Error fetching notifications/badges:', error);
    }
  };

  // Function to refresh badges immediately (exposed globally)
  const refreshBadges = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) return;

      const headers = { Authorization: `Bearer ${token}` };
      const badgeResponse = await api.get('/stats/events/badge', { headers });
      console.log('Badges refreshed:', badgeResponse.data);
      
      const newEventsCount = badgeResponse.data.newEvents || 0;
      const pendingApprovalsCount = badgeResponse.data.pendingApprovals || 0;
      
      setEventBadgeCount(newEventsCount);
      setPendingApprovalsBadgeCount(pendingApprovalsCount);
    } catch (error) {
      console.error('Error refreshing badges:', error);
    }
  };

  // Make refreshBadges available globally
  useEffect(() => {
    (window as any).refreshEventBadge = refreshBadges; // Keep same name for compatibility
    (window as any).refreshBadges = refreshBadges;
    return () => {
      delete (window as any).refreshEventBadge;
      delete (window as any).refreshBadges;
    };
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
      
      // Refresh every 30 seconds
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleNotificationMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setNotificationAnchor(event.currentTarget);
  };

  const handleNotificationMenuClose = () => {
    setNotificationAnchor(null);
  };

  const handleNotificationClick = async (notification: any) => {
    try {
      const token = localStorage.getItem('token');
      if (token && !notification.isRead) {
        const headers = { Authorization: `Bearer ${token}` };
        await api.put(`/notifications/${notification.id}/read`, {}, { headers });
        
        // Update local state
        setNotifications(prev => 
          prev.map(n => n.id === notification.id ? { ...n, isRead: true } : n)
        );
        setUnreadNotifications(prev => Math.max(0, prev - 1));
      }

      // Navigate to related page if actionUrl exists
      if (notification.actionUrl) {
        navigate(notification.actionUrl);
      }
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
    
    handleNotificationMenuClose();
  };

  const formatNotificationTime = (createdAt: string) => {
    const now = new Date();
    const notificationTime = new Date(createdAt);
    const diffInMinutes = Math.floor((now.getTime() - notificationTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} min ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hour${Math.floor(diffInMinutes / 60) > 1 ? 's' : ''} ago`;
    return `${Math.floor(diffInMinutes / 1440)} day${Math.floor(diffInMinutes / 1440) > 1 ? 's' : ''} ago`;
  };

  const handleLogout = () => {
    logout(); // Use UserContext logout function
    setIsAuthenticated(false);
    navigate('/login');
    handleProfileMenuClose();
  };

  const handleMenuExpand = (menuKey: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [menuKey]: !prev[menuKey]
    }));
  };

  // Helper function to format role labels
  const formatRoleLabel = (role: string) => {
    return role.replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  // Helper function to get user's initials
  const getUserInitials = (username: string) => {
    return username.split(' ').map(name => name.charAt(0).toUpperCase()).join('').slice(0, 2);
  };

  // Helper function to check if user can see pending approvals
  const canSeePendingApprovals = () => {
    return currentUser && ['general_manager', 'marketing_head'].includes(currentUser.role);
  };

  // Helper function to check if user is admin
  const isAdmin = () => {
    return currentUser && currentUser.role === 'admin';
  };

  // Helper function to check if user can create events
  const canCreateEvent = () => {
    return currentUser && ['sales_manager', 'general_manager', 'admin'].includes(currentUser.role);
  };

  const menuItems = [
    { 
      text: 'Dashboard', 
      icon: <DashboardIcon />, 
      path: '/dashboard',
      badge: null,
    },
    { 
      text: 'Events', 
      icon: <EventIcon />, 
      path: '/events', 
      badge: null,
      submenu: [
        { 
          text: 'All Events', 
          path: '/events',
          badge: eventBadgeCount > 0 ? eventBadgeCount : null
        },
        ...(canCreateEvent() ? [{ 
          text: 'Create Event', 
          path: '/events/new',
          badge: null
        }] : []),
        { text: 'Event Calendar', path: '/events/calendar' },
      ]
    },
    ...(canSeePendingApprovals() ? [{
      text: 'Pending Approvals',
      icon: <ReportsIcon />,
      path: '/pending-approvals',
      badge: pendingApprovalsBadgeCount > 0 ? pendingApprovalsBadgeCount : null,
    }] : []),
    { 
      text: 'Analytics', 
      icon: <AnalyticsIcon />, 
      path: '/analytics',
      submenu: [
        { text: 'Overview', path: '/analytics' },
        { text: 'Reports', path: '/analytics/reports' },
        { text: 'Performance', path: '/analytics/performance' },
      ]
    },
    ...(isAdmin() ? [
      { text: 'Event Types', icon: <CategoryIcon />, path: '/event-types', badge: null },
      { text: 'Users', icon: <PeopleIcon />, path: '/users', badge: null },
      { text: 'Branches', icon: <BusinessIcon />, path: '/branches', badge: null },
      { text: 'Products', icon: <ProductIcon />, path: '/products', badge: null },
    ] : [])
  ];

  const secondaryMenuItems = [
    { text: 'Help & Support', icon: <HelpIcon />, path: '/help' },
  ];

  // Generate breadcrumbs from current path
  const getBreadcrumbs = () => {
    const pathnames = location.pathname.split('/').filter(x => x);
    const breadcrumbItems: Array<{ label: string; path: string; icon?: React.ReactElement }> = [
      { label: 'Home', path: '/dashboard', icon: <HomeIcon fontSize="small" /> }
    ];

    pathnames.forEach((pathname, index) => {
      const path = `/${pathnames.slice(0, index + 1).join('/')}`;
      const label = pathname.charAt(0).toUpperCase() + pathname.slice(1);
      breadcrumbItems.push({ label, path });
    });

    return breadcrumbItems;
  };

  const renderMenuItem = (item: any, isSubmenu = false) => {
    const isActive = location.pathname === item.path || 
                    (item.submenu && item.submenu.some((sub: any) => location.pathname === sub.path));
    const hasSubmenu = item.submenu && !isSubmenu;
    const isExpanded = expandedMenus[item.text];

    return (
      <Box key={item.text}>
        <ListItemButton
          onClick={() => {
            if (hasSubmenu) {
              handleMenuExpand(item.text);
            } else {
              navigate(item.path);
              setMobileOpen(false);
            }
          }}
          sx={{
            pl: isSubmenu ? 4 : 2,
            backgroundColor: isActive ? alpha(theme.palette.primary.main, 0.1) : 'transparent',
            borderRight: isActive ? `3px solid ${theme.palette.primary.main}` : 'none',
            '&:hover': {
              backgroundColor: alpha(theme.palette.primary.main, 0.05),
            },
          }}
        >
          <ListItemIcon 
            sx={{ 
              color: isActive ? theme.palette.primary.main : 'inherit',
              minWidth: 40 
            }}
          >
            {item.icon}
          </ListItemIcon>
          <ListItemText 
            primary={item.text}
            sx={{ 
              color: isActive ? theme.palette.primary.main : 'inherit',
              '& .MuiTypography-root': { fontWeight: isActive ? 600 : 400 }
            }}
          />
          {item.badge && (
            <Chip 
              label={item.badge} 
              size="small" 
              color="error" 
              sx={{ height: 20, fontSize: '0.75rem' }}
            />
          )}
          {hasSubmenu && (isExpanded ? <ExpandLess /> : <ExpandMore />)}
        </ListItemButton>
        
        {hasSubmenu && (
          <Collapse in={isExpanded} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              {item.submenu.map((subItem: any) => renderMenuItem(subItem, true))}
            </List>
          </Collapse>
        )}
      </Box>
    );
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Logo and Branding */}
      <Box sx={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        gap: 2, 
        height: 64,
        px: 2,
        borderBottom: `1px solid ${theme.palette.divider}` 
      }}>
        <Box 
          component="img" 
          src={ToyotaLogo} 
          alt="Toyota Logo" 
          sx={{ 
            height: 40, 
            maxWidth: '64px', 
            flexShrink: 0,
            filter: theme.palette.mode === 'dark' 
              ? 'brightness(0) invert(1)' // White in dark mode
              : 'brightness(0) invert(0)'  // Black in light mode
          }}
        />
        <Box sx={{ flexGrow: 0 }}>
          <Typography 
            variant="h6" 
            sx={{ 
              fontWeight: 'bold', 
              color: theme.palette.text.primary,
              fontSize: '1.1rem',
              lineHeight: 1.2
            }}
          >
            Nandi Toyota
          </Typography>
          <Typography 
            variant="caption" 
            color="text.secondary"
            display="block"
            sx={{ lineHeight: 1 }}
          >
            Enterprise Portal
          </Typography>
        </Box>
      </Box>

      {/* Main Navigation */}
      <Box sx={{ flexGrow: 1, overflowY: 'auto' }}>
        <List sx={{ pt: 2 }}>
          {menuItems.map((item) => renderMenuItem(item))}
        </List>

        <Divider sx={{ my: 2 }} />

        {/* Secondary Navigation */}
        <List>
          {secondaryMenuItems.map((item) => renderMenuItem(item))}
        </List>
      </Box>

      {/* User Profile in Sidebar */}
      <Box sx={{ 
        p: 1.5, 
        borderTop: `1px solid ${theme.palette.divider}`,
        bgcolor: theme.palette.background.default
      }}>
        <Box sx={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: 1.5,
          p: 1.5,
          borderRadius: 2,
          bgcolor: theme.palette.background.paper,
          border: `1px solid ${theme.palette.divider}`,
          boxShadow: '0 2px 4px rgba(0,0,0,0.08)',
          transition: 'all 0.2s ease'
        }}>
          <Avatar sx={{ 
            width: 40, 
            height: 40, 
            bgcolor: theme.palette.primary.main,
            fontSize: '0.95rem',
            fontWeight: 700,
            fontFamily: 'monospace'
          }}>
            {userLoading ? 'L' : (currentUser ? getUserInitials(currentUser.username) : 'U')}
          </Avatar>
          
          <Box sx={{ flexGrow: 1, minWidth: 0 }}>
            {/* Username - Clean and readable */}
            <Typography 
              variant="body2" 
              sx={{ 
                fontWeight: 600,
                fontSize: '0.875rem',
                color: 'text.primary',
                mb: 0.25,
                lineHeight: 1.2
              }}
              noWrap
            >
              {userLoading ? (
                <Box component="span" sx={{ fontStyle: 'italic', fontWeight: 400 }}>
                  Loading...
                </Box>
              ) : (
                currentUser ? currentUser.username : 'Not logged in'
              )}
            </Typography>
            
            {/* Role - Compact and clean */}
            <Typography 
              variant="caption" 
              sx={{ 
                fontWeight: 500,
                fontSize: '0.75rem',
                color: theme.palette.primary.main,
                textTransform: 'uppercase',
                letterSpacing: '0.03em',
                lineHeight: 1.1
              }}
              noWrap
            >
              {userLoading ? '' : (currentUser ? formatRoleLabel(currentUser.role) : '')}
            </Typography>
          </Box>
          
          <Tooltip title="Sign Out" placement="top">
            <IconButton 
              size="small"
              onClick={handleLogout}
              disabled={userLoading}
              sx={{ 
                color: 'white',
                bgcolor: userLoading ? 'grey.400' : 'error.main',
                width: 28,
                height: 28,
                '&:hover': { 
                  bgcolor: userLoading ? 'grey.400' : 'error.dark',
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.2s ease'
              }}
            >
              <PowerIcon sx={{ fontSize: 14 }} />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      {/* Top AppBar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'background.paper',
          color: 'text.primary',
          borderBottom: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
          backdropFilter: 'blur(8px)',
          backgroundColor: alpha(theme.palette.background.paper, 0.95),
        }}
      >
        <Toolbar sx={{ 
          justifyContent: 'space-between', 
          px: { xs: 2, sm: 3 }, 
          height: 64, 
          minHeight: 64 
        }}>
          {/* Left Section - Mobile Menu + Breadcrumbs */}
          <Box sx={{ display: 'flex', alignItems: 'center', flex: 1, minWidth: 0 }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{ 
                mr: 2, 
                display: { sm: 'none' },
                '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
              }}
            >
              <MenuIcon />
            </IconButton>

            {/* Modern Breadcrumbs */}
            <Breadcrumbs 
              aria-label="breadcrumb" 
              sx={{ 
                display: { xs: 'none', md: 'flex' },
                '& .MuiBreadcrumbs-separator': {
                  color: alpha(theme.palette.text.primary, 0.4),
                  mx: 1
                }
              }}
            >
              {getBreadcrumbs().map((item, index) => {
                const isLast = index === getBreadcrumbs().length - 1;
                return isLast ? (
                  <Box key={item.path} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    {item.icon}
                    <Typography 
                      variant="body2" 
                      color="text.primary"
                      sx={{ fontWeight: 600, fontSize: '0.875rem' }}
                    >
                      {item.label}
                    </Typography>
                  </Box>
                ) : (
                  <Link
                    key={item.path}
                    underline="hover"
                    color="text.secondary"
                    onClick={() => navigate(item.path)}
                    sx={{ 
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 0.5,
                      '&:hover': { color: 'primary.main' },
                      fontSize: '0.875rem'
                    }}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                );
              })}
            </Breadcrumbs>
          </Box>

          {/* Right Section - Notifications + Profile */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Theme Toggle */}
            <Tooltip title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              <IconButton onClick={toggleTheme} color="inherit">
                {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Tooltip>

            {/* Notifications */}
            <Tooltip title="Notifications">
              <IconButton
                onClick={handleNotificationMenuOpen}
                color="inherit"
                sx={{ 
                  '&:hover': { bgcolor: alpha(theme.palette.primary.main, 0.08) }
                }}
              >
                <Badge badgeContent={unreadNotifications} color="error">
                  {unreadNotifications > 0 ? <NotificationsActiveIcon /> : <NotificationsIcon />}
                </Badge>
              </IconButton>
            </Tooltip>

            {/* Profile Avatar */}
            <Tooltip title="Profile & Settings">
              <IconButton onClick={handleProfileMenuOpen} sx={{ p: 0, ml: 1 }}>
                <Avatar sx={{ 
                  width: 40, 
                  height: 40, 
                  bgcolor: theme.palette.primary.main,
                  border: `2px solid ${alpha(theme.palette.primary.main, 0.1)}`,
                  fontSize: '1rem',
                  fontWeight: 700,
                  fontFamily: 'monospace'
                }}>
                  {userLoading ? 'L' : (currentUser ? getUserInitials(currentUser.username) : 'U')}
                </Avatar>
              </IconButton>
            </Tooltip>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Navigation Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
        aria-label="navigation folders"
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>
        
        {/* Desktop Navigation Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { 
              boxSizing: 'border-box', 
              width: drawerWidth,
              borderRight: `1px solid ${alpha(theme.palette.divider, 0.12)}`,
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 0,
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: '64px',
          minHeight: 'calc(100vh - 64px)',
          backgroundColor: theme.palette.background.default,
        }}
      >
        <Outlet />
      </Box>

      {/* Profile Menu */}
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleProfileMenuClose}
        onClick={handleProfileMenuClose}
        PaperProps={{
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            minWidth: 220,
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 14,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* User Info Header */}
        <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle2" fontWeight="600">
            {currentUser ? currentUser.username : 'User'}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {currentUser ? formatRoleLabel(currentUser.role) : ''}
          </Typography>
        </Box>
        
        <MenuItem onClick={() => navigate('/profile')}>
          <PersonIcon sx={{ mr: 2 }} />
          Profile Settings
        </MenuItem>
        <MenuItem onClick={toggleTheme}>
          {isDarkMode ? <LightModeIcon sx={{ mr: 2 }} /> : <DarkModeIcon sx={{ mr: 2 }} />}
          {isDarkMode ? 'Light Mode' : 'Dark Mode'}
        </MenuItem>
        <Divider />
        <MenuItem onClick={handleLogout} sx={{ color: 'error.main' }}>
          <LogoutIcon sx={{ mr: 2 }} />
          Sign Out
        </MenuItem>
      </Menu>

      {/* Notifications Menu */}
      <Menu
        anchorEl={notificationAnchor}
        open={Boolean(notificationAnchor)}
        onClose={handleNotificationMenuClose}
        PaperProps={{
          sx: {
            overflow: 'visible',
            filter: 'drop-shadow(0px 2px 8px rgba(0,0,0,0.32))',
            mt: 1.5,
            maxWidth: 360,
            maxHeight: 400,
            '&:before': {
              content: '""',
              display: 'block',
              position: 'absolute',
              top: 0,
              right: 40,
              width: 10,
              height: 10,
              bgcolor: 'background.paper',
              transform: 'translateY(-50%) rotate(45deg)',
              zIndex: 0,
            },
          },
        }}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
      >
        {/* Header */}
        <Box sx={{ px: 2, py: 1.5, borderBottom: `1px solid ${theme.palette.divider}` }}>
          <Typography variant="subtitle2" fontWeight="600">
            Notifications ({unreadNotifications} unread)
          </Typography>
        </Box>
        
        {/* Notifications List */}
        {notifications.length === 0 ? (
          <Box sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No notifications
            </Typography>
          </Box>
        ) : (
          <Box sx={{ maxHeight: 300, overflowY: 'auto' }}>
            {notifications.slice(0, 10).map((notification, index) => (
              <MenuItem
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                sx={{
                  py: 1.5,
                  borderBottom: index < 9 ? `1px solid ${alpha(theme.palette.divider, 0.5)}` : 'none',
                  backgroundColor: !notification.isRead ? alpha(theme.palette.primary.main, 0.05) : 'transparent',
                  '&:hover': {
                    backgroundColor: !notification.isRead 
                      ? alpha(theme.palette.primary.main, 0.1) 
                      : alpha(theme.palette.action.hover, 0.5)
                  }
                }}
              >
                <Box sx={{ width: '100%' }}>
                  <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                    {!notification.isRead && (
                      <Box sx={{ 
                        width: 8, 
                        height: 8, 
                        bgcolor: 'primary.main', 
                        borderRadius: '50%',
                        mt: 0.75,
                        flexShrink: 0
                      }} />
                    )}
                    <Box sx={{ flexGrow: 1, minWidth: 0 }}>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          fontWeight: !notification.isRead ? 600 : 400,
                          fontSize: '0.875rem',
                          mb: 0.5
                        }}
                        noWrap
                      >
                        {notification.title}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ 
                          display: 'block',
                          fontSize: '0.75rem',
                          lineHeight: 1.3,
                          mb: 0.5
                        }}
                      >
                        {notification.message}
                      </Typography>
                      <Typography 
                        variant="caption" 
                        color="text.secondary"
                        sx={{ fontSize: '0.7rem' }}
                      >
                        {formatNotificationTime(notification.createdAt)}
                      </Typography>
                    </Box>
                  </Box>
                </Box>
              </MenuItem>
            ))}
          </Box>
        )}
        
        {notifications.length > 10 && (
          <Box sx={{ p: 1, borderTop: `1px solid ${theme.palette.divider}`, textAlign: 'center' }}>
            <Button size="small" onClick={() => navigate('/notifications')}>
              View All Notifications
            </Button>
          </Box>
        )}
      </Menu>
    </Box>
  );
};

export default Layout; 