import React from 'react';
import { Box, Typography } from '@mui/material';
import type { WidgetConfig } from '../types';
import { WidgetRegistry } from '../registry/WidgetRegistry';

export interface WidgetRendererProps {
  config: WidgetConfig;
}

/**
 * Factory component that mounts the correct widget class
 * based on the configuration JSON.
 */
export const WidgetRenderer: React.FC<WidgetRendererProps> = ({ config }) => {
  const manifest = WidgetRegistry.get(config.type);
  
  if (!manifest) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%', p: 2 }}>
        <Typography variant="body2" color="error">Unknown Widget Type: {config.type}</Typography>
      </Box>
    );
  }
  
  const WidgetComponent = manifest.component;
  return <WidgetComponent config={config} />;
};
