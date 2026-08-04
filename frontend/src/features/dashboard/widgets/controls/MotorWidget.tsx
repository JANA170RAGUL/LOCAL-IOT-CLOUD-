import React, { useState } from 'react';
import { Box, Typography, IconButton, CircularProgress } from '@mui/material';
import SettingsIcon from '@mui/icons-material/Settings';
import { CommandConfirmationDialog } from './CommandConfirmationDialog';
import type { WidgetConfig } from '../../types';
import type { WidgetManifest } from '../../registry/types';

export const MotorWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleToggle = () => {
    setDialogOpen(true);
  };

  const handleCommandSuccess = () => {
    setIsPending(true);
    setTimeout(() => {
      setIsRunning(!isRunning);
      setIsPending(false);
    }, 1000);
  };

  const color = isPending ? '#ffeb3b' : (isRunning ? '#4caf50' : '#9e9e9e');

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {config.title || 'Motor Control'}
      </Typography>

      <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <IconButton 
          onClick={handleToggle} 
          disabled={isPending}
          sx={{ width: 80, height: 80 }}
        >
          {isPending ? (
            <CircularProgress size={60} />
          ) : (
            <SettingsIcon 
              sx={{ 
                fontSize: 80, 
                color, 
                animation: isRunning ? 'spin 2s linear infinite' : 'none' 
              }} 
            />
          )}
        </IconButton>
      </Box>

      <Typography variant="h6" sx={{ fontWeight: 'bold', color, mt: 1 }}>
        {isPending ? 'SENDING...' : (isRunning ? 'RUNNING' : 'STOPPED')}
      </Typography>

      <style>
        {`
          @keyframes spin {
            100% { transform: rotate(360deg); }
          }
        `}
      </style>

      <CommandConfirmationDialog 
        open={dialogOpen}
        deviceId={config.deviceId}
        commandName={isRunning ? 'STOP' : 'START'}
        commandPayload={{ component: 'motor', action: isRunning ? 'stop' : 'start' }}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleCommandSuccess}
      />
    </Box>
  );
};

export const MotorWidgetManifest: WidgetManifest = {
  type: 'motor',
  name: 'Motor',
  category: 'Industrial',
  description: 'Interactive motor control (Start/Stop).',
  icon: SettingsIcon,
  component: MotorWidget,
  supportedCommands: ['START', 'STOP'],
  requiresConfirmation: true,
  requiresResponse: true,
  defaultWidth: 2,
  defaultHeight: 2,
  configurable: true,
  defaultConfig: {
    type: 'motor',
    timeRange: '15m',
    refresh: 'live'
  }
};
