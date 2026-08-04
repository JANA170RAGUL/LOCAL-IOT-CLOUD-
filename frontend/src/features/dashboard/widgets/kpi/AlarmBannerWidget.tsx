import React from 'react';
import { Box, Typography } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import type { WidgetConfig } from '../../types';
import type { WidgetManifest } from '../../registry/types';

export const AlarmBannerWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  // In a real implementation, this would subscribe to an active alerts feed.
  // We mock a scrolling ticker for demonstration.
  const activeAlarms = [
    { id: 1, message: '⚠ HIGH TEMPERATURE - Device 23 - 45°C', priority: 'critical' },
    { id: 2, message: '⚠ PUMP PRESSURE LOW - Zone 4 - 1.2 Bar', priority: 'warning' },
  ];

  return (
    <Box sx={{ 
      height: '100%', 
      display: 'flex', 
      alignItems: 'center', 
      backgroundColor: 'error.dark',
      color: 'white',
      overflow: 'hidden',
      px: 2
    }}>
      <WarningAmberIcon sx={{ mr: 2, animation: 'pulse 1s infinite' }} />
      <Box sx={{ whiteSpace: 'nowrap', overflow: 'hidden', position: 'relative', flexGrow: 1 }}>
        <Box sx={{
          display: 'inline-block',
          animation: 'scroll 15s linear infinite'
        }}>
          {activeAlarms.map((alarm, idx) => (
            <Typography key={alarm.id} component="span" variant="h6" sx={{ mr: 10, fontWeight: 'bold' }}>
              {alarm.message}
            </Typography>
          ))}
        </Box>
      </Box>

      <style>
        {`
          @keyframes scroll {
            0% { transform: translateX(100%); }
            100% { transform: translateX(-100%); }
          }
          @keyframes pulse {
            0% { opacity: 1; }
            50% { opacity: 0.5; }
            100% { opacity: 1; }
          }
        `}
      </style>
    </Box>
  );
};

export const AlarmBannerWidgetManifest: WidgetManifest = {
  type: 'alarm_banner',
  name: 'Alarm Banner',
  category: 'KPI',
  description: 'Scrolling marquee displaying critical active alerts.',
  icon: WarningAmberIcon,
  component: AlarmBannerWidget,
  defaultWidth: 12,
  defaultHeight: 1,
  minWidth: 4,
  minHeight: 1,
  supportsRealtime: true,
  supportsMobile: true,
  configurable: false,
  defaultConfig: {
    type: 'alarm_banner'
  }
};
