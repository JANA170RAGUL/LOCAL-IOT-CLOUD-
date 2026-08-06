import React from 'react';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import TimelineIcon from '@mui/icons-material/Timeline';
import { AreaChart } from '../../../components/charts/AreaChart';
import { useTelemetryHistoryQuery, useTelemetryStream } from '../../telemetry/hooks/useTelemetry';
import type { WidgetConfig } from '../types';
import type { WidgetManifest } from '../registry/types';

export const AreaWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  // Connect live WebSocket stream if refresh is live
  useTelemetryStream(config.refresh === 'live' ? config.deviceId : '');

  const rangeMap: Record<string, { start: string; window: string }> = {
    '15m': { start: '-15m', window: '10s' },
    '1h': { start: '-1h', window: '1m' },
    '6h': { start: '-6h', window: '5m' },
    '24h': { start: '-24h', window: '15m' },
    '7d': { start: '-7d', window: '1h' },
  };

  const params = rangeMap[config.timeRange] || rangeMap['1h'];

  const { data, isLoading, isError, error } = useTelemetryHistoryQuery(
    config.deviceId,
    {
      start_time: params.start,
      end_time: 'now()',
      window: params.window,
      sensor_codes: [config.sensorCode],
      aggregation: config.aggregation || 'mean',
    }
  );

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

  if (!data || data.items.length === 0) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <Typography variant="body2" color="text.secondary">No Data</Typography>
      </Box>
    );
  }

  const numericData = data.items
    .filter(d => typeof d.value === 'number')
    .map(d => ({ timestamp: d.timestamp, value: Number(d.value) }));

  return (
    <AreaChart
      data={numericData}
      title={config.title}
      seriesName={config.sensorCode}
      color={config.color}
      height="100%"
    />
  );
};

export const AreaWidgetManifest: WidgetManifest = {
  type: 'area',
  name: 'Area Chart',
  category: 'Charts',
  description: 'Displays historical telemetry data with a filled area under the line.',
  icon: TimelineIcon,
  component: AreaWidget,
  defaultConfig: {
    type: 'area',
    timeRange: '1h',
    refresh: 'live'
  }
};
