import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import FindInPageIcon from '@mui/icons-material/FindInPage';
import CheckBoxIcon from '@mui/icons-material/CheckBox';
import type { WidgetConfig } from '../../types';
import type { WidgetManifest } from '../../registry/types';

export const RootCauseAnalysisWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  const alertName = (config as any).alertName;
  const causes: any[] = (config as any).causes || [];

  const hasData = alertName || causes.length > 0;

  return (
    <Box sx={{ height: '100%', p: 2, display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center' }}>
        <FindInPageIcon sx={{ mr: 1, color: hasData ? 'error.main' : 'text.primary' }} />
        {config.title || 'Root Cause Analysis'}
      </Typography>

      {!hasData ? (
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8f9fa', p: 2, borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary" align="center">
            No active root cause analysis available.
          </Typography>
        </Box>
      ) : (
        <>
          {alertName && (
            <Box sx={{ mb: 2, p: 1.5, bgcolor: '#ffebee', borderRadius: 1, borderLeft: '4px solid #f44336' }}>
              <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 'bold' }}>Active Alert</Typography>
              <Typography variant="body2" sx={{ color: 'error.dark', fontWeight: 'bold' }}>{alertName}</Typography>
            </Box>
          )}

          <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: 'text.secondary' }}>
            Likely Causes
          </Typography>

          <Box sx={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 1.5 }}>
            {causes.map((cause: any, idx: number) => (
              <Box key={idx}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                    <CheckBoxIcon sx={{ fontSize: 16, mr: 0.5, color: cause.probability > 80 ? 'error.main' : 'text.secondary' }} />
                    {cause.text}
                  </Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: cause.probability > 80 ? 'error.main' : 'text.primary' }}>
                    {cause.probability}%
                  </Typography>
                </Box>
                <LinearProgress 
                  variant="determinate" 
                  value={cause.probability} 
                  color={cause.probability > 80 ? 'error' : cause.probability > 40 ? 'warning' : 'primary'} 
                  sx={{ height: 6, borderRadius: 3 }}
                />
              </Box>
            ))}
          </Box>
        </>
      )}
    </Box>
  );
};

export const RootCauseAnalysisWidgetManifest: WidgetManifest = {
  type: 'ai-root-cause',
  name: 'Root Cause Analysis',
  category: 'AI',
  subcategory: 'Diagnostics',
  description: 'Identifies the likely causes of active alerts.',
  icon: FindInPageIcon,
  component: RootCauseAnalysisWidget,
  defaultWidth: 4,
  defaultHeight: 4,
  minWidth: 3,
  minHeight: 3,
  supportsMobile: true,
  configurable: true,
  defaultConfig: {
    type: 'ai-root-cause',
    title: 'RCA: Pump System'
  }
};
