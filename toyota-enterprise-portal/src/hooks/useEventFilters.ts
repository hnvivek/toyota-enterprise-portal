import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import { EventFilters } from '../services/eventService';

const useEventFilters = (initialFilters: EventFilters = {}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [filters, setFilters] = useState<EventFilters>(() => {
    // Initialize filters from URL params or defaults
    const urlFilters: EventFilters = {};
    
    // Extract filters from URL
    const branchId = searchParams.get('branchId');
    const status = searchParams.get('status');
    const search = searchParams.get('search');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const page = searchParams.get('page');
    const limit = searchParams.get('limit');
    const sortBy = searchParams.get('sortBy');
    const sortOrder = searchParams.get('sortOrder');

    if (branchId) urlFilters.branchId = branchId;
    if (status) urlFilters.status = status;
    if (search) urlFilters.search = search;
    if (startDate) urlFilters.startDate = startDate;
    if (endDate) urlFilters.endDate = endDate;
    if (page) urlFilters.page = parseInt(page);
    if (limit) urlFilters.limit = parseInt(limit);
    if (sortBy) urlFilters.sortBy = sortBy;
    if (sortOrder) urlFilters.sortOrder = sortOrder as 'ASC' | 'DESC';

    return {
      page: 1,
      limit: 10,
      sortBy: 'startDate',
      sortOrder: 'DESC',
      ...initialFilters,
      ...urlFilters,
    };
  });

  // Update URL when filters change
  const updateFilters = useCallback((newFilters: EventFilters) => {
    setFilters(newFilters);
    
    // Update URL params
    const params = new URLSearchParams();
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '' && value !== 'all') {
        params.set(key, String(value));
      }
    });

    setSearchParams(params);
  }, [setSearchParams]);

  // Reset filters
  const resetFilters = useCallback(() => {
    const defaultFilters: EventFilters = {
      page: 1,
      limit: 10,
      sortBy: 'startDate',
      sortOrder: 'DESC',
      ...initialFilters,
    };
    updateFilters(defaultFilters);
  }, [initialFilters, updateFilters]);

  // Update a single filter
  const updateFilter = useCallback((key: keyof EventFilters, value: any) => {
    updateFilters({
      ...filters,
      [key]: value,
      page: key !== 'page' && key !== 'limit' ? 1 : filters.page, // Reset page when other filters change
    });
  }, [filters, updateFilters]);

  return {
    filters,
    updateFilters,
    updateFilter,
    resetFilters,
  };
};

export default useEventFilters; 