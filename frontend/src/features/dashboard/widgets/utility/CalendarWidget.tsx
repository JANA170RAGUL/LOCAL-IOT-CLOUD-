import React from 'react';
import { Box, Typography } from '@mui/material';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import type { WidgetConfig } from '../../types';
import type { WidgetManifest } from '../../registry/types';

export const CalendarWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  const today = new Date();
  const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
  const firstDay = new Date(today.getFullYear(), today.getMonth(), 1).getDay();
  
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: firstDay }, (_, i) => null);

  return (
    <Box sx={{ height: '100%', p: 2, display: 'flex', flexDirection: 'column' }}>
      <Typography variant="subtitle1" sx={{ textAlign: 'center', mb: 1, fontWeight: 'bold' }}>
        {today.toLocaleString('default', { month: 'long', year: 'numeric' })}
      </Typography>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5, flexGrow: 1 }}>
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(d => (
          <Typography key={d} variant="caption" color="text.secondary" sx={{ textAlign: 'center', fontWeight: 'bold' }}>
            {d}
          </Typography>
        ))}
        
        {blanks.map((_, i) => <Box key={`blank-${i}`} />)}
        
        {days.map(d => (
          <Box 
            key={d} 
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              bgcolor: d === today.getDate() ? 'primary.main' : 'background.paper',
              color: d === today.getDate() ? 'primary.contrastText' : 'text.primary',
              borderRadius: 1,
              border: '1px solid',
              borderColor: 'divider',
              fontSize: '0.8rem'
            }}
          >
            {d}
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export const CalendarWidgetManifest: WidgetManifest = {
  type: 'calendar',
  name: 'Calendar',
  category: 'Utility',
  description: 'Displays a simple monthly calendar.',
  icon: CalendarMonthIcon,
  component: CalendarWidget,
  defaultWidth: 3,
  defaultHeight: 3,
  minWidth: 3,
  minHeight: 3,
  supportsMobile: true,
  configurable: true,
  defaultConfig: {
    type: 'calendar'
  }
};
