import React, { useState, useContext } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Box,
  CssBaseline,
  IconButton,
  Toolbar,
  Typography,
  useTheme,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  alpha,
  Tooltip,
} from '@mui/material';
import {
  Person as PersonIcon,
  Logout as LogoutIcon,
  PowerSettingsNew as PowerIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
} from '@mui/icons-material';
import { AuthContext } from '../App';
import { useThemeContext } from '../config/theme';
import { useUser } from '../contexts/UserContext';
import ToyotaLogo from '../assets/images/toyota-logo.svg';

const HomeLayout = () => {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  
  const theme = useTheme();
  const navigate = useNavigate();
  const { setIsAuthenticated } = useContext(AuthContext);
  const { isDarkMode, toggleTheme } = useThemeContext();
  const { currentUser, logout, loading: userLoading } = useUser();

  const handleProfileMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    setIsAuthenticated(false);
    navigate('/login');
    handleProfileMenuClose();
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

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <CssBaseline />
      
      {/* Top AppBar */}
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
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
          {/* Left Section - Logo and Branding */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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
            <Box>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 'bold', 
                  color: theme.palette.text.primary,
                  fontSize: '1.1rem',
                  lineHeight: 1.2
                }}
              >
                Toyota Enterprise Portal
              </Typography>
              <Typography 
                variant="caption" 
                color="text.secondary"
                display="block"
                sx={{ lineHeight: 1 }}
              >
                Application Launcher
              </Typography>
            </Box>
          </Box>

          {/* Right Section - Theme Toggle + Profile */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {/* Theme Toggle */}
            <Tooltip title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              <IconButton onClick={toggleTheme} color="inherit">
                {isDarkMode ? <LightModeIcon /> : <DarkModeIcon />}
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

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          mt: '64px',
          minHeight: 'calc(100vh - 64px)',
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
    </Box>
  );
};

export default HomeLayout; 