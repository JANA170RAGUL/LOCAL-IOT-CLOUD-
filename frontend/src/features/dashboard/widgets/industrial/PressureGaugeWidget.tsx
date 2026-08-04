import React from 'react';
import { Box, CircularProgress, Alert } from '@mui/material';
import SpeedIcon from '@mui/icons-material/Speed';
import { GaugeChart } from '../../../../components/charts/GaugeChart';
import { useLatestTelemetryQuery } from '../../../telemetry/hooks/useTelemetry';
import type { WidgetConfig } from '../../types';
import type { WidgetManifest } from '../../registry/types';
import { useTheme } from '@mui/material/styles';

export const PressureGaugeWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  const { data, isLoading, isError, error } = useLatestTelemetryQuery(config.deviceId);
  const theme = useTheme();

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
  
  // Custom pressure color logic
  let color = theme.palette.info.main;
  if (value > 8) color = theme.palette.error.main;
  else if (value > 6) color = theme.palette.warning.main;

  return (
    <Box sx={{ height: '100%', width: '100%', p: 1 }}>
      <GaugeChart 
        value={Number(value.toFixed(2))} 
        title={config.title || 'Pressure'} 
        unit="bar"
        min={0}
        max={10}
        color={color}
        height="100%"
      />
    </Box>
  );
};

export const PressureGaugeWidgetManifest: WidgetManifest = {
  type: 'pressure_gauge',
  name: 'Pressure Gauge',
  category: 'Industrial',
  description: 'Analog dial styled for pressure metrics.',
  icon: SpeedIcon,
  component: PressureGaugeWidget,
  supportedTelemetry: ['pressure'],
  defaultWidth: 3,
  defaultHeight: 3,
  configurable: true,
  defaultConfig: {
    type: 'pressure_gauge',
    timeRange: '15m',
    refresh: 'live'
  }
};
