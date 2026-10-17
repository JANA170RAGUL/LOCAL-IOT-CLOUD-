import React from 'react';
import { Box, Typography, List, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import AssessmentIcon from '@mui/icons-material/Assessment';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import type { WidgetConfig } from '../../types';
import type { WidgetManifest } from '../../registry/types';

export const AiInsightsWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  const insights: string[] = (config as any).insights || [];
  const hasData = insights.length > 0;

  return (
    <Box sx={{ height: '100%', p: 2, display: 'flex', flexDirection: 'column', bgcolor: 'background.paper', overflowY: 'auto' }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center' }}>
        <AssessmentIcon sx={{ mr: 1, color: 'primary.main' }} />
        {config.title || "Today's Summary"}
      </Typography>

      {!hasData ? (
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8f9fa', p: 2, borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary" align="center">
            No platform insights generated.
          </Typography>
        </Box>
      ) : (
        <List dense disablePadding>
          {insights.map((insight: string, idx: number) => (
            <ListItem key={idx} alignItems="flex-start" sx={{ px: 0 }}>
              <ListItemIcon sx={{ minWidth: 24, mt: 0.5 }}>
                <FiberManualRecordIcon sx={{ fontSize: 8, color: 'primary.main' }} />
              </ListItemIcon>
              <ListItemText 
                primary={
                  <Typography variant="body2" color="text.secondary">
                    {insight}
                  </Typography>
                } 
              />
            </ListItem>
          ))}
        </List>
      )}
    </Box>
  );
};

export const AiInsightsWidgetManifest: WidgetManifest = {
  type: 'ai-insights',
  name: 'AI Insights',
  category: 'AI',
  subcategory: 'Monitoring',
  description: 'Automatically summarizes platform status.',
  icon: AssessmentIcon,
  component: AiInsightsWidget,
  defaultWidth: 4,
  defaultHeight: 3,
  minWidth: 3,
  minHeight: 2,
  supportsMobile: true,
  configurable: true,
  defaultConfig: {
    type: 'ai-insights',
    title: 'Platform Summary'
  }
};
