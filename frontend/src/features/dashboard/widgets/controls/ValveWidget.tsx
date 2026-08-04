import React, { useState } from 'react';
import { Box, Typography, IconButton, CircularProgress } from '@mui/material';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz'; // Fallback icon for manifest
import { CommandConfirmationDialog } from './CommandConfirmationDialog';
import type { WidgetConfig } from '../../types';
import type { WidgetManifest } from '../../registry/types';

export const ValveWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  const [isOpen, setIsOpen] = useState(false); // Optimistic state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [isPending, setIsPending] = useState(false); // For visual feedback after clicking

  const handleToggle = () => {
    setDialogOpen(true);
  };

  const handleCommandSuccess = () => {
    setIsPending(true);
    // Optimistic UI Update: Flip state immediately
    setTimeout(() => {
      setIsOpen(!isOpen);
      setIsPending(false);
    }, 1000); // Simulate network/device delay
  };

  const color = isPending ? '#ffeb3b' : (isOpen ? '#4caf50' : '#f44336');

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', p: 2 }}>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        {config.title || 'Valve Control'}
      </Typography>

      <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
        <IconButton 
          onClick={handleToggle} 
          disabled={isPending}
          sx={{ 
            width: 80, 
            height: 80, 
            transition: 'transform 0.3s',
            '&:hover': { transform: 'scale(1.1)' }
          }}
        >
          {isPending ? (
            <CircularProgress size={60} />
          ) : (
            <svg viewBox="0 0 100 100" width="100%" height="100%">
              {/* Valve stem */}
              <rect x="45" y="10" width="10" height="40" fill={color} />
              {/* Valve handle */}
              <rect x="25" y="5" width="50" height="10" rx="5" fill={color} />
              {/* Left triangle */}
              <polygon points="10,20 50,50 10,80" fill={color} />
              {/* Right triangle */}
              <polygon points="90,20 50,50 90,80" fill={color} />
            </svg>
          )}
        </IconButton>
      </Box>

      <Typography variant="h6" sx={{ fontWeight: 'bold', color, mt: 1 }}>
        {isPending ? 'SENDING...' : (isOpen ? 'OPEN' : 'CLOSED')}
      </Typography>

      <CommandConfirmationDialog 
        open={dialogOpen}
        deviceId={config.deviceId}
        commandName={isOpen ? 'CLOSE' : 'OPEN'}
        commandPayload={{ component: 'valve', action: isOpen ? 'close' : 'open' }}
        onClose={() => setDialogOpen(false)}
        onSuccess={handleCommandSuccess}
      />
    </Box>
  );
};

export const ValveWidgetManifest: WidgetManifest = {
  type: 'valve',
  name: 'Valve',
  category: 'Industrial',
  description: 'Interactive valve control (Open/Close).',
  icon: SwapHorizIcon,
  component: ValveWidget,
  supportedCommands: ['OPEN', 'CLOSE'],
  requiresConfirmation: true,
  requiresResponse: true,
  defaultWidth: 2,
  defaultHeight: 2,
  configurable: true,
  defaultConfig: {
    type: 'valve',
    timeRange: '15m',
    refresh: 'live'
  }
};
