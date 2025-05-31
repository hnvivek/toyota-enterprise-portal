import React from 'react';
import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { useUser } from '../contexts/UserContext';
import PendingApprovals from '../components/dashboard/PendingApprovals';

const PendingApprovalsPage = () => {
  const navigate = useNavigate();
  const { currentUser } = useUser();

  // Refresh badges when user navigates away from the page
  useEffect(() => {
    let hasViewedPage = false;
    
    // Mark that user has viewed the page after a short delay
    const viewTimer = setTimeout(() => {
      hasViewedPage = true;
      console.log('User has viewed the Pending Approvals page');
    }, 500); // 500ms - reasonable time to ensure they actually viewed the page

    const refreshBadges = async () => {
      // Only refresh badges if user actually viewed the page
      if (!hasViewedPage) {
        console.log('User left too quickly, not refreshing badges');
        return;
      }

      try {
        if ((window as any).refreshBadges) {
          console.log('Refreshing badges after leaving pending approvals page...');
          await (window as any).refreshBadges();
        }
      } catch (error) {
        console.error('Error refreshing badges:', error);
      }
    };

    // Handle browser tab/window close
    const handleBeforeUnload = () => {
      if (hasViewedPage && (window as any).refreshBadges) {
        (window as any).refreshBadges();
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup function - only runs when component unmounts (user navigates away)
    return () => {
      clearTimeout(viewTimer);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      // Only refresh badges if user actually viewed the page
      refreshBadges();
    };
  }, []);

  return (
    <Box sx={{ p: 3 }}>
      {/* Breadcrumbs */}
      <Breadcrumbs sx={{ mb: 3 }}>
        <Link 
          color="inherit" 
          href="#" 
          onClick={(e) => {
            e.preventDefault();
            navigate('/dashboard');
          }}
          sx={{ cursor: 'pointer' }}
        >
          Dashboard
        </Link>
        <Typography color="text.primary">Pending Approvals</Typography>
      </Breadcrumbs>

      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" gutterBottom>
          Pending Approvals
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Review and approve events waiting for your authorization
        </Typography>
      </Box>

      {/* PendingApprovals Component */}
      <PendingApprovals />
    </Box>
  );
};

export default PendingApprovalsPage; 