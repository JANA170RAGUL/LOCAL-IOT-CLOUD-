import React from 'react';
import { Box, Typography } from '@mui/material';
import SsidChartIcon from '@mui/icons-material/SsidChart';
import type { WidgetConfig } from '../../types';
import type { WidgetManifest } from '../../registry/types';
import { ResponsiveContainer, ComposedChart, Line, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';

export const ForecastWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  // Mock data representing historical and future (forecast) data
  const data = [
    { time: '-24h', value: 100, forecast: null, upper: null, lower: null },
    { time: '-18h', value: 120, forecast: null, upper: null, lower: null },
    { time: '-12h', value: 110, forecast: null, upper: null, lower: null },
    { time: '-6h',  value: 130, forecast: null, upper: null, lower: null },
    { time: 'Now',  value: 125, forecast: 125, upper: 125, lower: 125 },
    { time: '+6h',  value: null, forecast: 140, upper: 155, lower: 125 },
    { time: '+12h', value: null, forecast: 135, upper: 160, lower: 110 },
    { time: '+18h', value: null, forecast: 150, upper: 180, lower: 120 },
    { time: '+24h', value: null, forecast: 165, upper: 200, lower: 130 },
  ];

  return (
    <Box sx={{ height: '100%', p: 2, display: 'flex', flexDirection: 'column' }}>
      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, display: 'flex', alignItems: 'center' }}>
        <SsidChartIcon sx={{ mr: 1, color: 'primary.main' }} />
        {config.title || 'AI Forecast'}
      </Typography>
      
      <Box sx={{ flexGrow: 1, minHeight: 0 }}>
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={data}>
            <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
            <XAxis dataKey="time" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Area type="monotone" dataKey="upper" stroke="none" fill="#e3f2fd" />
            <Area type="monotone" dataKey="lower" stroke="none" fill="#fff" />
            <Line type="monotone" dataKey="value" stroke="#1976d2" strokeWidth={2} dot={true} name="Actual" />
            <Line type="monotone" dataKey="forecast" stroke="#9c27b0" strokeWidth={2} strokeDasharray="5 5" dot={true} name="Forecast" />
          </ComposedChart>
        </ResponsiveContainer>
      </Box>
    </Box>
  );
};

export const ForecastWidgetManifest: WidgetManifest = {
  type: 'ai-forecast',
  name: 'AI Forecast',
  category: 'AI',
  subcategory: 'Predictive',
  description: 'Shows future trends and confidence intervals.',
  icon: SsidChartIcon,
  component: ForecastWidget,
  defaultWidth: 6,
  defaultHeight: 4,
  minWidth: 4,
  minHeight: 3,
  supportsMobile: true,
  configurable: true,
  defaultConfig: {
    type: 'ai-forecast',
    title: 'Energy Forecast (Next 24h)'
  }
};
