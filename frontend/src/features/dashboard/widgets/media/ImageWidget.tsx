import React from 'react';
import { Box, Typography } from '@mui/material';
import ImageIcon from '@mui/icons-material/Image';
import type { WidgetConfig } from '../../types';
import type { WidgetManifest } from '../../registry/types';

export const ImageWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  const imageUrl = (config as any).imageUrl || 'https://via.placeholder.com/400x300?text=Placeholder+Image';

  return (
    <Box sx={{ height: '100%', width: '100%', position: 'relative' }}>
      <img 
        src={imageUrl} 
        alt={config.title || 'Widget Image'} 
        style={{ width: '100%', height: '100%', objectFit: 'contain' }}
      />
      {config.title && (
        <Box sx={{ position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', p: 0.5 }}>
          <Typography variant="caption" color="white" sx={{ ml: 1 }}>
            {config.title}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export const ImageWidgetManifest: WidgetManifest = {
  type: 'image',
  name: 'Static Image',
  category: 'Media',
  description: 'Displays a static or dynamically configured image.',
  icon: ImageIcon,
  component: ImageWidget,
  defaultWidth: 3,
  defaultHeight: 3,
  configurable: true,
  defaultConfig: {
    type: 'image',
    timeRange: '15m',
    refresh: 'live'
  }
};
