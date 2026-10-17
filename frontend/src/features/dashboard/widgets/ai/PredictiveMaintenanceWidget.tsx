import React from 'react';
import { Box, Typography, LinearProgress } from '@mui/material';
import BuildCircleIcon from '@mui/icons-material/BuildCircle';
import type { WidgetConfig } from '../../types';
import type { WidgetManifest } from '../../registry/types';

export const PredictiveMaintenanceWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  const maintenanceData = (config as any).maintenanceData;
  const healthScore = maintenanceData?.healthScore;
  const rulDays = maintenanceData?.rulDays;
  const recommendation = maintenanceData?.recommendation;

  const hasData = maintenanceData !== undefined && healthScore !== undefined;
  const healthColor = (healthScore || 0) > 80 ? 'success' : (healthScore || 0) > 50 ? 'warning' : 'error';

  return (
    <Box sx={{ height: '100%', p: 2, display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, display: 'flex', alignItems: 'center' }}>
        <BuildCircleIcon sx={{ mr: 1, color: 'primary.main' }} />
        {config.title || 'Predictive Maintenance'}
      </Typography>

      {!hasData ? (
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#f8f9fa', p: 2, borderRadius: 1 }}>
          <Typography variant="body2" color="text.secondary" align="center">
            Predictive maintenance model is not configured for this device.
          </Typography>
        </Box>
      ) : (
        <>
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
              <Typography variant="body2" color="text.secondary">Overall Health</Typography>
              <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{healthScore}%</Typography>
            </Box>
            <LinearProgress variant="determinate" value={healthScore} color={healthColor} sx={{ height: 8, borderRadius: 4 }} />
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2, p: 1.5, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography variant="body2" color="text.secondary">Remaining Useful Life (RUL)</Typography>
            <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
              {rulDays} <Typography component="span" variant="body2">Days</Typography>
            </Typography>
          </Box>

          <Box sx={{ flexGrow: 1 }}>
            <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
              Maintenance Recommendation
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5, p: 1.5, bgcolor: '#e8eaf6', borderRadius: 1, borderLeft: '4px solid #3f51b5' }}>
              {recommendation || "No immediate action required."}
            </Typography>
          </Box>
        </>
      )}
    </Box>
  );
};

export const PredictiveMaintenanceWidgetManifest: WidgetManifest = {
  type: 'ai-maintenance',
  name: 'Predictive Maintenance',
  category: 'AI',
  subcategory: 'Maintenance',
  description: 'Shows equipment health and Remaining Useful Life (RUL).',
  icon: BuildCircleIcon,
  component: PredictiveMaintenanceWidget,
  defaultWidth: 4,
  defaultHeight: 4,
  minWidth: 3,
  minHeight: 3,
  supportsMobile: true,
  configurable: true,
  defaultConfig: {
    type: 'ai-maintenance',
    title: 'Motor A Health'
  }
};
