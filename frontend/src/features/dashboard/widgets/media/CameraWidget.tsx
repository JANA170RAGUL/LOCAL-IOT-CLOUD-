import React from 'react';
import { Box, Typography } from '@mui/material';
import VideocamIcon from '@mui/icons-material/Videocam';
import type { WidgetConfig } from '../../types';
import type { WidgetManifest } from '../../registry/types';

export const CameraWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  // In a real implementation, config would store the stream URL
  const streamUrl = (config as any).streamUrl || 'https://upload.wikimedia.org/wikipedia/commons/2/28/SMPTE_Color_Bars_16x9.svg';

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 1, display: 'flex', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.8)', color: 'white' }}>
        <VideocamIcon sx={{ mr: 1, color: '#f44336' }} />
        <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
          {config.title || 'Live Camera Feed'}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Box sx={{ width: 8, height: 8, borderRadius: '50%', backgroundColor: '#4caf50' }} />
          <Typography variant="caption">LIVE</Typography>
        </Box>
      </Box>
      <Box sx={{ flexGrow: 1, backgroundColor: 'black', position: 'relative', overflow: 'hidden' }}>
        <img 
          src={streamUrl} 
          alt="Live Stream" 
          style={{ width: '100%', height: '100%', objectFit: 'contain' }}
          onError={(e) => {
            (e.target as HTMLImageElement).src = 'https://upload.wikimedia.org/wikipedia/commons/2/28/SMPTE_Color_Bars_16x9.svg';
          }}
        />
      </Box>
    </Box>
  );
};

export const CameraWidgetManifest: WidgetManifest = {
  type: 'camera',
  name: 'Camera Feed',
  category: 'Media',
  description: 'Displays an MJPEG live camera stream.',
  icon: VideocamIcon,
  component: CameraWidget,
  defaultWidth: 4,
  defaultHeight: 4,
  configurable: true,
  defaultConfig: {
    type: 'camera',
    timeRange: '15m',
    refresh: 'live'
  }
};
