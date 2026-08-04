import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import {
  Box,
  Card,
  FormControl,
  Grid,
  IconButton,
  InputLabel,
  MenuItem,
  Select,
  Typography,
  Alert,
} from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

import { PageHeader } from '../components/PageHeader';
import { SearchBar } from '../components/SearchBar';
import { StatusChip } from '../components/StatusChip';
import { EmptyState } from '../components/EmptyState';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { DataTable } from '../components/DataTable';
import type { ColumnDefinition } from '../components/DataTable';
import { HierarchySelector } from '../components/HierarchySelector';
import type { HierarchySelection } from '../components/HierarchySelector';

import { DeviceForm } from '../features/devices/components/DeviceForm';
import {
  useDevicesQuery,
  useCreateDeviceMutation,
  useUpdateDeviceMutation,
  useDeleteDeviceMutation,
} from '../features/devices/hooks/useDevices';
import type { DeviceSummary } from '../features/devices/types';

export const DeviceList: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  // Hierarchy Selection
  const [selection, setSelection] = useState<HierarchySelection>({
    orgId: '',
    tenantId: '',
    projectId: '',
    gatewayId: '',
  });

  // Table state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState<DeviceSummary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<DeviceSummary | null>(null);

  const { data, isLoading, isError, error } = useDevicesQuery(
    selection.gatewayId,
    page,
    pageSize,
    { search: search || undefined, status: statusFilter || undefined, device_type: typeFilter || undefined }
  );

  const createMutation = useCreateDeviceMutation(selection.gatewayId);
  const updateMutation = useUpdateDeviceMutation();
  const deleteMutation = useDeleteDeviceMutation();

  const handleHierarchyChange = (newSelection: HierarchySelection) => {
    setSelection(newSelection);
    setPage(1);
  };

  const handleFormSubmit = async (values: any) => {
    try {
      if (selectedDevice) {
        await updateMutation.mutateAsync({ id: selectedDevice.id, data: values });
      } else {
        await createMutation.mutateAsync(values);
      }
      setFormOpen(false);
      setSelectedDevice(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!deleteTarget) return;
    try {
      await deleteMutation.mutateAsync(deleteTarget.id);
      setDeleteTarget(null);
    } catch (e) {
      console.error(e);
    }
  };

  const columns: ColumnDefinition<DeviceSummary>[] = [
    {
      field: 'code',
      header: 'Code',
      render: (row) => (
        <Typography sx={{ fontWeight: 600, color: 'primary.main', fontSize: '0.875rem' }}>
          {row.code}
        </Typography>
      ),
    },
    {
      field: 'name',
      header: 'Name',
      render: (row) => (
        <Typography sx={{ fontWeight: 500, fontSize: '0.875rem' }}>
          {row.name}
        </Typography>
      ),
    },
    {
      field: 'device_type',
      header: 'Device Type',
      render: (row) => (
        <Typography sx={{ fontSize: '0.875rem' }}>
          {row.device_type || '—'}
        </Typography>
      ),
    },
    {
      field: 'status',
      header: 'Status',
      render: (row) => <StatusChip status={row.status} />,
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <>
          <IconButton size="small" color="primary" onClick={() => navigate(`/devices/${row.id}`)}>
            <ViewIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="secondary" onClick={() => { setSelectedDevice(row); setFormOpen(true); }}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => setDeleteTarget(row)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Devices"
        subtitle="Manage end-devices registered under gateways."
        actionLabel="New Device"
        onAction={() => {
          if (!selection.gatewayId) return;
          setSelectedDevice(null);
          setFormOpen(true);
        }}
      />

      {/* Selector and Filters */}
      <Card sx={{ p: 2, mb: 3, boxShadow: 'none', border: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Hierarchy Selection
          </Typography>
          <HierarchySelector selection={selection} onChange={handleHierarchyChange} maxDepth="gateway" />
        </Box>
        
        <Box sx={{ borderTop: `1px dashed ${theme.palette.divider}`, pt: 2 }}>
          <Grid container spacing={2} sx={{ alignItems: 'center' }}>
            <Grid size={{ xs: 12, sm: 4 }}>
              <SearchBar
                value={search}
                onChange={(v) => { setSearch(v); setPage(1); }}
                placeholder="Search code, name…"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="status-filter-label">Status</InputLabel>
                <Select
                  labelId="status-filter-label"
                  label="Status"
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                >
                  <MenuItem value="">All Statuses</MenuItem>
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                  <MenuItem value="SUSPENDED">Suspended</MenuItem>
                  <MenuItem value="TRIAL">Trial</MenuItem>
                  <MenuItem value="EXPIRED">Expired</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 4 }}>
              <FormControl fullWidth size="small">
                <InputLabel id="type-filter-label">Device Type</InputLabel>
                <Select
                  labelId="type-filter-label"
                  label="Device Type"
                  value={typeFilter}
                  onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                >
                  <MenuItem value="">All Types</MenuItem>
                  <MenuItem value="sensor_node">Sensor Node</MenuItem>
                  <MenuItem value="actuator">Actuator</MenuItem>
                  <MenuItem value="controller">Controller</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      </Card>

      {!selection.gatewayId && (
        <EmptyState
          title="Select a Gateway"
          subtitle="Navigate the hierarchy above to select a gateway."
        />
      )}

      {selection.gatewayId && isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {(error as any)?.message ?? 'Failed to load devices.'}
        </Alert>
      )}

      {selection.gatewayId && (
        <DataTable
          rows={data?.items || []}
          columns={columns}
          loading={isLoading}
          page={page}
          pageSize={pageSize}
          total={data?.total || 0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          emptyTitle="No devices found"
          emptySubtitle="Register a new device under this gateway."
        />
      )}

      <DeviceForm
        open={formOpen}
        device={selectedDevice as any}
        submitting={createMutation.isPending || updateMutation.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Device"
        message={
          <>
            Are you sure you want to delete <strong>{deleteTarget?.name}</strong>?
          </>
        }
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteTarget(null)}
      />
    </Box>
  );
};
