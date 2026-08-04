import React from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import BoltIcon from '@mui/icons-material/Bolt';
import { useLatestTelemetryQuery } from '../../../telemetry/hooks/useTelemetry';
import type { WidgetConfig } from '../../types';
import type { WidgetManifest } from '../../registry/types';

export const EnergyMeterWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  const { data, isLoading, isError, error } = useLatestTelemetryQuery(config.deviceId);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return (
      <Box sx={{ p: 2, height: '100%', overflow: 'auto' }}>
        <Alert severity="error">{(error as Error).message}</Alert>
      </Box>
    );
  }

  const reading = data?.find((d) => d.sensor_code === config.sensorCode);
  const value = reading ? Number(reading.value) : 0;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="subtitle2" color="text.secondary">
          {config.title || 'Power Consumption'}
        </Typography>
        <BoltIcon sx={{ color: '#ffb300' }} />
      </Box>
      
      <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Box sx={{ textAlign: 'center' }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', color: 'text.primary', display: 'inline-block' }}>
            {value.toLocaleString()}
          </Typography>
          <Typography variant="subtitle1" sx={{ color: 'text.secondary', display: 'inline-block', ml: 1 }}>
            W
          </Typography>
        </Box>
      </Box>
      
      <Box sx={{ mt: 'auto', display: 'flex', justifyContent: 'center' }}>
        <Typography variant="caption" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
          ● Live Active Power
        </Typography>
      </Box>
    </Box>
  );
};

export const EnergyMeterWidgetManifest: WidgetManifest = {
  type: 'energy_meter',
  name: 'Energy Meter',
  category: 'Industrial',
  description: 'Displays current power consumption or totalized energy.',
  icon: BoltIcon,
  component: EnergyMeterWidget,
  supportedTelemetry: ['power', 'energy', 'current', 'voltage'],
  defaultWidth: 2,
  defaultHeight: 2,
  configurable: true,
  defaultConfig: {
    type: 'energy_meter',
    timeRange: '15m',
    refresh: 'live'
  }
};
