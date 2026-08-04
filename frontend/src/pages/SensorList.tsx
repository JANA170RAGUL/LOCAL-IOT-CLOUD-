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

import { SensorForm } from '../features/sensors/components/SensorForm';
import { SensorType } from '../features/sensors/types';
import {
  useSensorsQuery,
  useCreateSensorMutation,
  useUpdateSensorMutation,
  useDeleteSensorMutation,
} from '../features/sensors/hooks/useSensors';
import type { SensorSummary } from '../features/sensors/types';

export const SensorList: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  // Hierarchy Selection
  const [selection, setSelection] = useState<HierarchySelection>({
    orgId: '',
    tenantId: '',
    projectId: '',
    gatewayId: '',
    deviceId: '',
  });

  // Table state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  // Dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [selectedSensor, setSelectedSensor] = useState<SensorSummary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<SensorSummary | null>(null);

  const { data, isLoading, isError, error } = useSensorsQuery(
    selection.deviceId ?? '',
    page,
    pageSize,
    { search: search || undefined, status: statusFilter || undefined, sensor_type: (typeFilter as SensorType) || undefined }
  );

  const createMutation = useCreateSensorMutation(selection.deviceId ?? '');
  const updateMutation = useUpdateSensorMutation();
  const deleteMutation = useDeleteSensorMutation();

  const handleHierarchyChange = (newSelection: HierarchySelection) => {
    setSelection(newSelection);
    setPage(1);
  };

  const handleFormSubmit = async (values: any) => {
    try {
      if (selectedSensor) {
        await updateMutation.mutateAsync({ id: selectedSensor.id, data: values });
      } else {
        await createMutation.mutateAsync(values);
      }
      setFormOpen(false);
      setSelectedSensor(null);
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

  const columns: ColumnDefinition<SensorSummary>[] = [
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
      field: 'sensor_type',
      header: 'Type',
      render: (row) => (
        <Typography sx={{ fontSize: '0.875rem' }}>
          {row.sensor_type}
        </Typography>
      ),
    },
    {
      field: 'unit',
      header: 'Unit',
      render: (row) => (
        <Typography sx={{ fontSize: '0.875rem' }}>
          {row.unit || '—'}
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
          <IconButton size="small" color="primary" onClick={() => navigate(`/sensors/${row.id}`)}>
            <ViewIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="secondary" onClick={() => { setSelectedSensor(row); setFormOpen(true); }}>
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
        title="Sensors"
        subtitle="Manage data collection endpoints on your devices."
        actionLabel="New Sensor"
        onAction={() => {
          if (!selection.deviceId) return;
          setSelectedSensor(null);
          setFormOpen(true);
        }}
      />

      {/* Selector and Filters */}
      <Card sx={{ p: 2, mb: 3, boxShadow: 'none', border: `1px solid ${theme.palette.divider}` }}>
        <Box sx={{ mb: 2 }}>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Hierarchy Selection
          </Typography>
          <HierarchySelector selection={selection} onChange={handleHierarchyChange} maxDepth="device" variant="dropdown" />
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
                <InputLabel id="type-filter-label">Sensor Type</InputLabel>
                <Select
                  labelId="type-filter-label"
                  label="Sensor Type"
                  value={typeFilter}
                  onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                >
                  <MenuItem value="">All Types</MenuItem>
                  {Object.values(SensorType).map((type) => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Box>
      </Card>

      {!selection.deviceId && (
        <EmptyState
          title="Select a Device"
          subtitle="Navigate the hierarchy above to select a device."
        />
      )}

      {selection.deviceId && isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {(error as any)?.message ?? 'Failed to load sensors.'}
        </Alert>
      )}

      {selection.deviceId && (
        <DataTable
          rows={data?.items || []}
          columns={columns}
          loading={isLoading}
          page={page}
          pageSize={pageSize}
          total={data?.total || 0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          emptyTitle="No sensors found"
          emptySubtitle="Register a new sensor under this device."
        />
      )}

      <SensorForm
        open={formOpen}
        sensor={selectedSensor as any}
        submitting={createMutation.isPending || updateMutation.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Sensor"
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
