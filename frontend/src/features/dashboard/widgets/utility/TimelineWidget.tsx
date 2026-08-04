import React from 'react';
import { Box, Typography } from '@mui/material';
import TimelineIcon from '@mui/icons-material/Timeline';
import type { WidgetConfig } from '../../types';
import type { WidgetManifest } from '../../registry/types';

export const TimelineWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  const events = [
    { time: '09:30', message: 'Pump Started', color: 'success.main' },
    { time: '09:35', message: 'Valve Opened', color: 'info.main' },
    { time: '09:40', message: 'Alarm Triggered', color: 'error.main' },
    { time: '09:41', message: 'Operator Acknowledged', color: 'warning.main' }
  ];

  return (
    <Box sx={{ height: '100%', p: 2, overflowY: 'auto' }}>
      <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 'bold' }}>
        {config.title || 'Activity Timeline'}
      </Typography>
      <Box sx={{ position: 'relative', ml: 2, borderLeft: 2, borderColor: 'divider' }}>
        {events.map((ev, idx) => (
          <Box key={idx} sx={{ position: 'relative', pl: 3, pb: 2 }}>
            <Box sx={{
              position: 'absolute',
              left: -7,
              top: 4,
              width: 12,
              height: 12,
              borderRadius: '50%',
              bgcolor: ev.color,
              border: '2px solid',
              borderColor: 'background.paper'
            }} />
            <Typography variant="caption" color="text.secondary">{ev.time}</Typography>
            <Typography variant="body2">{ev.message}</Typography>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export const TimelineWidgetManifest: WidgetManifest = {
  type: 'timeline',
  name: 'Timeline',
  category: 'Utility',
  description: 'Chronological list of events.',
  icon: TimelineIcon,
  component: TimelineWidget,
  defaultWidth: 4,
  defaultHeight: 4,
  minWidth: 3,
  minHeight: 3,
  supportsMobile: true,
  configurable: true,
  defaultConfig: {
    type: 'timeline'
  }
};
