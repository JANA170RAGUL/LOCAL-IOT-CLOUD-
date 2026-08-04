import React from 'react';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { KpiCard } from '../../../components/charts/KpiCard';
import { useLatestTelemetryQuery, useTelemetryStream } from '../../telemetry/hooks/useTelemetry';
import type { WidgetConfig } from '../types';
import type { WidgetManifest } from '../registry/types';
import NumbersIcon from '@mui/icons-material/Numbers';

export const KpiWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  const { data, isLoading, isError, error } = useLatestTelemetryQuery(config.deviceId);
  
  // Connect stream if live
  const { isConnected } = useTelemetryStream(config.refresh === 'live' ? config.deviceId : '');

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 2 }}>
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
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 2 }}>
        <Typography variant="body2" color="text.secondary">No Data</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ position: 'relative', height: '100%' }}>
      <KpiCard
        title={config.title}
        value={typeof point.value === 'boolean' ? String(point.value) : point.value}
        // Unit can be inferred or passed if added to config
      />
      {config.refresh === 'live' && isConnected && (
        <Box sx={{ position: 'absolute', top: 12, right: 12, width: 8, height: 8, borderRadius: '50%', bgcolor: 'success.main', animation: 'pulse 2s infinite' }} title="Live Stream Active" />
      )}
    </Box>
  );
};

export const KpiWidgetManifest: WidgetManifest = {
  type: 'kpi',
  name: 'KPI Card',
  category: 'KPI',
  description: 'Displays the latest telemetry value as a large number.',
  icon: NumbersIcon,
  component: KpiWidget,
  defaultConfig: {
    type: 'kpi',
    timeRange: '15m',
    refresh: 'live'
  }
};
