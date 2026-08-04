import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import type { WidgetConfig } from '../../types';
import type { WidgetManifest } from '../../registry/types';

export const AiRecommendationWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  const recommendation = (config as any).mockRecommendation ?? "Reduce Pump Speed";
  const reason = (config as any).mockReason ?? "Energy consumption increased by 18%";
  const savings = (config as any).mockSavings ?? "11%";

  return (
    <Box sx={{ height: '100%', p: 2, display: 'flex', flexDirection: 'column', bgcolor: '#fffde7', border: '1px solid #fff59d' }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center', color: '#f57f17' }}>
        <LightbulbIcon sx={{ mr: 1 }} />
        {config.title || 'AI Recommendation'}
      </Typography>

      <Box sx={{ flexGrow: 1 }}>
        <Typography variant="h6" sx={{ color: 'text.primary', mb: 1, fontWeight: 'bold' }}>
          {recommendation}
        </Typography>

        <Box sx={{ mb: 2 }}>
          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>Reason</Typography>
          <Typography variant="body2">{reason}</Typography>
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#e8f5e9', p: 1, borderRadius: 1 }}>
          <Typography variant="body2" sx={{ color: 'success.dark', fontWeight: 'bold' }}>Potential Savings</Typography>
          <Typography variant="body1" sx={{ color: 'success.main', fontWeight: 'bold' }}>{savings}</Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'flex', gap: 1, mt: 2 }}>
        <Button variant="contained" color="primary" startIcon={<CheckCircleIcon />} fullWidth size="small" sx={{ textTransform: 'none' }}>
          Approve
        </Button>
        <Button variant="outlined" color="inherit" startIcon={<CancelIcon />} fullWidth size="small" sx={{ textTransform: 'none' }}>
          Ignore
        </Button>
      </Box>
    </Box>
  );
};

export const AiRecommendationWidgetManifest: WidgetManifest = {
  type: 'ai-recommendation',
  name: 'AI Recommendation',
  category: 'AI',
  subcategory: 'Actionable',
  description: 'Provides actionable guidance based on AI analysis.',
  icon: LightbulbIcon,
  component: AiRecommendationWidget,
  defaultWidth: 3,
  defaultHeight: 4,
  minWidth: 3,
  minHeight: 3,
  supportsMobile: true,
  configurable: true,
  supportsCommands: true,
  defaultConfig: {
    type: 'ai-recommendation',
    title: 'Energy Optimization'
  }
};
