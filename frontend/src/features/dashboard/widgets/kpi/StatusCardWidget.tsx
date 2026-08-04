import React from 'react';
import { Box, Typography, Paper, Divider } from '@mui/material';
import InfoIcon from '@mui/icons-material/Info';
import { useLatestTelemetryQuery } from '../../../../features/telemetry/hooks/useTelemetry';
import type { WidgetConfig } from '../../types';
import type { WidgetManifest } from '../../registry/types';

export const StatusCardWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  const { data } = useLatestTelemetryQuery(config.deviceId);
  
  // Extract multiple telemetry values to build the card
  const statusReading = data?.find(d => d.sensor_code === 'status')?.value || 'Running';
  const tempReading = data?.find(d => d.sensor_code === 'temperature')?.value || '32';
  const operator = (config as any).operator || 'John Doe';

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
      <Typography variant="subtitle1" color="text.primary" sx={{ fontWeight: 'bold', mb: 1 }}>
        {config.title || 'Machine Status'}
      </Typography>
      <Paper elevation={0} sx={{ flexGrow: 1, backgroundColor: 'background.default', borderRadius: 2, p: 2, display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">Status</Typography>
          <Typography variant="body1" sx={{ color: statusReading === 'Running' ? 'success.main' : 'error.main', fontWeight: 'bold' }}>
            {String(statusReading).toUpperCase()}
          </Typography>
        </Box>
        <Divider sx={{ my: 1 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">Temperature</Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            {tempReading}°C
          </Typography>
        </Box>
        <Divider sx={{ my: 1 }} />
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="body2" color="text.secondary">Operator</Typography>
          <Typography variant="body1" sx={{ fontWeight: 'bold' }}>
            {operator}
          </Typography>
        </Box>

      </Paper>
    </Box>
  );
};

export const StatusCardWidgetManifest: WidgetManifest = {
  type: 'status_card',
  name: 'Status Card',
  category: 'KPI',
  description: 'Compact summary card for multiple related metrics.',
  icon: InfoIcon,
  component: StatusCardWidget,
  defaultWidth: 3,
  defaultHeight: 3,
  minWidth: 2,
  minHeight: 3,
  supportsRealtime: true,
  supportsMobile: true,
  configurable: true,
  defaultConfig: {
    type: 'status_card',
    refresh: 'live'
  }
};
