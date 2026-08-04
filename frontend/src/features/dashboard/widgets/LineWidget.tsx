import React from 'react';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import ShowChartIcon from '@mui/icons-material/ShowChart';
import { LineChart } from '../../../components/charts/LineChart';
import { useTelemetryHistoryQuery } from '../../telemetry/hooks/useTelemetry';
import type { WidgetConfig } from '../types';
import type { WidgetManifest } from '../registry/types';

export const LineWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  // Convert friendly range to API params
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

  // Filter numeric values only
  const numericData = data.items
    .filter(d => typeof d.value === 'number')
    .map(d => ({ timestamp: d.timestamp, value: Number(d.value) }));

  return (
    <LineChart
      data={numericData}
      title={config.title}
      seriesName={config.sensorCode}
      color={config.color}
      height="100%"
    />
  );
};

export const LineWidgetManifest: WidgetManifest = {
  type: 'line',
  name: 'Line Chart',
  category: 'Charts',
  description: 'Displays historical telemetry data as a continuous line over time.',
  icon: ShowChartIcon,
  component: LineWidget,
  defaultConfig: {
    type: 'line',
    timeRange: '1h',
    refresh: 'live'
  }
};
