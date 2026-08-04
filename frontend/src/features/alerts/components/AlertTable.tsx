import React from 'react';
import { Button } from '@mui/material';
import { format } from 'date-fns';
import { DataTable, type ColumnDefinition } from '../../../components/DataTable/DataTable';
import { SeverityChip } from './SeverityChip';
import { AlertStatusChip } from './AlertStatusChip';
import type { BackendAlert } from '../types';

export interface AlertTableProps {
  alerts: BackendAlert[];
  loading: boolean;
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  onViewDetails: (alert: BackendAlert) => void;
}

export const AlertTable: React.FC<AlertTableProps> = ({
  alerts,
  loading,
  page,
  total,
  pageSize,
  onPageChange,
  onPageSizeChange,
  onViewDetails,
}) => {
  const columns: ColumnDefinition<BackendAlert>[] = [
    {
      header: 'Severity',
      width: 120,
      render: (row) => <SeverityChip severity={row.severity} />,
    },
    {
      header: 'Title',
      field: 'title',
    },
    {
      header: 'Message',
      field: 'message',
    },
    {
      header: 'Status',
      width: 150,
      render: (row) => <AlertStatusChip status={row.status} />,
    },
    {
      header: 'Created At',
      width: 200,
      render: (row) => format(new Date(row.created_at), 'MMM d, yyyy HH:mm:ss'),
    },
    {
      header: 'Actions',
      width: 120,
      align: 'right',
      render: (row) => (
        <Button size="small" variant="text" onClick={() => onViewDetails(row)}>
          Details
        </Button>
      ),
    },
  ];

  return (
    <DataTable
      columns={columns}
      rows={alerts}
      loading={loading}
      page={page}
      total={total}
      pageSize={pageSize}
      onPageChange={onPageChange}
      onPageSizeChange={onPageSizeChange}
      emptyTitle="No Alerts Found"
      emptySubtitle="There are currently no active alerts matching your criteria."
    />
  );
};
