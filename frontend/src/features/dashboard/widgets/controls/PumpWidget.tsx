import React, { useState } from 'react';
import { Box, Typography, IconButton, CircularProgress } from '@mui/material';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import { CommandConfirmationDialog } from './CommandConfirmationDialog';
import type { WidgetConfig } from '../../types';
import type { WidgetManifest } from '../../registry/types';

export const PumpWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  const [isOn, setIsOn] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, setIsPending] = useState(false);

  const handleToggle = () => {
    setDialogOpen(true);
  };

  const handleCommandSuccess = () => {
    setIsPending(true);
    setTimeout(() => {
      setIsOn(!isOn);
      setIsPending(false);
    }, 1000);
  };

  const color = isPending ? '#ffeb3b' : (isOn ? '#2196f3' : '#9e9e9e');

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {config.title || 'Pump Control'}
      </Typography>

      <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        {isOn && !isPending && (
          <WaterDropIcon 
            sx={{ 
              position: 'absolute', 
              top: '10px', 
              color: '#90caf9', 
              animation: 'drip 1s infinite' 
            }} 
          />
        )}
        <IconButton 
          onClick={handleToggle} 
          disabled={isPending}
          sx={{ 
            width: 80, 
            height: 80, 
            backgroundColor: isOn ? 'rgba(33, 150, 243, 0.1)' : 'transparent',
            border: `4px solid ${color}`,
            borderRadius: '50%'
          }}
        >
          {isPending ? (
            <CircularProgress size={50} />
          ) : (
            <svg viewBox="0 0 100 100" width="60" height="60" style={{ animation: isOn ? 'spin 1s linear infinite' : 'none' }}>
              {/* Impeller blades */}
              <path d="M 50 10 L 60 50 L 50 90 L 40 50 Z" fill={color} />
              <path d="M 10 50 L 50 60 L 90 50 L 50 40 Z" fill={color} />
              <circle cx="50" cy="50" r="10" fill={color} />
            </svg>
          )}
        </IconButton>
      </Box>

      <Typography variant="h6" sx={{ fontWeight: 'bold', color, mt: 1 }}>
        {isPending ? 'SENDING...' : (isOn ? 'ON' : 'OFF')}
      </Typography>

      <style>
        {`
          @keyframes spin { 100% { transform: rotate(360deg); } }
          @keyframes drip { 0% { transform: translateY(0); opacity: 1; } 100% { transform: translateY(40px); opacity: 0; } }
        `}
      </style>

      <CommandConfirmationDialog 
        open={dialogOpen}
        deviceId={config.deviceId}
        commandName={isOn ? 'OFF' : 'ON'}
        commandPayload={{ component: 'pump', action: isOn ? 'off' : 'on' }}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleCommandSuccess}
      />
    </Box>
  );
};

export const PumpWidgetManifest: WidgetManifest = {
  type: 'pump',
  name: 'Pump',
  category: 'Industrial',
  description: 'Interactive pump control (On/Off).',
  icon: WaterDropIcon,
  component: PumpWidget,
  supportedCommands: ['ON', 'OFF'],
  requiresConfirmation: true,
  requiresResponse: true,
  defaultWidth: 2,
  defaultHeight: 2,
  configurable: true,
  defaultConfig: {
    type: 'pump',
    timeRange: '15m',
    refresh: 'live'
  }
};
