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

import { GatewayForm } from '../features/gateways/components/GatewayForm';
import {
  useGatewaysQuery,
  useCreateGatewayMutation,
  useUpdateGatewayMutation,
  useDeleteGatewayMutation,
} from '../features/gateways/hooks/useGateways';
import { useOrganizationsQuery } from '../features/organizations/hooks/useOrganizations';
import { useTenantsQuery } from '../features/tenants/hooks/useTenants';
import { useProjectsQuery } from '../features/projects/hooks/useProjects';

import type { GatewaySummary } from '../features/gateways/types';

export const GatewayList: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  // Selectors state
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [selectedTenantId, setSelectedTenantId] = useState('');
  const [selectedProjectId, setSelectedProjectId] = useState('');

  // Table state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [protocolFilter, setProtocolFilter] = useState('');

  // Dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [selectedGateway, setSelectedGateway] = useState<GatewaySummary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<GatewaySummary | null>(null);

  // Data queries
  const { data: orgsData } = useOrganizationsQuery(1, 200, {});
  const { data: tenantsData } = useTenantsQuery(selectedOrgId, 1, 200, {});
  const { data: projectsData } = useProjectsQuery(selectedTenantId, 1, 200, {});

  const { data, isLoading, isError, error } = useGatewaysQuery(
    selectedProjectId,
    page,
    pageSize,
    { search: search || undefined, status: statusFilter || undefined, protocol: protocolFilter || undefined }
  );

  const createMutation = useCreateGatewayMutation(selectedProjectId);
  const updateMutation = useUpdateGatewayMutation();
  const deleteMutation = useDeleteGatewayMutation();

  const handleFormSubmit = async (values: any) => {
    try {
      if (selectedGateway) {
        await updateMutation.mutateAsync({ id: selectedGateway.id, data: values });
      } else {
        await createMutation.mutateAsync(values);
      }
      setFormOpen(false);
      setSelectedGateway(null);
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

  const columns: ColumnDefinition<GatewaySummary>[] = [
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
      field: 'protocol',
      header: 'Protocol',
      render: (row) => (
        <Typography sx={{ fontFamily: 'monospace', fontSize: '0.85rem' }}>
          {row.protocol}
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
          <IconButton size="small" color="primary" onClick={() => navigate(`/gateways/${row.id}`)}>
            <ViewIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="secondary" onClick={() => { setSelectedGateway(row); setFormOpen(true); }}>
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
        title="Gateways"
        subtitle="Manage gateways connecting devices to the cloud."
        actionLabel="New Gateway"
        onAction={() => {
          if (!selectedProjectId) return;
          setSelectedGateway(null);
          setFormOpen(true);
        }}
      />

      <Card sx={{ p: 2, mb: 3, boxShadow: 'none', border: `1px solid ${theme.palette.divider}` }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          {/* Organization selector */}
          <Grid size={{ xs: 12, sm: 4, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="org-select-label">Organization</InputLabel>
              <Select
                labelId="org-select-label"
                label="Organization"
                value={selectedOrgId}
                onChange={(e) => {
                  setSelectedOrgId(e.target.value);
                  setSelectedTenantId('');
                  setSelectedProjectId('');
                  setPage(1);
                }}
              >
                <MenuItem value="">— Select —</MenuItem>
                {orgsData?.items.map((org) => (
                  <MenuItem key={org.id} value={org.id}>
                    {org.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Tenant selector */}
          <Grid size={{ xs: 12, sm: 4, md: 2 }}>
            <FormControl fullWidth size="small" disabled={!selectedOrgId}>
              <InputLabel id="tenant-select-label">Tenant</InputLabel>
              <Select
                labelId="tenant-select-label"
                label="Tenant"
                value={selectedTenantId}
                onChange={(e) => {
                  setSelectedTenantId(e.target.value);
                  setSelectedProjectId('');
                  setPage(1);
                }}
              >
                <MenuItem value="">— Select —</MenuItem>
                {tenantsData?.items.map((tenant) => (
                  <MenuItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Project selector */}
          <Grid size={{ xs: 12, sm: 4, md: 2 }}>
            <FormControl fullWidth size="small" disabled={!selectedTenantId}>
              <InputLabel id="project-select-label">Project</InputLabel>
              <Select
                labelId="project-select-label"
                label="Project"
                value={selectedProjectId}
                onChange={(e) => {
                  setSelectedProjectId(e.target.value);
                  setPage(1);
                }}
              >
                <MenuItem value="">— Select —</MenuItem>
                {projectsData?.items.map((project) => (
                  <MenuItem key={project.id} value={project.id}>
                    {project.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Search */}
          <Grid size={{ xs: 12, sm: 4, md: 2 }}>
            <SearchBar
              value={search}
              onChange={(v) => { setSearch(v); setPage(1); }}
              placeholder="Search code, name…"
            />
          </Grid>

          {/* Status filter */}
          <Grid size={{ xs: 12, sm: 4, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                label="Status"
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="INACTIVE">Inactive</MenuItem>
                <MenuItem value="SUSPENDED">Suspended</MenuItem>
                <MenuItem value="TRIAL">Trial</MenuItem>
                <MenuItem value="EXPIRED">Expired</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          {/* Protocol filter */}
          <Grid size={{ xs: 12, sm: 4, md: 2 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="protocol-filter-label">Protocol</InputLabel>
              <Select
                labelId="protocol-filter-label"
                label="Protocol"
                value={protocolFilter}
                onChange={(e) => { setProtocolFilter(e.target.value); setPage(1); }}
              >
                <MenuItem value="">All</MenuItem>
                <MenuItem value="MQTT">MQTT</MenuItem>
                <MenuItem value="HTTP">HTTP</MenuItem>
                <MenuItem value="COAP">CoAP</MenuItem>
                <MenuItem value="WEBSOCKET">WebSocket</MenuItem>
                <MenuItem value="MODBUS">Modbus</MenuItem>
                <MenuItem value="OPC_UA">OPC UA</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Card>

      {!selectedProjectId && (
        <EmptyState
          title="Select a Project"
          subtitle="Choose an organization, tenant, and project above to load its gateways."
        />
      )}

      {selectedProjectId && isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {(error as any)?.message ?? 'Failed to load gateways.'}
        </Alert>
      )}

      {selectedProjectId && (
        <DataTable
          rows={data?.items || []}
          columns={columns}
          loading={isLoading}
          page={page}
          pageSize={pageSize}
          total={data?.total || 0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          emptyTitle="No gateways found"
          emptySubtitle="Create a gateway for this project to get started."
        />
      )}

      <GatewayForm
        open={formOpen}
        gateway={selectedGateway as any}
        submitting={createMutation.isPending || updateMutation.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Gateway"
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
