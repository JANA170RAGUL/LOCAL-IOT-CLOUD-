import React from 'react';
import { Box } from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import type { WidgetConfig } from '../../types';
import type { WidgetManifest } from '../../registry/types';

export const HtmlWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  const htmlContent = (config as any).html || `<div style="padding: 10px; color: blue;">Custom HTML block</div>`;

  return (
    <Box 
      sx={{ height: '100%', width: '100%', overflow: 'auto' }}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};

export const HtmlWidgetManifest: WidgetManifest = {
  type: 'html',
  name: 'HTML Block',
  category: 'Utility',
  description: 'Renders custom HTML/CSS content.',
  icon: CodeIcon,
  component: HtmlWidget,
  defaultWidth: 4,
  defaultHeight: 4,
  minWidth: 2,
  minHeight: 2,
  supportsMobile: true,
  configurable: true,
  defaultConfig: {
    type: 'html',
    html: '<h1>Hello World</h1>'
  }
};
