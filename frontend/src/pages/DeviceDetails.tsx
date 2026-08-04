import React, { useState } from 'react';
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
  Tabs,
  Tab
} from '@mui/material';
import { ArrowBack as BackIcon, WifiTethering as LiveIcon } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { StatusChip } from '../components/StatusChip';
import { useDeviceDetailsQuery } from '../features/devices/hooks/useDevices';
import { useLatestTelemetryQuery, useTelemetryStream } from '../features/telemetry/hooks/useTelemetry';
import { DeviceCommandsTab } from './DeviceCommandsTab';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
dayjs.extend(relativeTime);

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`device-tabpanel-${index}`}
      aria-labelledby={`device-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ pt: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export const DeviceDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const theme = useTheme();

  const [tabIndex, setTabIndex] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabIndex(newValue);
  };

  const { data: device, isLoading, isError, error } = useDeviceDetailsQuery(id ?? '');

  // Live Telemetry
  const { data: telemetry } = useLatestTelemetryQuery(id ?? '');
  useTelemetryStream(id ?? '');

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Button
          variant="outlined"
          startIcon={<BackIcon />}
          onClick={() => navigate('/devices')}
          sx={{ textTransform: 'none', mb: 2 }}
        >
          Back to Devices
        </Button>
        <Typography variant="h4" sx={{ fontWeight: 700 }}>
          Device Profile
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Detailed view of the device configuration and hardware info.
        </Typography>
      </Box>

      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress />
        </Box>
      )}

      {isError && (
        <Alert severity="error">
          {(error as any)?.message ?? 'Failed to load device.'}
        </Alert>
      )}

      {device && (
        <Card sx={{ boxShadow: 'none', border: `1px solid ${theme.palette.divider}` }}>
          <CardContent sx={{ p: 4 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {device.name}
              </Typography>
              <StatusChip status={device.status} size="medium" />
            </Box>

            <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Tabs value={tabIndex} onChange={handleTabChange} aria-label="device tabs">
                <Tab label="Overview" />
                <Tab label="Telemetry" />
                <Tab label="Commands" />
              </Tabs>
            </Box>

            <CustomTabPanel value={tabIndex} index={0}>
              <Grid container spacing={3}>
                <Grid size={12}>
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    General Information
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Device Code
                  </Typography>
                  <Typography variant="body1" sx={{ fontWeight: 700, color: 'primary.main', mb: 2 }}>
                    {device.code}
                  </Typography>

                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Device Type
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {device.device_type || '—'}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Gateway ID
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2, fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {device.gateway_id}
                  </Typography>

                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Description
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {device.description || '—'}
                  </Typography>
                </Grid>

                <Grid size={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Hardware Information
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Manufacturer
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {device.manufacturer || '—'}
                  </Typography>

                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Model
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {device.model || '—'}
                  </Typography>
                  
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Serial Number
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {device.serial_number || '—'}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Hardware Version
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {device.hardware_version || '—'}
                  </Typography>
                  
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Firmware Version
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {device.firmware_version || '—'}
                  </Typography>
                </Grid>
                
                <Grid size={12}>
                  <Divider sx={{ my: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 600, mb: 2 }}>
                    Network Information
                  </Typography>
                </Grid>
                
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    IP Address
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2, fontFamily: 'monospace' }}>
                    {device.ip_address || '—'}
                  </Typography>
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    MAC Address
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2, fontFamily: 'monospace' }}>
                    {device.mac_address || '—'}
                  </Typography>
                </Grid>

                <Grid size={12}>
                  <Divider sx={{ my: 2 }} />
                </Grid>

                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Created
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {new Date(device.created_at).toLocaleString()}
                  </Typography>

                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Last Updated
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {new Date(device.updated_at).toLocaleString()}
                  </Typography>
                </Grid>
                
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="subtitle2" color="text.secondary" sx={{ fontWeight: 600 }}>
                    Last Seen
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    {device.last_seen ? new Date(device.last_seen).toLocaleString() : 'Never'}
                  </Typography>
                </Grid>
              </Grid>
            </CustomTabPanel>

            <CustomTabPanel value={tabIndex} index={1}>
              <Grid container spacing={3}>
                <Grid size={12}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <LiveIcon color="success" sx={{ mr: 1, animation: 'pulse 2s infinite' }} />
                    <Typography variant="h6" sx={{ fontWeight: 600 }}>
                      Live Sensor Values
                    </Typography>
                  </Box>
                </Grid>

                {(!telemetry || telemetry.length === 0) ? (
                  <Grid size={12}>
                    <Alert severity="info">No telemetry data received yet.</Alert>
                  </Grid>
                ) : (
                  telemetry.map((point) => (
                    <Grid size={{ xs: 12, sm: 4, md: 3 }} key={point.sensor_code}>
                      <Card sx={{ bgcolor: 'background.default', border: `1px solid ${theme.palette.divider}` }}>
                        <CardContent sx={{ p: 2, '&:last-child': { pb: 2 } }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, textTransform: 'uppercase' }}>
                            {point.sensor_code}
                          </Typography>
                          <Box sx={{ mt: 1, mb: 1, display: 'flex', alignItems: 'baseline' }}>
                            <Typography variant="h4" sx={{ fontWeight: 700, color: 'primary.main', mr: 1 }}>
                              {typeof point.value === 'number' ? Number(point.value).toFixed(2) : String(point.value)}
                            </Typography>
                            {point.data_type !== 'string' && point.data_type !== 'boolean' && (
                              <Typography variant="subtitle2" color="text.secondary">
                                {point.sensor_type}
                              </Typography>
                            )}
                          </Box>
                          <Typography variant="caption" color="text.secondary">
                            Updated {dayjs(point.timestamp).fromNow()}
                          </Typography>
                        </CardContent>
                      </Card>
                    </Grid>
                  ))
                )}
              </Grid>
            </CustomTabPanel>

            <CustomTabPanel value={tabIndex} index={2}>
              <DeviceCommandsTab deviceId={device.id} />
            </CustomTabPanel>

          </CardContent>
        </Card>
      )}
    </Box>
  );
};
