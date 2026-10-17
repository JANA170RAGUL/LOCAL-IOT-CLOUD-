import React from 'react';
import { Box, Typography, Chip, LinearProgress } from '@mui/material';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';
import type { WidgetConfig } from '../../types';
import type { WidgetManifest } from '../../registry/types';

export const AnomalyDetectionWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  const anomalyData = (config as any).anomalyData;
  const isAnomaly = anomalyData?.isAnomaly;
  const confidence = anomalyData?.confidence;
  const expected = anomalyData?.expected;
  const actual = anomalyData?.actual;

  const hasData = anomalyData !== undefined;

  return (
    <Box sx={{ height: '100%', p: 2, display: 'flex', flexDirection: 'column', bgcolor: hasData && isAnomaly ? '#fff5f5' : '#f8f9fa' }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2, color: hasData && isAnomaly ? 'error.main' : 'text.primary', display: 'flex', alignItems: 'center' }}>
        <WarningAmberIcon sx={{ mr: 1 }} />
        {config.title || 'Anomaly Detection'}
      </Typography>

      {!hasData ? (
        <Box sx={{ flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', p: 2 }}>
          <Typography variant="body2" color="text.secondary" align="center">
            No active anomalies detected or AI engine unconfigured.
          </Typography>
        </Box>
      ) : (
        <Box sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
            <Typography variant="body2" color="text.secondary">Status</Typography>
            <Chip 
              label={isAnomaly ? "ANOMALY DETECTED" : "NORMAL"} 
              color={isAnomaly ? "error" : "success"} 
              size="small" 
              sx={{ fontWeight: 'bold' }} 
            />
          </Box>

          {isAnomaly && (
            <>
              <Box sx={{ mb: 2 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5 }}>
                  <Typography variant="body2">AI Confidence</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{confidence}%</Typography>
                </Box>
                <LinearProgress variant="determinate" value={confidence} color="error" />
              </Box>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1, bgcolor: '#fff', p: 1.5, borderRadius: 1, border: '1px solid #ffcdd2' }}>
                <Box>
                  <Typography variant="caption" color="text.secondary">Expected</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'success.main' }}>{expected}</Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary">Actual</Typography>
                  <Typography variant="body1" sx={{ fontWeight: 'bold', color: 'error.main' }}>{actual}</Typography>
                </Box>
                <Box sx={{ gridColumn: 'span 2', mt: 1 }}>
                  <Typography variant="caption" color="text.secondary">Deviation</Typography>
                  <Typography variant="body2" sx={{ color: 'error.main' }}>+{Math.abs(actual - expected)} ({Math.round(Math.abs(actual - expected)/expected * 100)}%)</Typography>
                </Box>
              </Box>
            </>
          )}
        </Box>
      )}
    </Box>
  );
};

export const AnomalyDetectionWidgetManifest: WidgetManifest = {
  type: 'ai-anomaly',
  name: 'Anomaly Detection',
  category: 'AI',
  subcategory: 'Monitoring',
  description: 'Detects and flags abnormal behavior using configured AI engines.',
  icon: WarningAmberIcon,
  component: AnomalyDetectionWidget,
  defaultWidth: 3,
  defaultHeight: 4,
  minWidth: 3,
  minHeight: 3,
  supportsMobile: true,
  configurable: true,
  defaultConfig: {
    type: 'ai-anomaly',
    title: 'Motor 2 Vibration'
  }
};
