import React from 'react';
import { Box, MenuItem, TextField } from '@mui/material';
import type { AlertFilterParams, AlertStatus, AlertSeverity } from '../types';

export interface AlertFiltersProps {
  filters: AlertFilterParams;
  onFilterChange: (newFilters: AlertFilterParams) => void;
}

export const AlertFilters: React.FC<AlertFiltersProps> = ({ filters, onFilterChange }) => {
  const handleStatusChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, status: (e.target.value || undefined) as AlertStatus | undefined, page: 1 });
  };

  const handleSeverityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, severity: (e.target.value || undefined) as AlertSeverity | undefined, page: 1 });
  };

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onFilterChange({ ...filters, search: e.target.value || undefined, page: 1 });
  };

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
        <MenuItem value="OPEN">Open</MenuItem>
        <MenuItem value="ACKNOWLEDGED">Acknowledged</MenuItem>
        <MenuItem value="RESOLVED">Resolved</MenuItem>
        <MenuItem value="CLOSED">Closed</MenuItem>
      </TextField>

      <TextField
        select
        label="Severity"
        value={filters.severity || ''}
        onChange={handleSeverityChange}
        size="small"
        sx={{ minWidth: 150 }}
      >
        <MenuItem value="">All Severities</MenuItem>
        <MenuItem value="INFO">Info</MenuItem>
        <MenuItem value="WARNING">Warning</MenuItem>
        <MenuItem value="CRITICAL">Critical</MenuItem>
        <MenuItem value="EMERGENCY">Emergency</MenuItem>
      </TextField>

      <TextField
        label="Search alerts"
        value={filters.search || ''}
        onChange={handleSearchChange}
        size="small"
        sx={{ minWidth: 250 }}
      />
    </Box>
  );
};
