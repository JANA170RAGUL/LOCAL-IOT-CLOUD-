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

import { ProjectForm } from '../features/projects/components/ProjectForm';
import {
  useProjectsQuery,
  useCreateProjectMutation,
  useUpdateProjectMutation,
  useDeleteProjectMutation,
} from '../features/projects/hooks/useProjects';
import { useTenantsQuery } from '../features/tenants/hooks/useTenants';
import { useOrganizationsQuery } from '../features/organizations/hooks/useOrganizations';

import type { ProjectSummary } from '../features/projects/types';

export const ProjectList: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  // Selectors state
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [selectedTenantId, setSelectedTenantId] = useState('');

  // Table state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Dialog state
  const [formOpen, setFormOpen] = useState(false);
  const [selectedProject, setSelectedProject] = useState<ProjectSummary | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<ProjectSummary | null>(null);

  // Data queries
  const { data: orgsData } = useOrganizationsQuery(1, 200, {});
  
  // We only fetch tenants if an org is selected to provide a cascading dropdown,
  // or we could just fetch all tenants. Let's fetch tenants for the selected org.
  const { data: tenantsData } = useTenantsQuery(
    selectedOrgId,
    1,
    200,
    {}
  );

  const { data, isLoading, isError, error } = useProjectsQuery(
    selectedTenantId,
    page,
    pageSize,
    { search: search || undefined, status: statusFilter || undefined }
  );

  const createMutation = useCreateProjectMutation(selectedTenantId);
  const updateMutation = useUpdateProjectMutation();
  const deleteMutation = useDeleteProjectMutation();

  const handleFormSubmit = async (values: any) => {
    try {
      if (selectedProject) {
        await updateMutation.mutateAsync({ id: selectedProject.id, data: values });
      } else {
        await createMutation.mutateAsync(values);
      }
      setFormOpen(false);
      setSelectedProject(null);
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

  const columns: ColumnDefinition<ProjectSummary>[] = [
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
      field: 'status',
      header: 'Status',
      render: (row) => <StatusChip status={row.status} />,
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <>
          <IconButton size="small" color="primary" onClick={() => navigate(`/projects/${row.id}`)}>
            <ViewIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="secondary" onClick={() => { setSelectedProject(row); setFormOpen(true); }}>
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
        title="Projects"
        subtitle="Manage projects containing gateways and IoT assets."
        actionLabel="New Project"
        actionDisabled={!selectedTenantId}
        onAction={() => {
          setSelectedProject(null);
          setFormOpen(true);
        }}
      />

      <Card sx={{ p: 2, mb: 3, boxShadow: 'none', border: `1px solid ${theme.palette.divider}` }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          {/* Organization selector */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="org-select-label">Organization</InputLabel>
              <Select
                labelId="org-select-label"
                label="Organization"
                value={selectedOrgId}
                onChange={(e) => {
                  setSelectedOrgId(e.target.value);
                  setSelectedTenantId('');
                  setPage(1);
                }}
              >
                <MenuItem value="">— Select Organization —</MenuItem>
                {orgsData?.items.map((org) => (
                  <MenuItem key={org.id} value={org.id}>
                    {org.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Tenant selector */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <FormControl fullWidth size="small" disabled={!selectedOrgId}>
              <InputLabel id="tenant-select-label">Tenant</InputLabel>
              <Select
                labelId="tenant-select-label"
                label="Tenant"
                value={selectedTenantId}
                onChange={(e) => {
                  setSelectedTenantId(e.target.value);
                  setPage(1);
                }}
              >
                <MenuItem value="">— Select Tenant —</MenuItem>
                {tenantsData?.items.map((tenant) => (
                  <MenuItem key={tenant.id} value={tenant.id}>
                    {tenant.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Search */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <SearchBar
              value={search}
              onChange={(v) => { setSearch(v); setPage(1); }}
              placeholder="Search project code, name…"
            />
          </Grid>

          {/* Status filter */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
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

      {!selectedTenantId && (
        <EmptyState
          title="Select a Tenant"
          subtitle="Choose an organization and a tenant above to load its projects."
        />
      )}

      {selectedTenantId && isError && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {(error as any)?.message ?? 'Failed to load projects.'}
        </Alert>
      )}

      {selectedTenantId && (
        <DataTable
          rows={data?.items || []}
          columns={columns}
          loading={isLoading}
          page={page}
          pageSize={pageSize}
          total={data?.total || 0}
          onPageChange={setPage}
          onPageSizeChange={setPageSize}
          emptyTitle="No projects found"
          emptySubtitle="Create a project for this tenant to get started."
        />
      )}

      <ProjectForm
        open={formOpen}
        project={selectedProject as any}
        submitting={createMutation.isPending || updateMutation.isPending}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
      />

      <ConfirmDialog
        open={!!deleteTarget}
        title="Delete Project"
        message={
          <>
            Are you sure you want to deactivate <strong>{deleteTarget?.name}</strong>? This will impact all associated gateways and devices.
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
