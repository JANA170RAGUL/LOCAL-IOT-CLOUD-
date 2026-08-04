import React from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import DeviceThermostatIcon from '@mui/icons-material/DeviceThermostat';
import { useLatestTelemetryQuery } from '../../../telemetry/hooks/useTelemetry';
import type { WidgetConfig } from '../../types';
import type { WidgetManifest } from '../../registry/types';

export const ThermometerWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
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

  // Find the specific sensor value or fallback
  const reading = data?.find((d) => d.sensor_code === config.sensorCode);
  const value = reading ? Number(reading.value) : 0;
  
  // Thermometer config (in a real app, this comes from WidgetConfig)
  const min = 0;
  const max = 100;
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  
  // Color logic
  let color = '#4caf50'; // Normal
  if (percentage > 85) color = '#f44336'; // Critical
  else if (percentage > 70) color = '#ff9800'; // Warning
  else if (percentage < 15) color = '#2196f3'; // Cold

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {config.title || 'Temperature'}
      </Typography>
      
      <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'flex-end', position: 'relative', width: '60px', pb: 4 }}>
        {/* Thermometer Glass SVG */}
        <svg viewBox="0 0 100 300" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          {/* Outer Glass */}
          <rect x="35" y="20" width="30" height="220" rx="15" fill="#e0e0e0" />
          <circle cx="50" cy="240" r="30" fill="#e0e0e0" />
          
          {/* Inner Liquid Track */}
          <rect x="42" y="30" width="16" height="210" rx="8" fill="#ffffff" />
          <circle cx="50" cy="240" r="22" fill="#ffffff" />

          {/* Liquid Level */}
          <circle cx="50" cy="240" r="20" fill={color} style={{ transition: 'fill 0.5s ease' }} />
          <rect 
            x="44" 
            y={240 - (percentage * 2)} // Max height is 200, so 100% = 200px up from 240 = 40
            width="12" 
            height={percentage * 2} 
            rx="6" 
            fill={color} 
            style={{ transition: 'all 0.5s ease' }} 
          />
        </svg>
      </Box>

      <Typography variant="h4" sx={{ fontWeight: 'bold', color }}>
        {value.toFixed(1)}°
      </Typography>
    </Box>
  );
};

export const ThermometerWidgetManifest: WidgetManifest = {
  type: 'thermometer',
  name: 'Thermometer',
  category: 'Industrial',
  description: 'Vertical temperature indicator with color zones.',
  icon: DeviceThermostatIcon,
  component: ThermometerWidget,
  supportedTelemetry: ['temperature', 'humidity'],
  defaultWidth: 2,
  defaultHeight: 3,
  configurable: true,
  defaultConfig: {
    type: 'thermometer',
    timeRange: '15m',
    refresh: 'live'
  }
};
