import React from 'react';
import { Box, Typography, Tooltip } from '@mui/material';
import FactoryIcon from '@mui/icons-material/Factory';
import { useLatestTelemetryQuery } from '../../../../features/telemetry/hooks/useTelemetry';
import type { WidgetConfig } from '../../types';
import type { WidgetManifest } from '../../registry/types';

export const FloorLayoutWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  const { data } = useLatestTelemetryQuery(config.deviceId);
  
  // Simulated configuration for the floor plan
  const layoutImage = (config as any).layoutImage || 'https://upload.wikimedia.org/wikipedia/commons/4/4b/Floor_plan_example.png';
  
  // Example of mapped markers. In reality, these come from widget configuration
  // mapping telemetry sensor codes to X/Y coordinates on the image.
  const markers = [
    { id: '1', x: 30, y: 40, sensorCode: 'temp_1', label: 'Zone A Temp' },
    { id: '2', x: 70, y: 60, sensorCode: 'status_1', label: 'Pump 1' },
    { id: '3', x: 80, y: 20, sensorCode: 'pressure_1', label: 'Main Valve' }
  ];

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 1, display: 'flex', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
        <FactoryIcon sx={{ mr: 1, color: 'text.secondary' }} />
        <Typography variant="subtitle2" sx={{ flexGrow: 1 }} noWrap>
          {config.title || 'Plant Layout'}
        </Typography>
      </Box>
      <Box sx={{ flexGrow: 1, position: 'relative', overflow: 'auto', backgroundColor: '#f5f5f5' }}>
        <Box sx={{ position: 'relative', display: 'inline-block', minWidth: '100%', minHeight: '100%' }}>
          <img 
            src={layoutImage} 
            alt="Floor Plan" 
            style={{ width: '100%', height: '100%', objectFit: 'contain', opacity: 0.8 }} 
          />
          
          {markers.map((marker) => {
            const reading = data?.find(d => d.sensor_code === marker.sensorCode);
            // Example logic: if value > threshold, red, else green.
            const isAlarm = reading ? Number(reading.value) > 80 : false;
            const color = isAlarm ? '#f44336' : '#4caf50';

            return (
              <Tooltip key={marker.id} title={`${marker.label}: ${reading ? reading.value : 'N/A'}`}>
                <Box
                  sx={{
                    position: 'absolute',
                    top: `${marker.y}%`,
                    left: `${marker.x}%`,
                    width: 20,
                    height: 20,
                    backgroundColor: color,
                    borderRadius: '50%',
                    transform: 'translate(-50%, -50%)',
                    cursor: 'pointer',
                    boxShadow: `0 0 10px ${color}`,
                    animation: isAlarm ? 'pulse 1.5s infinite' : 'none',
                    border: '2px solid white'
                  }}
                />
              </Tooltip>
            );
          })}
        </Box>
      </Box>

      <style>
        {`
          @keyframes pulse {
            0% { transform: translate(-50%, -50%) scale(1); box-shadow: 0 0 0 0 rgba(244, 67, 54, 0.7); }
            70% { transform: translate(-50%, -50%) scale(1.2); box-shadow: 0 0 0 10px rgba(244, 67, 54, 0); }
            100% { transform: translate(-50%, -50%) scale(1); box-shadow: 0 0 0 0 rgba(244, 67, 54, 0); }
          }
        `}
      </style>
    </Box>
  );
};

export const FloorLayoutWidgetManifest: WidgetManifest = {
  type: 'floor_layout',
  name: 'Floor Layout',
  category: 'Maps',
  description: 'Upload a plant layout and overlay telemetry markers.',
  icon: FactoryIcon,
  component: FloorLayoutWidget,
  defaultWidth: 4,
  defaultHeight: 4,
  configurable: true,
  defaultConfig: {
    type: 'floor_layout',
    timeRange: '15m',
    refresh: 'live'
  }
};
