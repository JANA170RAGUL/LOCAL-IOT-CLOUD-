import React from 'react';
import { useTheme } from '@mui/material/styles';
import PieChartIcon from '@mui/icons-material/PieChart';
import { EChartBase } from '../../../../components/charts/EChartBase';
import type { WidgetConfig } from '../../types';
import type { WidgetManifest } from '../../registry/types';

export const PieChartWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  const theme = useTheme();

  // Mock data for the pie chart
  const data = [
    { value: 1048, name: 'Warning' },
    { value: 735, name: 'Critical' },
    { value: 580, name: 'Normal' },
    { value: 484, name: 'Offline' },
    { value: 300, name: 'Maintenance' }
  ];

  const option = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      orient: 'vertical',
      left: 'left',
      textStyle: { color: theme.palette.text.secondary }
    },
    series: [
      {
        name: config.title || 'Distribution',
        type: 'pie',
        radius: '50%',
        data: data,
        emphasis: {
          itemStyle: {
            shadowBlur: 10,
            shadowOffsetX: 0,
            shadowColor: 'rgba(0, 0, 0, 0.5)'
          }
        },
        label: {
          color: theme.palette.text.primary
        }
      }
    ]
  };

  return <EChartBase option={option} height="100%" />;
};

export const PieChartWidgetManifest: WidgetManifest = {
  type: 'pie',
  name: 'Pie Chart',
  category: 'Charts',
  description: 'Displays a standard pie chart for distribution analysis.',
  icon: PieChartIcon,
  component: PieChartWidget,
  defaultWidth: 4,
  defaultHeight: 4,
  minWidth: 3,
  minHeight: 3,
  supportsRealtime: true,
  supportsHistory: false,
  configurable: true,
  defaultConfig: {
    type: 'pie',
    timeRange: '15m',
    refresh: 'live'
  }
};
