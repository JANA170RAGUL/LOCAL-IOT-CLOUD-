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
  Paper,
  Select,
  Typography,
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
import { ConfirmDialog } from '../components/ConfirmDialog';
import { DataTable } from '../components/DataTable';
import type { ColumnDefinition } from '../components/DataTable';
import {
  useOrganizationsQuery,
  useCreateOrganizationMutation,
  useUpdateOrganizationMutation,
  useDeleteOrganizationMutation,
} from '../features/organizations/hooks/useOrganizations';
import { OrganizationForm } from '../features/organizations/components/OrganizationForm';
import type { Organization } from '../features/organizations/types';

export const OrganizationList: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  // State
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [licenseFilter, setLicenseFilter] = useState('');

  // Dialog Modals States
  const [formOpen, setFormOpen] = useState(false);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Queries & Mutations
  const { data, isLoading, isError, error } = useOrganizationsQuery(page, pageSize, {
    search: search || undefined,
    status: statusFilter || undefined,
    license_type: licenseFilter || undefined,
  });

  const createMutation = useCreateOrganizationMutation();
  const updateMutation = useUpdateOrganizationMutation();
  const deleteMutation = useDeleteOrganizationMutation();



  const handleCreateClick = () => {
    setSelectedOrg(null);
    setFormOpen(true);
  };

  const handleEditClick = (org: Organization) => {
    setSelectedOrg(org);
    setFormOpen(true);
  };

  const handleDeleteClick = (org: Organization) => {
    setSelectedOrg(org);
    setDeleteConfirmOpen(true);
  };

  const handleFormSubmit = async (values: any) => {
    try {
      if (selectedOrg) {
        await updateMutation.mutateAsync({ id: selectedOrg.id, data: values });
      } else {
        await createMutation.mutateAsync(values);
      }
      setFormOpen(false);
      setSelectedOrg(null);
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteConfirm = async () => {
    if (selectedOrg) {
      try {
        await deleteMutation.mutateAsync(selectedOrg.id);
        setDeleteConfirmOpen(false);
        setSelectedOrg(null);
      } catch (err) {
        console.error(err);
      }
    }
  };

  const columns: ColumnDefinition<Organization>[] = [
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
    { field: 'email', header: 'Contact Email' },
    { field: 'license_type', header: 'License Tier' },
    {
      field: 'status',
      header: 'Status',
      render: (row) => <StatusChip status={row.status} />,
    },
    {
      field: 'created_at',
      header: 'Created',
      render: (row) => (
        <Typography sx={{ color: 'text.secondary', fontSize: '0.85rem' }}>
          {new Date(row.created_at).toLocaleDateString()}
        </Typography>
      ),
    },
    {
      header: 'Actions',
      align: 'right',
      render: (row) => (
        <>
          <IconButton size="small" color="primary" onClick={() => navigate(`/organizations/${row.id}`)}>
            <ViewIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="secondary" onClick={() => handleEditClick(row)}>
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton size="small" color="error" onClick={() => handleDeleteClick(row)}>
            <DeleteIcon fontSize="small" />
          </IconButton>
        </>
      ),
    },
  ];

  return (
    <Box>
      <PageHeader
        title="Organizations"
        subtitle="Manage your high-level accounts, licensing, and corporate boundaries."
        actionLabel="New Organization"
        onAction={handleCreateClick}
      />

      {/* Filters Area */}
      <Card sx={{ p: 2, mb: 3, boxShadow: 'none', border: `1px solid ${theme.palette.divider}` }}>
        <Grid container spacing={2} sx={{ alignItems: 'center' }}>
          <Grid size={{ xs: 12, sm: 6, md: 4 }}>
            <SearchBar
              value={search}
              onChange={(v) => { setSearch(v); setPage(1); }}
              placeholder="Search code, name, email…"
            />
          </Grid>

          <Grid size={{ xs: 12, sm: 3, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="status-filter-label">Status</InputLabel>
              <Select
                labelId="status-filter-label"
                label="Status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
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

          <Grid size={{ xs: 12, sm: 3, md: 3 }}>
            <FormControl fullWidth size="small">
              <InputLabel id="license-filter-label">License Tier</InputLabel>
              <Select
                labelId="license-filter-label"
                label="License Tier"
                value={licenseFilter}
                onChange={(e) => {
                  setLicenseFilter(e.target.value);
                  setPage(1);
                }}
              >
                <MenuItem value="">All Tiers</MenuItem>
                <MenuItem value="Community">Community</MenuItem>
                <MenuItem value="Professional">Professional</MenuItem>
                <MenuItem value="Enterprise">Enterprise</MenuItem>
                <MenuItem value="Academic">Academic</MenuItem>
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Card>

      {/* Error State */}
      {isError && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Typography variant="h6">Error Loading Organizations</Typography>
          <Typography variant="body2">{(error as any)?.message || 'Something went wrong.'}</Typography>
        </Paper>
      )}

      {/* Main Data Table */}
      <DataTable
        rows={data?.items || []}
        columns={columns}
        loading={isLoading}
        page={page}
        pageSize={pageSize}
        total={data?.total || 0}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        emptyTitle="No organizations found"
        emptySubtitle="Create a new organization to get started."
      />

      {/* Organization Create/Edit Modal Dialog */}
      <OrganizationForm
        open={formOpen}
        onClose={() => setFormOpen(false)}
        onSubmit={handleFormSubmit}
        organization={selectedOrg}
        submitting={createMutation.isPending || updateMutation.isPending}
      />

      <ConfirmDialog
        open={deleteConfirmOpen}
        title="Confirm Delete"
        message={
          <>Are you sure you want to delete organization <strong>{selectedOrg?.name}</strong>? This action will soft-deactivate the organization and all its nested tenants.</>
        }
        confirmLabel="Delete"
        loading={deleteMutation.isPending}
        onConfirm={handleDeleteConfirm}
        onCancel={() => setDeleteConfirmOpen(false)}
      />
    </Box>
  );
};
