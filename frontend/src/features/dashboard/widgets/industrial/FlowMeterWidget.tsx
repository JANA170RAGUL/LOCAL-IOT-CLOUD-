import React from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import { useLatestTelemetryQuery } from '../../../telemetry/hooks/useTelemetry';
import type { WidgetConfig } from '../../types';
import type { WidgetManifest } from '../../registry/types';

export const FlowMeterWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
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
  
  // Animation duration inversely proportional to flow (clamp between 0.5s and 5s)
  let animDuration = 0;
  if (value > 0) {
     animDuration = Math.max(0.5, 100 / value);
     animDuration = Math.min(animDuration, 5);
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom sx={{ alignSelf: 'flex-start' }}>
        {config.title || 'Flow Rate'}
      </Typography>
      
      <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <Box sx={{ 
          position: 'relative', 
          width: '80px', 
          height: '80px', 
          borderRadius: '50%', 
          border: '4px solid #1976d2',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#e3f2fd',
          overflow: 'hidden'
        }}>
          {value > 0 ? (
            <AutorenewIcon 
              sx={{ 
                fontSize: '60px', 
                color: '#1976d2', 
                animation: `spin ${animDuration}s linear infinite` 
              }} 
            />
          ) : (
            <Typography variant="caption" sx={{ color: '#1976d2', fontWeight: 'bold' }}>STOP</Typography>
          )}
        </Box>
        
        {/* Pipe decorations */}
        <Box sx={{ position: 'absolute', left: '-20px', width: '20px', height: '30px', backgroundColor: '#90caf9', zIndex: -1 }} />
        <Box sx={{ position: 'absolute', right: '-20px', width: '20px', height: '30px', backgroundColor: '#90caf9', zIndex: -1 }} />
      </Box>

      <Typography variant="h5" sx={{ fontWeight: 'bold', mt: 2 }}>
        {value.toFixed(1)} <Typography variant="caption">L/min</Typography>
      </Typography>

      <style>
        {`
          @keyframes spin {
            100% {
              transform: rotate(360deg);
            }
          }
        `}
      </style>
    </Box>
  );
};

export const FlowMeterWidgetManifest: WidgetManifest = {
  type: 'flow_meter',
  name: 'Flow Meter',
  category: 'Industrial',
  description: 'Displays fluid flow rate with an animated turbine.',
  icon: WaterDropIcon,
  component: FlowMeterWidget,
  supportedTelemetry: ['flow', 'volume'],
  defaultWidth: 2,
  defaultHeight: 2,
  configurable: true,
  defaultConfig: {
    type: 'flow_meter',
    timeRange: '15m',
    refresh: 'live'
  }
};
