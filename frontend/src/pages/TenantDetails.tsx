import React from 'react';
import { useParams, useNavigate } from 'react-router';
import {
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  Grid,
  Typography,
  Alert,
} from '@mui/material';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { StatusChip } from '../components/StatusChip';
import { useTenantQuery } from '../features/tenants/hooks/useTenants';

export const TenantDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();

  const { data: tenant, isLoading, isError, error } = useTenantQuery(id ?? '');

  return (
    <Box>
      {/* Navigation */}
      <Box sx={{ mb: 4 }}>
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={() => navigate('/tenants')}
          sx={{ textTransform: 'none', mb: 2 }}
        >
          Back to Tenants
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Tenant Profile
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Detailed view of tenant configuration and contact details.
        </Typography>
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && (
        <Alert severity="error">
          {(error as any)?.message ?? 'Failed to load tenant.'}
        </Alert>
      )}

      {tenant && (
        <Card sx={{ boxShadow: 'none', border: `1px solid ${theme.palette.divider}` }}>
          <CardContent sx={{ p: 4 }}>
            {/* Header row */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {tenant.name}
              </Typography>
              <StatusChip status={tenant.status} size="medium" />
            </Box>

            <Divider sx={{ mb: 4 }} />

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Tenant Code
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, color: 'primary.main', mb: 2 }}>
                  {tenant.code}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Organization ID
                </Typography>
                <Typography variant="body1" sx={{ mb: 2, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                  {tenant.organization_id}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Contact Email
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {tenant.email}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Phone
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {tenant.phone || '—'}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Website
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {tenant.website ? (
                    <a
                      href={tenant.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      style={{ color: theme.palette.primary.main, textDecoration: 'none' }}
                    >
                      {tenant.website}
                    </a>
                  ) : '—'}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Timezone
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {tenant.timezone}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Created
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {new Date(tenant.created_at).toLocaleString()}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Last Updated
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {new Date(tenant.updated_at).toLocaleString()}
                </Typography>
              </Grid>

              <Grid size={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Description
                </Typography>
                <Typography variant="body1" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                  {tenant.description || 'No description provided.'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
