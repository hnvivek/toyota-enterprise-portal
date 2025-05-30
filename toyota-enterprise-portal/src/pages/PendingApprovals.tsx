import React from 'react';
import { Box, Typography, Breadcrumbs, Link } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import PendingApprovals from '../components/dashboard/PendingApprovals';

const PendingApprovalsPage = () => {
  const navigate = useNavigate();

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