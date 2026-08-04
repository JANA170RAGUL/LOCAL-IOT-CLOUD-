import React, { useState } from 'react';
import { Box, Typography, IconButton, CircularProgress } from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import { CommandConfirmationDialog } from './CommandConfirmationDialog';
import { useLatestTelemetryQuery } from '../../../../features/telemetry/hooks/useTelemetry';
import type { WidgetConfig } from '../../types';
import type { WidgetManifest } from '../../registry/types';

export const LedIndicatorWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  const { data } = useLatestTelemetryQuery(config.deviceId);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  // Read status from telemetry if available (0=Gray, 1=Green, 2=Yellow, 3=Red, 4=Blue)
  const reading = data?.find((d) => d.sensor_code === config.sensorCode);
  const statusValue = reading ? Number(reading.value) : 1; // Default to Green for demo

  let ledColor = '#9e9e9e'; // Gray
  let statusText = 'OFFLINE';
  
  if (statusValue === 1) { ledColor = '#4caf50'; statusText = 'ONLINE'; }
  else if (statusValue === 2) { ledColor = '#ffeb3b'; statusText = 'WARNING'; }
  else if (statusValue === 3) { ledColor = '#f44336'; statusText = 'ALARM'; }
  else if (statusValue === 4) { ledColor = '#2196f3'; statusText = 'ACTIVE'; }

  const handleToggle = () => {
    setDialogOpen(true);
  };

  const handleCommandSuccess = () => {
    setIsPending(true);
    setTimeout(() => {
      setIsPending(false);
    }, 1000);
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {config.title || 'Status Indicator'}
      </Typography>

      <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <IconButton 
          onClick={handleToggle} 
          disabled={isPending}
          sx={{ 
            width: 80, 
            height: 80, 
            backgroundColor: ledColor, 
            boxShadow: `0 0 20px ${ledColor}`,
            border: '2px solid rgba(255,255,255,0.2)',
            transition: 'all 0.3s ease'
          }}
        >
          {isPending ? (
            <CircularProgress size={40} style={{ color: 'white' }} />
          ) : (
            <LightbulbIcon sx={{ fontSize: 40, color: 'white' }} />
          )}
        </IconButton>
      </Box>

      <Typography variant="h6" sx={{ fontWeight: 'bold', color: ledColor, mt: 2 }}>
        {statusText}
      </Typography>

      <CommandConfirmationDialog 
        open={dialogOpen}
        deviceId={config.deviceId}
        commandName="ACKNOWLEDGE"
        commandPayload={{ component: 'led', action: 'ack' }}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleCommandSuccess}
      />
    </Box>
  );
};

export const LedIndicatorWidgetManifest: WidgetManifest = {
  type: 'led_indicator',
  name: 'LED Indicator',
  category: 'Industrial',
  description: 'Colored LED indicator with acknowledge action.',
  icon: LightbulbIcon,
  component: LedIndicatorWidget,
  supportedTelemetry: ['status', 'state'],
  supportedCommands: ['ACKNOWLEDGE'],
  requiresConfirmation: true,
  requiresResponse: false,
  defaultWidth: 2,
  defaultHeight: 2,
  configurable: true,
  defaultConfig: {
    type: 'led_indicator',
    timeRange: '15m',
    refresh: 'live'
  }
};
