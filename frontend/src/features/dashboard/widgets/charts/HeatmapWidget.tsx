import React from 'react';
import { useTheme } from '@mui/material/styles';
import GridOnIcon from '@mui/icons-material/GridOn';
import { EChartBase } from '../../../../components/charts/EChartBase';
import type { WidgetConfig } from '../../types';
import type { WidgetManifest } from '../../registry/types';

export const HeatmapWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  const theme = useTheme();

  const hours = ['12a', '1a', '2a', '3a', '4a', '5a', '6a', '7a', '8a', '9a', '10a', '11a'];
  const days = ['Saturday', 'Friday', 'Thursday', 'Wednesday', 'Tuesday', 'Monday', 'Sunday'];
  
  // Random data [x, y, value]
  const data = [];
  for (let i = 0; i < hours.length; i++) {
    for (let j = 0; j < days.length; j++) {
      data.push([i, j, Math.floor(Math.random() * 10)]);
    }
  }

  const option = {
    tooltip: { position: 'top' },
    grid: { height: '70%', top: '10%' },
    xAxis: {
      type: 'category',
      data: hours,
      splitArea: { show: true },
      axisLabel: { color: theme.palette.text.secondary }
    },
    yAxis: {
      type: 'category',
      data: days,
      splitArea: { show: true },
      axisLabel: { color: theme.palette.text.secondary }
    },
    visualMap: {
      min: 0,
      max: 10,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '0%',
      textStyle: { color: theme.palette.text.secondary }
    },
    series: [
      {
        name: config.title || 'Heatmap',
        type: 'heatmap',
        data: data,
        label: { show: true, color: 'white' },
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' }
        }
      }
    ]
  };

  return <EChartBase option={option} height="100%" />;
};

export const HeatmapWidgetManifest: WidgetManifest = {
  type: 'heatmap',
  name: 'Heatmap',
  category: 'Charts',
  description: 'Visualizes data density in a matrix layout.',
  icon: GridOnIcon,
  component: HeatmapWidget,
  defaultWidth: 6,
  defaultHeight: 4,
  minWidth: 4,
  minHeight: 4,
  supportsRealtime: false,
  supportsHistory: true,
  configurable: true,
  defaultConfig: {
    type: 'heatmap',
    timeRange: '24h',
    refresh: 'live'
  }
};
