import React from 'react';
import { Box, CircularProgress, Typography, Alert } from '@mui/material';
import { BarChart } from '../../../components/charts/BarChart';
import { useTelemetryHistoryQuery, useTelemetryStream } from '../../telemetry/hooks/useTelemetry';
import type { WidgetConfig } from '../types';
import type { WidgetManifest } from '../registry/types';
import BarChartIcon from '@mui/icons-material/BarChart';
import dayjs from 'dayjs';

export const BarWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
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

  // Bar charts often use 'sum' or 'count', but default to 'mean' if undefined
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

  const numericData = data.items.filter(d => typeof d.value === 'number');
  const categories = numericData.map(d => dayjs(d.timestamp).format('HH:mm'));
  const values = numericData.map(d => Number(d.value));

  return (
    <BarChart
      categories={categories}
      data={values}
      title={config.title}
      seriesName={config.sensorCode}
      color={config.color}
      height="100%"
    />
  );
};

export const BarWidgetManifest: WidgetManifest = {
  type: 'bar',
  name: 'Bar Chart',
  category: 'Charts',
  description: 'Displays historical or aggregated data using vertical bars.',
  icon: BarChartIcon,
  component: BarWidget,
  defaultConfig: {
    type: 'bar',
    timeRange: '1h',
    refresh: 'static'
  }
};
