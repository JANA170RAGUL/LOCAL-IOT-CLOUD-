import React from 'react';
import { Box } from '@mui/material';
import WebAssetIcon from '@mui/icons-material/WebAsset';
import type { WidgetConfig } from '../../types';
import type { WidgetManifest } from '../../registry/types';

export const IFrameWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  const url = (config as any).url || 'https://example.com';

  return (
    <Box sx={{ height: '100%', width: '100%' }}>
      <iframe
        src={url}
        style={{ width: '100%', height: '100%', border: 'none' }}
        title={config.title || 'Embedded Content'}
        sandbox="allow-scripts allow-same-origin allow-popups allow-forms"
      />
    </Box>
  );
};

export const IFrameWidgetManifest: WidgetManifest = {
  type: 'iframe',
  name: 'IFrame Embed',
  category: 'Utility',
  description: 'Embed external web pages or dashboards.',
  icon: WebAssetIcon,
  component: IFrameWidget,
  defaultWidth: 6,
  defaultHeight: 6,
  minWidth: 3,
  minHeight: 3,
  supportsMobile: false,
  configurable: true,
  defaultConfig: {
    type: 'iframe',
    url: 'https://example.com'
  }
};
