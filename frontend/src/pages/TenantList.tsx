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
import { TenantForm } from '../features/tenants/components/TenantForm';
import { useTenantsQuery, useCreateTenantMutation, useUpdateTenantMutation, useDeleteTenantMutation } from '../features/tenants/hooks/useTenants';
import { useOrganizationsQuery } from '../features/organizations/hooks/useOrganizations';
import type { TenantSummary } from '../features/tenants/types';

export const TenantList: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  // Org selector state
  const [selectedOrgId, setSelectedOrgId] = useState('');

  // Table state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [selectedTenant, setSelectedTenant] = useState<TenantSummary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<TenantSummary | null>(null);

  // Data queries
  const { data: orgsData } = useOrganizationsQuery(1, 200, {});

  const { data, isLoading, isError, error } = useTenantsQuery(
    selectedOrgId,
    page,
    pageSize,
    { search: search || undefined, status: statusFilter || undefined }
  );

  const createMutation = useCreateTenantMutation(selectedOrgId);
  const updateMutation = useUpdateTenantMutation();
  const deleteMutation = useDeleteTenantMutation(selectedOrgId);

  const handleFormSubmit = async (values: any) => {
    try {
      if (selectedTenant) {
        await updateMutation.mutateAsync({ id: selectedTenant.id, data: values });
      } else {
        await createMutation.mutateAsync(values);
      }
      setFormOpen(false);
      setSelectedTenant(null);
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

  const columns: ColumnDefinition<TenantSummary>[] = [
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
    { field: 'email', header: 'Email' },
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
          <IconButton size="small" color="primary" onClick={() => navigate(`/tenants/${row.id}`)}>
            <ViewIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="secondary" onClick={() => { setSelectedTenant(row as any); setFormOpen(true); }}>
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
        title="Tenants"
        subtitle="Manage workspace tenants nested within your organizations."
        actionLabel="New Tenant"
        onAction={() => {
          if (!selectedOrgId) return;
          setSelectedTenant(null);
          setFormOpen(true);
        }}
      />

      {/* Organization + Filters Row */}
      <Card sx={{ p: 2, mb: 3, boxShadow: 'none', border: `1px solid ${theme.palette.divider}` }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          {/* Organization selector */}
          <Grid size={{ xs: 12, sm: 12, md: 4 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="org-select-label">Organization</InputLabel>
              <Select
                labelId="org-select-label"
                label="Organization"
                value={selectedOrgId}
                onChange={(e) => {
                  setSelectedOrgId(e.target.value);
                  setPage(1);
                }}
              >
                <MenuItem value="">— Select an organization —</MenuItem>
                {orgsData?.items.map((org) => (
                  <MenuItem key={org.id} value={org.id}>
                    {org.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Search */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <SearchBar
              value={search}
              onChange={(v) => { setSearch(v); setPage(1); }}
              placeholder="Search code, name, email…"
            />
          </Grid>

          {/* Status filter */}
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
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
        </Grid>
      </Card>

      {/* No org selected prompt */}
      {!selectedOrgId && (
        <EmptyState
          title="Select an Organization"
          subtitle="Choose an organization above to load its tenants."
        />
      )}

      {/* Error */}
      {selectedOrgId && isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {(error as any)?.message ?? 'Failed to load tenants.'}
        </Alert>
      )}

      {/* Table */}
      {selectedOrgId && (
        <DataTable
          rows={data?.items || []}
          columns={columns}
          loading={isLoading}
          page={page}
          pageSize={pageSize}
          total={data?.total || 0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          emptyTitle="No tenants found"
          emptySubtitle="Create a tenant for this organization."
        />
      )}

      {/* Tenant form dialog */}
      <TenantForm
        open={formOpen}
        tenant={selectedTenant as any}
        submitting={createMutation.isPending || updateMutation.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      {/* Delete confirmation */}
      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Tenant"
        message={
          <>
            Are you sure you want to deactivate <strong>{deleteTarget?.name}</strong>? This will soft-delete the tenant and all its projects.
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
