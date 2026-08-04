import React from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import PropaneTankIcon from '@mui/icons-material/PropaneTank';
import { useLatestTelemetryQuery } from '../../../telemetry/hooks/useTelemetry';
import type { WidgetConfig } from '../../types';
import type { WidgetManifest } from '../../registry/types';

export const TankLevelWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
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
  
  const min = 0;
  const max = 100; // Usually tank levels are reported as percentage 0-100
  const percentage = Math.max(0, Math.min(100, ((value - min) / (max - min)) * 100));
  
  let color = '#2196f3'; // Water blue
  if (percentage < 15) color = '#f44336'; // Low Warning
  if (percentage > 90) color = '#ff9800'; // High Warning

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {config.title || 'Tank Level'}
      </Typography>
      
      <Box sx={{ flexGrow: 1, position: 'relative', width: '100px', my: 2 }}>
        {/* Tank Container SVG */}
        <svg viewBox="0 0 100 150" style={{ width: '100%', height: '100%', overflow: 'visible' }}>
          {/* Tank Body (Background) */}
          <rect x="10" y="20" width="80" height="120" rx="10" fill="#e0e0e0" stroke="#9e9e9e" strokeWidth="2" />
          {/* Tank Top Cap */}
          <path d="M 20 20 Q 50 0 80 20" fill="#e0e0e0" stroke="#9e9e9e" strokeWidth="2" />
          {/* Tank Bottom Cap */}
          <path d="M 20 140 Q 50 160 80 140" fill="#e0e0e0" stroke="#9e9e9e" strokeWidth="2" />

          {/* Liquid Mask to keep it inside the rounded corners */}
          <clipPath id="tank-clip">
            <rect x="12" y="20" width="76" height="120" rx="8" />
            <path d="M 20 140 Q 50 158 80 140 Z" />
          </clipPath>

          {/* The Liquid */}
          <g clipPath="url(#tank-clip)">
            <rect 
              x="12" 
              y={140 - (percentage * 1.2)} 
              width="76" 
              height={percentage * 1.2 + 10} 
              fill={color} 
              style={{ transition: 'all 1s ease' }} 
            />
            {/* Wave effect at top of liquid */}
            <path 
              d={`M 12 ${140 - (percentage * 1.2)} Q 30 ${135 - (percentage * 1.2)} 50 ${140 - (percentage * 1.2)} T 88 ${140 - (percentage * 1.2)} L 88 150 L 12 150 Z`} 
              fill="rgba(255,255,255,0.2)" 
              style={{ transition: 'all 1s ease' }}
            />
          </g>

          {/* Ruler marks */}
          <line x1="10" y1="50" x2="15" y2="50" stroke="#757575" strokeWidth="1" />
          <line x1="10" y1="80" x2="15" y2="80" stroke="#757575" strokeWidth="1" />
          <line x1="10" y1="110" x2="15" y2="110" stroke="#757575" strokeWidth="1" />
        </svg>

        {/* Absolute percentage text over the tank */}
        <Typography 
          variant="h6" 
          sx={{ 
            position: 'absolute', 
            top: '50%', 
            left: '50%', 
            transform: 'translate(-50%, -50%)',
            fontWeight: 'bold',
            color: percentage > 50 ? 'white' : 'text.primary',
            textShadow: percentage > 50 ? '1px 1px 2px rgba(0,0,0,0.5)' : 'none',
            zIndex: 1
          }}
        >
          {percentage.toFixed(0)}%
        </Typography>
      </Box>
    </Box>
  );
};

export const TankLevelWidgetManifest: WidgetManifest = {
  type: 'tank_level',
  name: 'Tank Level',
  category: 'Industrial',
  description: 'Animated industrial tank showing fluid levels.',
  icon: PropaneTankIcon,
  component: TankLevelWidget,
  supportedTelemetry: ['level', 'volume'],
  defaultWidth: 2,
  defaultHeight: 3,
  configurable: true,
  defaultConfig: {
    type: 'tank_level',
    timeRange: '15m',
    refresh: 'live'
  }
};
