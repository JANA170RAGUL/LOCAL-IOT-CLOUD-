import React, { useState, useEffect } from 'react';
import { Box, Typography, Switch, FormControlLabel } from '@mui/material';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import type { WidgetConfig } from '../../types';
import type { WidgetManifest } from '../../registry/types';

export const ClockWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  const [time, setTime] = useState(new Date());
  const [useUTC, setUseUTC] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const displayTime = useUTC 
    ? time.toLocaleTimeString('en-US', { timeZone: 'UTC', hour12: false })
    : time.toLocaleTimeString('en-US', { hour12: false });

  const displayDate = useUTC
    ? time.toLocaleDateString('en-US', { timeZone: 'UTC', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
    : time.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2, alignItems: 'center', justifyContent: 'center' }}>
      <Typography variant="h3" sx={{ fontFamily: 'monospace', fontWeight: 'bold', color: 'primary.main', mb: 1 }}>
        {displayTime}
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom>
        {displayDate}
      </Typography>
      <FormControlLabel
        control={<Switch size="small" checked={useUTC} onChange={(e) => setUseUTC(e.target.checked)} />}
        label={<Typography variant="caption" color="text.secondary">UTC</Typography>}
        sx={{ position: 'absolute', bottom: 8, right: 8, m: 0 }}
      />
    </Box>
  );
};

export const ClockWidgetManifest: WidgetManifest = {
  type: 'clock',
  name: 'Digital Clock',
  category: 'Utility',
  description: 'Displays current local or UTC time.',
  icon: AccessTimeIcon,
  component: ClockWidget,
  defaultWidth: 3,
  defaultHeight: 2,
  minWidth: 2,
  minHeight: 2,
  supportsMobile: true,
  configurable: true,
  defaultConfig: {
    type: 'clock'
  }
};
