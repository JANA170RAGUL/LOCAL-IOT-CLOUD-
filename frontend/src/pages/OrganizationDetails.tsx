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
  Paper,
  Typography,
  Chip,
} from '@mui/material';
import { ArrowBack as BackIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { StatusChip } from '../components/StatusChip';
import { useOrganizationQuery } from '../features/organizations/hooks/useOrganizations';

export const OrganizationDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();

  const { data: org, isLoading, isError, error } = useOrganizationQuery(id || '');


  return (
    <Box>
      {/* Back Navigation Row */}
      <Box sx={{ mb: 4 }}>
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={() => navigate('/organizations')}
          sx={{ textTransform: 'none', mb: 2 }}
        >
          Back to List
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 700, color: 'text.primary' }}>
          Organization Profiles
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Detailed metadata configuration for this workspace.
        </Typography>
      </Box>

      {/* Loading state */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {/* Error state */}
      {isError && (
        <Paper sx={{ p: 3, mb: 3, bgcolor: 'error.light', color: 'error.contrastText' }}>
          <Typography variant="h6">Error Loading Profile</Typography>
          <Typography variant="body2">{(error as any)?.message || 'Something went wrong.'}</Typography>
        </Paper>
      )}

      {/* Detail card */}
      {org && (
        <Card sx={{ boxShadow: 'none', border: `1px solid ${theme.palette.divider}` }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {org.name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1.5 }}>
                <StatusChip status={org.status} size="medium" />
                <Chip label={org.license_type} variant="outlined" sx={{ fontWeight: 'bold' }} />
              </Box>
            </Box>

            <Divider sx={{ mb: 4 }} />

            <Grid container spacing={3}>
              {/* Identity Keys */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Organization Code
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, color: 'primary.main', mb: 2 }}>
                  {org.code}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Contact Email
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {org.email}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Contact Phone
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {org.phone || '—'}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Website
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {org.website ? (
                    <a href={org.website} target="_blank" rel="noopener noreferrer" style={{ color: theme.palette.primary.main, textDecoration: 'none' }}>
                      {org.website}
                    </a>
                  ) : '—'}
                </Typography>
              </Grid>

              {/* Location and Settings */}
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Timezone / Language
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {org.timezone} / {org.language.toUpperCase()}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Currency
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {org.currency}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Created At
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {new Date(org.created_at).toLocaleString()}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Last Updated
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {new Date(org.updated_at).toLocaleString()}
                </Typography>
              </Grid>

              {/* Description */}
              <Grid size={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Description
                </Typography>
                <Typography variant="body1" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                  {org.description || 'No description provided.'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
