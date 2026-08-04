import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import { useLatestTelemetryQuery } from '../../../../features/telemetry/hooks/useTelemetry';
import type { WidgetConfig } from '../../types';
import type { WidgetManifest } from '../../registry/types';

export const ProgressWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  const { data } = useLatestTelemetryQuery(config.deviceId);
  
  const telemetryKey = (config as any).sensorCode || 'level';
  const reading = data?.find(d => d.sensor_code === telemetryKey);
  const value = reading ? Math.min(Math.max(Number(reading.value), 0), 100) : 75; // Default 75%

  const getColor = (val: number) => {
    if (val < 20) return 'error';
    if (val < 50) return 'warning';
    return 'success';
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2, justifyContent: 'center' }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {config.title || 'Progress Indicator'}
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
        <Box sx={{ width: '100%', mr: 2 }}>
          <LinearProgress 
            variant="determinate" 
            value={value} 
            color={getColor(value)}
            sx={{ height: 16, borderRadius: 8 }}
          />
        </Box>
        <Box sx={{ minWidth: 45 }}>
          <Typography variant="body1" color="text.secondary" sx={{ fontWeight: 'bold' }}>
            {Math.round(value)}%
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export const ProgressWidgetManifest: WidgetManifest = {
  type: 'progress',
  name: 'Progress Bar',
  category: 'KPI',
  description: 'Horizontal progress bar representing a percentage (0-100%).',
  icon: BatteryChargingFullIcon,
  component: ProgressWidget,
  defaultWidth: 3,
  defaultHeight: 2,
  minWidth: 2,
  minHeight: 1,
  supportsRealtime: true,
  supportsMobile: true,
  configurable: true,
  defaultConfig: {
    type: 'progress',
    refresh: 'live'
  }
};
