import React from 'react';
import {
  Box,
  Pagination,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';

interface EventPaginationProps {
  currentPage: number;
  totalPages: number;
  totalCount: number;
  limit: number;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  loading?: boolean;
}

const EventPagination: React.FC<EventPaginationProps> = ({
  currentPage,
  totalPages,
  totalCount,
  limit,
  onPageChange,
  onLimitChange,
  loading = false,
}) => {
  const startItem = totalCount === 0 ? 0 : (currentPage - 1) * limit + 1;
  const endItem = Math.min(currentPage * limit, totalCount);

  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        mt: 3,
        flexWrap: 'wrap',
        gap: 2,
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Showing {startItem}-{endItem} of {totalCount} events
        </Typography>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Items per page</InputLabel>
          <Select
            value={limit}
            label="Items per page"
            onChange={(e) => onLimitChange(Number(e.target.value))}
            disabled={loading}
          >
            <MenuItem value={5}>5</MenuItem>
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={20}>20</MenuItem>
            <MenuItem value={50}>50</MenuItem>
          </Select>
        </FormControl>
      </Box>

      <Pagination
        count={totalPages}
        page={currentPage}
        onChange={(_, page) => onPageChange(page)}
        color="primary"
        shape="rounded"
        disabled={loading}
        showFirstButton
        showLastButton
      />
    </Box>
  );
};

export default EventPagination; 