import React from 'react';
import { Button, Chip, Typography, Box } from '@mui/material';
import { DataTable, type ColumnDefinition } from '../../../components/DataTable/DataTable';
import { SeverityChip } from '../../alerts/components/SeverityChip';
import type { BackendRule } from '../types';

export interface RuleTableProps {
  rules: BackendRule[];
  loading: boolean;
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onEdit: (rule: BackendRule) => void;
}

export const RuleTable: React.FC<RuleTableProps> = ({
  rules,
  loading,
  page,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onEdit,
}) => {
  const columns: ColumnDefinition<BackendRule>[] = [
    {
      header: 'Code',
      field: 'code',
      width: 120,
    },
    {
      header: 'Name',
      field: 'name',
    },
    {
      header: 'Condition',
      render: (row) => (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
          <Chip size="small" label={row.condition} variant="outlined" />
          <Typography variant="body2">{row.threshold}</Typography>
        </Box>
      ),
    },
    {
      header: 'Severity',
      width: 120,
      render: (row) => <SeverityChip severity={row.severity} />,
    },
    {
      header: 'Status',
      width: 120,
      render: (row) => (
        <Chip
          label={row.enabled ? 'Enabled' : 'Disabled'}
          color={row.enabled ? 'success' : 'default'}
          size="small"
        />
      ),
    },
    {
      header: 'Actions',
      width: 120,
      align: 'right',
      render: (row) => (
        <Button size="small" variant="text" onClick={() => onEdit(row)}>
          Edit
        </Button>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={rules}
      loading={loading}
      page={page}
      total={total}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      emptyTitle="No Rules Found"
      emptySubtitle="Create an automation rule to get started."
    />
  );
};
