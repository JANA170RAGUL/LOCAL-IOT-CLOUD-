import React from 'react';
import { Box, Typography, Divider } from '@mui/material';
import AutoAwesomeIcon from '@mui/icons-material/AutoAwesome';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import type { WidgetConfig } from '../../types';
import type { WidgetManifest } from '../../registry/types';
import { useLatestTelemetryQuery } from '../../../../features/telemetry/hooks/useTelemetry';

export const PredictionWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  const { data: telemetry } = useLatestTelemetryQuery(config.deviceId);

  const sensorReading = telemetry?.find((t: any) => t.sensor_code === config.sensorCode);
  const currentValue = sensorReading?.value ?? (config as any).mockCurrent ?? 34.2;
  const unit = (config as any).unit || '°C';
  const predictedValue = (config as any).mockPredicted ?? 36.5;
  const timeHorizon = (config as any).timeHorizon || '30 min';
  
  const isIncreasing = predictedValue > currentValue;

  return (
    <Box sx={{ height: '100%', p: 2, display: 'flex', flexDirection: 'column', bgcolor: 'background.paper' }}>
      <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
        <AutoAwesomeIcon sx={{ color: 'primary.main', mr: 1 }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
          {config.title || 'AI Prediction'}
        </Typography>
      </Box>

      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
        <Typography variant="body2" color="text.secondary">Current Value:</Typography>
        <Typography variant="h6">{currentValue}{unit}</Typography>
      </Box>
      
      <Divider sx={{ mb: 2 }} />

      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
        Prediction ({timeHorizon}):
      </Typography>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="h4" color="primary.main" sx={{ fontWeight: 'bold' }}>
          {predictedValue}{unit}
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', color: isIncreasing ? 'error.main' : 'success.main' }}>
          {isIncreasing ? <TrendingUpIcon sx={{ mr: 0.5 }} /> : <TrendingDownIcon sx={{ mr: 0.5 }} />}
          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
            {isIncreasing ? 'Increasing' : 'Decreasing'}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export const PredictionWidgetManifest: WidgetManifest = {
  type: 'ai-prediction',
  name: 'AI Prediction',
  category: 'AI',
  subcategory: 'Predictive',
  description: 'Displays a predicted future value using AI models.',
  icon: AutoAwesomeIcon,
  component: PredictionWidget,
  defaultWidth: 3,
  defaultHeight: 3,
  minWidth: 3,
  minHeight: 2,
  supportsMobile: true,
  configurable: true,
  defaultConfig: {
    type: 'ai-prediction',
    title: 'Temperature Prediction',
    mockCurrent: 34.2,
    mockPredicted: 36.5,
    unit: '°C',
    timeHorizon: '30 min'
  }
};
