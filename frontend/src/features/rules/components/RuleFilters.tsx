import React from 'react';
import { Box, MenuItem, TextField } from '@mui/material';
import type { RuleFilterParams } from '../types';

export interface RuleFiltersProps {
  filters: RuleFilterParams;
  onFilterChange: (newFilters: RuleFilterParams) => void;
}

export const RuleFilters: React.FC<RuleFiltersProps> = ({ filters, onFilterChange }) => {
  const handleStatusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, status: e.target.value || undefined, page: 1 });
  };

  const handleEnabledChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    let enabled: boolean | undefined = undefined;
    if (val === 'true') enabled = true;
    if (val === 'false') enabled = false;

    onFilterChange({ ...filters, enabled, page: 1 });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value || undefined, page: 1 });
  };

  const enabledVal = filters.enabled === true ? 'true' : filters.enabled === false ? 'false' : '';

  return (
    <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap' }}>
      <TextField
        select
        label="Status"
        value={filters.status || ''}
        onChange={handleStatusChange}
        size="small"
        sx={{ minWidth: 150 }}
      >
        <MenuItem value="">All Statuses</MenuItem>
        <MenuItem value="ACTIVE">Active</MenuItem>
        <MenuItem value="INACTIVE">Inactive</MenuItem>
      </TextField>

      <TextField
        select
        label="Enabled"
        value={enabledVal}
        onChange={handleEnabledChange}
        size="small"
        sx={{ minWidth: 150 }}
      >
        <MenuItem value="">All</MenuItem>
        <MenuItem value="true">Enabled</MenuItem>
        <MenuItem value="false">Disabled</MenuItem>
      </TextField>

      <TextField
        label="Search rules"
        value={filters.search || ''}
        onChange={handleSearchChange}
        size="small"
        sx={{ minWidth: 250 }}
      />
    </Box>
  );
};
