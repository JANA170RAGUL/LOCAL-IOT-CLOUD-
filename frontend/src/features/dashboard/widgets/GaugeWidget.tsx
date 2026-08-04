import React from 'react';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { GaugeChart } from '../../../components/charts/GaugeChart';
import { useLatestTelemetryQuery, useTelemetryStream } from '../../telemetry/hooks/useTelemetry';
import type { WidgetConfig } from '../types';
import type { WidgetManifest } from '../registry/types';
import SpeedIcon from '@mui/icons-material/Speed';

export const GaugeWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  // Gauge is typically a live dial, so we use Latest telemetry instead of history
  const { data, isLoading, isError, error } = useLatestTelemetryQuery(config.deviceId);
  
  // If config.refresh is live, hook up the stream
  const { isConnected } = useTelemetryStream(config.refresh === 'live' ? config.deviceId : '');

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (isError) {
    return (
      <Alert severity="error" sx={{ m: 1 }}>
        {(error as any)?.message || 'Failed to load widget data'}
      </Alert>
    );
  }

  const point = data?.find(d => d.sensor_code === config.sensorCode);

  if (!point) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Typography variant="body2" color="text.secondary">No Data</Typography>
      </Box>
    );
  }

  const value = typeof point.value === 'number' ? point.value : parseFloat(String(point.value)) || 0;

  return (
    <Box sx={{ position: 'relative', height: '100%' }}>
      <GaugeChart
        value={value}
        title={config.title}
        color={config.color}
        height="100%"
        // Extrapolate unit or min/max from config if added later
      />
      {config.refresh === 'live' && isConnected && (
        <Box sx={{ position: 'absolute', top: 4, right: 4, width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main', animation: 'pulse 2s infinite' }} title="Live Stream Active" />
      )}
    </Box>
  );
};

export const GaugeWidgetManifest: WidgetManifest = {
  type: 'gauge',
  name: 'Gauge',
  category: 'Gauges',
  description: 'Displays the latest telemetry value on a dial gauge.',
  icon: SpeedIcon,
  component: GaugeWidget,
  defaultConfig: {
    type: 'gauge',
    timeRange: '15m',
    refresh: 'live'
  }
};
