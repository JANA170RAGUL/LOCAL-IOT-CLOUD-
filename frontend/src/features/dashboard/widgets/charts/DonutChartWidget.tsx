import React from 'react';
import { useTheme } from '@mui/material/styles';
import DonutLargeIcon from '@mui/icons-material/DonutLarge';
import { EChartBase } from '../../../../components/charts/EChartBase';
import type { WidgetConfig } from '../../types';
import type { WidgetManifest } from '../../registry/types';

export const DonutChartWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  const theme = useTheme();

  const data = [
    { value: 45, name: 'Online' },
    { value: 12, name: 'Offline' },
    { value: 3, name: 'Fault' }
  ];

  const option = {
    tooltip: {
      trigger: 'item'
    },
    legend: {
      top: '5%',
      left: 'center',
      textStyle: { color: theme.palette.text.secondary }
    },
    series: [
      {
        name: config.title || 'Status',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: {
          borderRadius: 10,
          borderColor: theme.palette.background.paper,
          borderWidth: 2
        },
        label: {
          show: false,
          position: 'center'
        },
        emphasis: {
          label: {
            show: true,
            fontSize: 20,
            fontWeight: 'bold',
            color: theme.palette.text.primary
          }
        },
        labelLine: {
          show: false
        },
        data: data
      }
    ]
  };

  return <EChartBase option={option} height="100%" />;
};

export const DonutChartWidgetManifest: WidgetManifest = {
  type: 'donut',
  name: 'Donut Chart',
  category: 'Charts',
  description: 'A pie chart with a hollow center, ideal for KPI statuses.',
  icon: DonutLargeIcon,
  component: DonutChartWidget,
  defaultWidth: 3,
  defaultHeight: 4,
  minWidth: 3,
  minHeight: 3,
  supportsRealtime: true,
  supportsHistory: false,
  configurable: true,
  defaultConfig: {
    type: 'donut',
    timeRange: '15m',
    refresh: 'live'
  }
};
