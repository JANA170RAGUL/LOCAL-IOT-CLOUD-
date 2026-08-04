import React from 'react';
import { useTheme } from '@mui/material/styles';
import RadarIcon from '@mui/icons-material/TrackChanges';
import { EChartBase } from '../../../../components/charts/EChartBase';
import type { WidgetConfig } from '../../types';
import type { WidgetManifest } from '../../registry/types';

export const RadarChartWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  const theme = useTheme();

  const option = {
    legend: {
      data: ['Motor A', 'Motor B'],
      bottom: 0,
      textStyle: { color: theme.palette.text.secondary }
    },
    radar: {
      indicator: [
        { name: 'Speed', max: 6500 },
        { name: 'Current', max: 16000 },
        { name: 'Temp', max: 30000 },
        { name: 'Vibration', max: 38000 },
        { name: 'Power', max: 52000 }
      ],
      axisName: { color: theme.palette.text.primary }
    },
    series: [
      {
        name: config.title || 'Machine Comparison',
        type: 'radar',
        data: [
          {
            value: [4200, 3000, 20000, 35000, 50000],
            name: 'Motor A',
            itemStyle: { color: theme.palette.primary.main }
          },
          {
            value: [5000, 14000, 28000, 26000, 42000],
            name: 'Motor B',
            itemStyle: { color: theme.palette.secondary.main }
          }
        ]
      }
    ]
  };

  return <EChartBase option={option} height="100%" />;
};

export const RadarChartWidgetManifest: WidgetManifest = {
  type: 'radar',
  name: 'Radar Chart',
  category: 'Charts',
  description: 'Compares multiple variables across subjects (e.g. Machine A vs B).',
  icon: RadarIcon,
  component: RadarChartWidget,
  defaultWidth: 4,
  defaultHeight: 5,
  minWidth: 4,
  minHeight: 4,
  supportsRealtime: true,
  supportsHistory: false,
  configurable: true,
  defaultConfig: {
    type: 'radar',
    timeRange: '15m',
    refresh: 'live'
  }
};
