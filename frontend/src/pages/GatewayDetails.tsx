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
import { useGatewayDetailsQuery } from '../features/gateways/hooks/useGateways';

export const GatewayDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();

  const { data: gateway, isLoading, isError, error } = useGatewayDetailsQuery(id ?? '');

  return (
    <Box>
      {/* Navigation */}
      <Box sx={{ mb: 4 }}>
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={() => navigate('/gateways')}
          sx={{ textTransform: 'none', mb: 2 }}
        >
          Back to Gateways
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Gateway Profile
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Detailed view of the gateway configuration.
        </Typography>
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && (
        <Alert severity="error">
          {(error as any)?.message ?? 'Failed to load gateway.'}
        </Alert>
      )}

      {gateway && (
        <Card sx={{ boxShadow: 'none', border: `1px solid ${theme.palette.divider}` }}>
          <CardContent sx={{ p: 4 }}>
            {/* Header row */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {gateway.name}
              </Typography>
              <StatusChip status={gateway.status} size="medium" />
            </Box>

            <Divider sx={{ mb: 4 }} />

            <Grid container spacing={3}>
              <Grid size={12}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Gateway Information
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Gateway Code
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, color: 'primary.main', mb: 2 }}>
                  {gateway.code}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Project ID
                </Typography>
                <Typography variant="body1" sx={{ mb: 2, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                  {gateway.project_id}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Location
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {gateway.location || '—'}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Created
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {new Date(gateway.created_at).toLocaleString()}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Last Updated
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {new Date(gateway.updated_at).toLocaleString()}
                </Typography>
                
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Last Seen
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {gateway.last_seen ? new Date(gateway.last_seen).toLocaleString() : 'Never'}
                </Typography>
              </Grid>

              <Grid size={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Connection Details
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Protocol
                </Typography>
                <Typography variant="body1" sx={{ mb: 2, fontFamily: 'monospace' }}>
                  {gateway.protocol}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  IP Address
                </Typography>
                <Typography variant="body1" sx={{ mb: 2, fontFamily: 'monospace' }}>
                  {gateway.ip_address || '—'}
                </Typography>
                
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  MAC Address
                </Typography>
                <Typography variant="body1" sx={{ mb: 2, fontFamily: 'monospace' }}>
                  {gateway.mac_address || '—'}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Firmware Version
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {gateway.firmware_version || '—'}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  MQTT Topic
                </Typography>
                <Typography variant="body1" sx={{ mb: 2, fontFamily: 'monospace' }}>
                  {gateway.mqtt_topic || '—'}
                </Typography>
              </Grid>

              <Grid size={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Description
                </Typography>
                <Typography variant="body1" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                  {gateway.description || 'No description provided.'}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
