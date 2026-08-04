import React from 'react';
import { Box } from '@mui/material';
import ArticleIcon from '@mui/icons-material/Article';
import type { WidgetConfig } from '../../types';
import type { WidgetManifest } from '../../registry/types';

export const MarkdownWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  // In a real implementation we would use a library like react-markdown.
  // For this basic widget without adding new dependencies, we will just render raw text/simple HTML.
  const content = (config as any).content || `# Maintenance\nStop Pump 2\nBefore 12 PM`;

  return (
    <Box sx={{ height: '100%', p: 2, overflowY: 'auto' }}>
      <pre style={{ whiteSpace: 'pre-wrap', fontFamily: 'inherit', margin: 0 }}>
        {content}
      </pre>
    </Box>
  );
};

export const MarkdownWidgetManifest: WidgetManifest = {
  type: 'markdown',
  name: 'Markdown Note',
  category: 'Utility',
  description: 'Displays static markdown text (SOPs, Instructions).',
  icon: ArticleIcon,
  component: MarkdownWidget,
  defaultWidth: 4,
  defaultHeight: 3,
  minWidth: 2,
  minHeight: 2,
  supportsMobile: true,
  configurable: true,
  defaultConfig: {
    type: 'markdown',
    content: 'Add markdown content here.'
  }
};
