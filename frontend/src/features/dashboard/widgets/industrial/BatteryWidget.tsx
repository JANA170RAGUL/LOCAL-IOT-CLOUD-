import React from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import BatteryChargingFullIcon from '@mui/icons-material/BatteryChargingFull';
import { useLatestTelemetryQuery } from '../../../telemetry/hooks/useTelemetry';
import type { WidgetConfig } from '../../types';
import type { WidgetManifest } from '../../registry/types';

export const BatteryWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
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
  
  // Assume battery is 0-100 percentage.
  const percentage = Math.max(0, Math.min(100, value));
  
  let color = '#4caf50'; // Green
  if (percentage < 20) color = '#f44336'; // Red
  else if (percentage < 40) color = '#ff9800'; // Orange

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ mb: 2 }}>
        {config.title || 'Battery Level'}
      </Typography>
      
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <Box sx={{ position: 'relative', width: '80px', height: '40px' }}>
          {/* Battery Body Outline */}
          <Box sx={{ 
            position: 'absolute', 
            top: 0, 
            left: 0, 
            width: '74px', 
            height: '100%', 
            border: '3px solid', 
            borderColor: 'text.secondary', 
            borderRadius: '6px',
            p: '2px'
          }}>
            {/* Battery Fill */}
            <Box sx={{ 
              height: '100%', 
              width: `${percentage}%`, 
              backgroundColor: color, 
              borderRadius: '2px',
              transition: 'all 0.5s ease'
            }} />
          </Box>
          {/* Battery Nub */}
          <Box sx={{ 
            position: 'absolute', 
            right: 0, 
            top: '50%', 
            transform: 'translateY(-50%)', 
            width: '4px', 
            height: '16px', 
            backgroundColor: 'text.secondary', 
            borderTopRightRadius: '4px', 
            borderBottomRightRadius: '4px' 
          }} />
        </Box>

        <Typography variant="h5" sx={{ fontWeight: 'bold', ml: 1, color: 'text.primary' }}>
          {percentage.toFixed(0)}%
        </Typography>
      </Box>
    </Box>
  );
};

export const BatteryWidgetManifest: WidgetManifest = {
  type: 'battery',
  name: 'Battery',
  category: 'Industrial',
  description: 'Battery icon showing current charge level.',
  icon: BatteryChargingFullIcon,
  component: BatteryWidget,
  supportedTelemetry: ['battery', 'charge'],
  defaultWidth: 2,
  defaultHeight: 2,
  configurable: true,
  defaultConfig: {
    type: 'battery',
    timeRange: '15m',
    refresh: 'live'
  }
};
