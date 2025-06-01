import React, { useState } from 'react';
import {
  Box,
  Container,
  Typography,
  Card,
  CardContent,
  Button,
  Alert,
  CircularProgress,
  Divider,
  Chip
} from '@mui/material';
import { Refresh, Storage } from '@mui/icons-material';
import { adminService } from '../../services/adminService';

const AdminTools: React.FC = () => {
  const [isSeeding, setIsSeeding] = useState(false);
  const [seedResult, setSeedResult] = useState<{ type: 'success' | 'error', message: string } | null>(null);

  const handleManualSeed = async () => {
    if (!window.confirm('⚠️ WARNING: This will completely reset the database and create fresh test data. All existing data will be lost. Are you sure?')) {
      return;
    }

    setIsSeeding(true);
    setSeedResult(null);

    try {
      const result = await adminService.runManualSeed();
      setSeedResult({ type: 'success', message: result.message });
    } catch (error: any) {
      setSeedResult({ 
        type: 'error', 
        message: error.response?.data?.message || 'Failed to run manual seed'
      });
    } finally {
      setIsSeeding(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom>
        Admin Tools
      </Typography>
      <Typography variant="body1" color="text.secondary" paragraph>
        Administrative tools for development and testing. Use with caution.
      </Typography>

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Box display="flex" alignItems="center" gap={2} mb={2}>
            <Storage color="primary" />
            <Typography variant="h6">Database Management</Typography>
            <Chip label="Development Only" color="warning" size="small" />
          </Box>
          
          <Divider sx={{ my: 2 }} />
          
          <Typography variant="body2" color="text.secondary" paragraph>
            <strong>Manual Seed:</strong> Completely resets the database and creates fresh test data including:
          </Typography>
          
          <Box component="ul" sx={{ color: 'text.secondary', mb: 2 }}>
            <li>5 branches (Digital, Hosur road, Whitefield, KP Road, Qns road)</li>
            <li>6 products (Glanza, Urban Cruiser Hyryder, Taisor, Rumion, Fortuner, Crysta)</li>
            <li>9 event types (Digital Lead Generation, Bank Display, etc.)</li>
            <li>5 users including <strong>priya_sales</strong> (priya.sales@toyota.com / sales123)</li>
            <li>75-90 randomized events (all owned by priya_sales for easy testing)</li>
          </Box>

          <Alert severity="warning" sx={{ mb: 2 }}>
            <strong>WARNING:</strong> This action will permanently delete all existing data. 
            Only use this in development/testing environments.
          </Alert>

          <Button
            variant="contained"
            color="error"
            startIcon={isSeeding ? <CircularProgress size={20} color="inherit" /> : <Refresh />}
            onClick={handleManualSeed}
            disabled={isSeeding}
            sx={{ mt: 1 }}
          >
            {isSeeding ? 'Resetting Database...' : 'Run Manual Seed'}
          </Button>

          {seedResult && (
            <Alert 
              severity={seedResult.type} 
              sx={{ mt: 2 }}
              onClose={() => setSeedResult(null)}
            >
              {seedResult.message}
              {seedResult.type === 'success' && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="body2">
                    You can now log in with: <strong>priya.sales@toyota.com</strong> / <strong>sales123</strong>
                  </Typography>
                </Box>
              )}
            </Alert>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            📝 Development Notes
          </Typography>
          <Typography variant="body2" color="text.secondary">
            • Manual seed is perfect for testing new features without migrations<br/>
            • All events are owned by priya_sales so you can test editing permissions<br/>
            • Database schema is auto-synced in development mode<br/>
            • Use this when you need fresh, consistent test data
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
};

export default AdminTools; 