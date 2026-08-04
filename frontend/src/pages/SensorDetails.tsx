import React, { useEffect, useState } from 'react';
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
import { HierarchySelector } from '../components/HierarchySelector';
import type { HierarchySelection } from '../components/HierarchySelector';
import { useSensorDetailsQuery } from '../features/sensors/hooks/useSensors';

export const SensorDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();

  const { data: sensor, isLoading, isError, error } = useSensorDetailsQuery(id ?? '');

  // Simulate resolving the rest of the hierarchy based on the device
  // In a real app, the API might return orgId, tenantId, etc. along with the sensor.
  // For the sake of demonstration of the breadcrumb, we just need to ensure deviceId is passed.
  const [selection, setSelection] = useState<HierarchySelection>({
    orgId: '',
    tenantId: '',
    projectId: '',
    gatewayId: '',
    deviceId: '',
  });

  useEffect(() => {
    if (sensor) {
      setSelection((prev) => ({ ...prev, deviceId: sensor.device_id }));
    }
  }, [sensor]);

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={() => navigate('/sensors')}
          sx={{ textTransform: 'none', mb: 2 }}
        >
          Back to Sensors
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Sensor Profile
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Detailed view of sensor calibration, limits, and live data.
        </Typography>
        
        {/* Breadcrumb representation */}
        {sensor && (
          <Box sx={{ mt: 2, p: 1.5, bgcolor: 'background.paper', borderRadius: 1, border: `1px solid ${theme.palette.divider}` }}>
            <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase', mb: 0.5, display: 'block' }}>
              Hierarchy Path
            </Typography>
            <HierarchySelector selection={selection} variant="breadcrumb" />
          </Box>
        )}
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && (
        <Alert severity="error">
          {(error as any)?.message ?? 'Failed to load sensor.'}
        </Alert>
      )}

      {sensor && (
        <Card sx={{ boxShadow: 'none', border: `1px solid ${theme.palette.divider}` }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {sensor.name}
              </Typography>
              <StatusChip status={sensor.status} size="medium" />
            </Box>

            <Divider sx={{ mb: 4 }} />

            <Grid container spacing={3}>
              <Grid size={12}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  General Information
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Sensor Code
                </Typography>
                <Typography variant="body1" sx={{ fontWeight: 700, color: 'primary.main', mb: 2 }}>
                  {sensor.code}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Sensor Type
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {sensor.sensor_type}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 6 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Measurement Unit
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {sensor.unit || '—'}
                </Typography>

                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Data Type
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {sensor.data_type}
                </Typography>
              </Grid>
              
              <Grid size={12}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Description
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {sensor.description || '—'}
                </Typography>
              </Grid>

              <Grid size={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Calibration & Sampling
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Sampling Interval
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {sensor.sampling_interval} seconds
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Calibration Scale (Multiplier)
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  x {sensor.calibration_scale}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Calibration Offset (Additive)
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  + {sensor.calibration_offset}
                </Typography>
              </Grid>

              <Grid size={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Operating Limits
                </Typography>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Minimum Value
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {sensor.min_value !== null ? sensor.min_value : '—'}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Maximum Value
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {sensor.max_value !== null ? sensor.max_value : '—'}
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Default Value
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {sensor.default_value !== null ? sensor.default_value : '—'}
                </Typography>
              </Grid>

              <Grid size={12}>
                <Divider sx={{ my: 2 }} />
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                  Metadata
                </Typography>
              </Grid>

              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Created
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {new Date(sensor.created_at).toLocaleString()}
                </Typography>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Last Updated
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {new Date(sensor.updated_at).toLocaleString()}
                </Typography>
              </Grid>
              
              <Grid size={{ xs: 12, sm: 4 }}>
                <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                  Last Reading At
                </Typography>
                <Typography variant="body1" sx={{ mb: 2 }}>
                  {sensor.last_reading_at ? new Date(sensor.last_reading_at).toLocaleString() : 'Never'}
                </Typography>
              </Grid>
              
            </Grid>
          </CardContent>
        </Card>
      )}
    </Box>
  );
};
