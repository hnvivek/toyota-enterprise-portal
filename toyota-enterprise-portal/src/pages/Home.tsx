import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Box,
  Typography,
  Grid,
  Card,
  CardContent,
  CardActionArea,
  Avatar,
  useTheme,
  Chip,
  Divider,
} from '@mui/material';
import {
  Campaign as MarketingIcon,
  School as TrainingIcon,
  ArrowForward as ArrowIcon,
  CheckCircle as AvailableIcon,
  Schedule as ComingSoonIcon,
} from '@mui/icons-material';
import { useUser } from '../contexts/UserContext';

const Home = () => {
  const navigate = useNavigate();
  const theme = useTheme();
  const { currentUser } = useUser();

  const applications = [
    {
      id: 'marketing',
      title: 'Marketing',
      description: 'Event management and campaign analytics',
      icon: <MarketingIcon sx={{ fontSize: 32 }} />,
      path: '/marketing/dashboard',
      available: true,
    },
    {
      id: 'training',
      title: 'Training',
      description: 'Learning programs and certifications',
      icon: <TrainingIcon sx={{ fontSize: 32 }} />,
      path: '/training',
      available: false,
    }
  ];

  const handleApplicationClick = (app: any) => {
    if (app.available) {
      navigate(app.path);
    }
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: 'background.default',
      py: { xs: 3, sm: 4, md: 6 }
    }}>
      <Container maxWidth="lg">
        {/* Welcome Header */}
        <Box sx={{ mb: { xs: 4, sm: 5, md: 6 } }}>
          <Typography 
            variant="h3" 
            sx={{ 
              fontWeight: 700,
              mb: 1,
              color: 'text.primary',
              fontSize: { xs: '1.75rem', sm: '2.25rem', md: '2.5rem' }
            }}
          >
            My Apps
          </Typography>
          <Typography 
            variant="h6" 
            color="text.secondary" 
            sx={{ 
              mb: 3,
              fontWeight: 400,
              fontSize: { xs: '1rem', sm: '1.125rem' }
            }}
          >
            Hello{' '}
            <Box component="span" sx={{ color: 'primary.main', fontWeight: 600 }}>
              {currentUser?.username}
            </Box>
            ! Select an application to continue
          </Typography>
        </Box>

        {/* Application Grid */}
        <Grid container spacing={3} sx={{ mb: 6 }}>
          {applications.map((app) => (
            <Grid item xs={12} sm={6} lg={4} key={app.id}>
              <Card
                sx={{
                  height: '100%',
                  border: `1px solid ${theme.palette.divider}`,
                  borderRadius: 3,
                  transition: 'all 0.2s ease-in-out',
                  cursor: app.available ? 'pointer' : 'default',
                  bgcolor: 'background.paper',
                  '&:hover': app.available ? {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                    borderColor: theme.palette.primary.main,
                  } : {
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  },
                  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                  opacity: app.available ? 1 : 0.7,
                }}
              >
                <CardActionArea
                  onClick={() => handleApplicationClick(app)}
                  disabled={!app.available}
                  sx={{ 
                    height: '100%',
                    p: 0,
                    '&.Mui-disabled': {
                      opacity: 1
                    }
                  }}
                >
                  <CardContent sx={{ 
                    p: 3,
                    height: '100%', 
                    display: 'flex', 
                    flexDirection: 'column',
                  }}>
                    {/* Header with Icon and Status */}
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'flex-start', 
                      justifyContent: 'space-between',
                      mb: 3 
                    }}>
                      <Avatar
                        sx={{
                          width: 48,
                          height: 48,
                          bgcolor: app.available 
                            ? theme.palette.primary.main + '1A'
                            : theme.palette.grey[500] + '1A',
                          color: app.available 
                            ? theme.palette.primary.main 
                            : theme.palette.grey[500],
                        }}
                      >
                        {app.icon}
                      </Avatar>
                      
                      <Chip
                        icon={app.available ? <AvailableIcon /> : <ComingSoonIcon />}
                        label={app.available ? 'Available' : 'Coming Soon'}
                        size="small"
                        sx={{
                          bgcolor: app.available 
                            ? theme.palette.success.main + '1A'
                            : theme.palette.warning.main + '1A',
                          color: app.available 
                            ? theme.palette.success.main 
                            : theme.palette.warning.main,
                          fontWeight: 600,
                          borderRadius: 2,
                        }}
                      />
                    </Box>

                    {/* App Title */}
                    <Typography
                      variant="h5"
                      sx={{
                        fontWeight: 700,
                        color: 'text.primary',
                        mb: 1,
                        fontSize: '1.25rem'
                      }}
                    >
                      {app.title}
                    </Typography>

                    {/* App Description */}
                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{ mb: 'auto', lineHeight: 1.6 }}
                    >
                      {app.description}
                    </Typography>

                    {/* Action Section */}
                    <Box sx={{ mt: 3 }}>
                      <Divider sx={{ mb: 2 }} />
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: app.available ? 'space-between' : 'center',
                          color: app.available ? 'primary.main' : 'text.disabled',
                        }}
                      >
                        <Typography 
                          variant="button" 
                          sx={{ 
                            fontWeight: 600,
                            fontSize: '0.875rem'
                          }}
                        >
                          {app.available ? 'Launch Application' : 'Coming Soon'}
                        </Typography>
                        {app.available && (
                          <ArrowIcon sx={{ 
                            fontSize: 20,
                            transform: 'translateX(0)',
                            transition: 'transform 0.2s ease',
                            '.MuiCardActionArea-root:hover &': {
                              transform: 'translateX(4px)'
                            }
                          }} />
                        )}
                      </Box>
                    </Box>
                  </CardContent>
                </CardActionArea>
              </Card>
            </Grid>
          ))}
        </Grid>

        {/* Footer Section */}
        <Box sx={{ 
          textAlign: 'center',
          pt: 4,
          borderTop: `1px solid ${theme.palette.divider}`
        }}>
          <Typography variant="body2" color="text.secondary">
            Toyota Enterprise Portal
          </Typography>
        </Box>
      </Container>
    </Box>
  );
};

export default Home; 