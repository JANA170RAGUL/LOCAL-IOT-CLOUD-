import React from 'react';
import { Box, Typography, Table, TableBody, TableCell, TableHead, TableRow, Chip } from '@mui/material';
import ListAltIcon from '@mui/icons-material/ListAlt';
import type { WidgetConfig } from '../../types';
import type { WidgetManifest } from '../../registry/types';

export const EventLogWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  const logs = [
    { time: '10:00:01', level: 'INFO', msg: 'Gateway Connected' },
    { time: '10:05:22', level: 'WARNING', msg: 'High Temperature' },
    { time: '10:12:45', level: 'ERROR', msg: 'Pump Failure' },
    { time: '10:15:00', level: 'INFO', msg: 'System Reboot' }
  ];

  const getColor = (lvl: string) => {
    switch (lvl) {
      case 'INFO': return 'success';
      case 'WARNING': return 'warning';
      case 'ERROR': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ height: '100%', p: 1, overflowY: 'auto' }}>
      <Typography variant="subtitle2" sx={{ ml: 1, mb: 1, fontWeight: 'bold' }}>
        {config.title || 'Event Logs'}
      </Typography>
      <Table size="small" stickyHeader>
        <TableHead>
          <TableRow>
            <TableCell>Time</TableCell>
            <TableCell>Level</TableCell>
            <TableCell>Message</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {logs.map((log, idx) => (
            <TableRow key={idx}>
              <TableCell sx={{ fontSize: '0.75rem', color: 'text.secondary', whiteSpace: 'nowrap' }}>{log.time}</TableCell>
              <TableCell><Chip label={log.level} size="small" color={getColor(log.level) as any} sx={{ height: 20, fontSize: '0.65rem' }}/></TableCell>
              <TableCell sx={{ fontSize: '0.8rem' }}>{log.msg}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
};

export const EventLogWidgetManifest: WidgetManifest = {
  type: 'event_log',
  name: 'Event Log',
  category: 'Utility',
  description: 'Tabular view of system logs and events.',
  icon: ListAltIcon,
  component: EventLogWidget,
  defaultWidth: 6,
  defaultHeight: 4,
  minWidth: 4,
  minHeight: 3,
  supportsMobile: false,
  configurable: true,
  defaultConfig: {
    type: 'event_log'
  }
};
