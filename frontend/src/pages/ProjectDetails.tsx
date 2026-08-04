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
import { useProjectDetailsQuery } from '../features/projects/hooks/useProjects';

export const ProjectDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();

  const { data: project, isLoading, isError, error } = useProjectDetailsQuery(id ?? '');

  return (
    <Box>
      {/* Navigation */}
      <Box sx={{ mb: 4 }}>
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={() => navigate('/projects')}
          sx={{ textTransform: 'none', mb: 2 }}
        >
          Back to Projects
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Project Profile
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Detailed view of the project configuration.
        </Typography>
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && (
        <Alert severity="error">
          {(error as any)?.message ?? 'Failed to load project.'}
        </Alert>
      )}

      {project && (
        <Card sx={{ boxShadow: 'none', border: `1px solid ${theme.palette.divider}` }}>
          <CardContent sx={{ p: 4 }}>
            {/* Header row */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {project.name}
              </Typography>
              <StatusChip status={project.status} size="medium" />
            </Box>

            <Divider sx={{ mb: 4 }} />

            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Project Code
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, color: 'primary.main', mb: 2 }}>
                  {project.code}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Tenant ID
                </Typography>
                <Typography variant="body1" sx={{ mb: 2, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                  {project.tenant_id}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Created
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {new Date(project.created_at).toLocaleString()}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Last Updated
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {new Date(project.updated_at).toLocaleString()}
                </Typography>
              </Grid>

              <Grid size={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Description
                </Typography>
                <Typography variant="body1" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                  {project.description || 'No description provided.'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
