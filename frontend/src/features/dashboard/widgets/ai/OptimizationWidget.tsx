import React from 'react';
import { Box, Typography, Button, Divider } from '@mui/material';
import TuneIcon from '@mui/icons-material/Tune';
import ArrowForwardIosIcon from '@mui/icons-material/ArrowForwardIos';
import type { WidgetConfig } from '../../types';
import type { WidgetManifest } from '../../registry/types';

export const OptimizationWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  const optimizations = (config as any).mockOptimizations ?? [
    { title: "Reduce energy usage", desc: "Shift heavy loads to off-peak hours.", impact: "High" },
    { title: "Improve production", desc: "Increase conveyor speed by 5%.", impact: "Medium" }
  ];

  return (
    <Box sx={{ height: '100%', p: 2, display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', color: '#1976d2' }}>
        <TuneIcon sx={{ mr: 1 }} />
        {config.title || 'Optimization Engine'}
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Suggested operational improvements based on historical data.
      </Typography>

      <Box sx={{ flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {optimizations.map((opt: any, idx: number) => (
          <Box key={idx} sx={{ p: 1.5, border: '1px solid', borderColor: 'divider', borderRadius: 1, '&:hover': { bgcolor: '#f5f5f5' } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{opt.title}</Typography>
              <Typography variant="caption" sx={{ 
                px: 1, py: 0.25, borderRadius: 1, 
                bgcolor: opt.impact === 'High' ? '#e8f5e9' : '#fff8e1', 
                color: opt.impact === 'High' ? '#2e7d32' : '#f57f17',
                fontWeight: 'bold'
              }}>
                {opt.impact} Impact
              </Typography>
            </Box>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>{opt.desc}</Typography>
            <Button size="small" endIcon={<ArrowForwardIosIcon sx={{ fontSize: 10 }} />} sx={{ textTransform: 'none', px: 0 }}>
              Review & Apply
            </Button>
          </Box>
        ))}
      </Box>
    </Box>
  );
};

export const OptimizationWidgetManifest: WidgetManifest = {
  type: 'ai-optimization',
  name: 'Optimization',
  category: 'AI',
  subcategory: 'Actionable',
  description: 'Suggests strategic operational improvements.',
  icon: TuneIcon,
  component: OptimizationWidget,
  defaultWidth: 4,
  defaultHeight: 4,
  minWidth: 3,
  minHeight: 3,
  supportsMobile: true,
  configurable: true,
  supportsCommands: true,
  defaultConfig: {
    type: 'ai-optimization',
    title: 'Plant Optimization'
  }
};
