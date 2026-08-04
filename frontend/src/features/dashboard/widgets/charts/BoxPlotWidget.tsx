import React from 'react';
import { useTheme } from '@mui/material/styles';
import CandlestickChartIcon from '@mui/icons-material/CandlestickChart';
import { EChartBase } from '../../../../components/charts/EChartBase';
import type { WidgetConfig } from '../../types';
import type { WidgetManifest } from '../../registry/types';

export const BoxPlotWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  const theme = useTheme();

  // Mock Box Plot data: [min, Q1, median, Q3, max]
  const data = [
    [850, 890, 920, 950, 980],
    [800, 840, 880, 930, 960],
    [750, 800, 840, 890, 920],
    [820, 870, 900, 940, 970]
  ];

  const option = {
    tooltip: {
      trigger: 'item',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '10%',
      right: '10%',
      bottom: '15%'
    },
    xAxis: {
      type: 'category',
      data: ['Batch 1', 'Batch 2', 'Batch 3', 'Batch 4'],
      boundaryGap: true,
      nameGap: 30,
      splitArea: { show: false },
      axisLabel: { formatter: '{value}', color: theme.palette.text.secondary },
      splitLine: { show: false }
    },
    yAxis: {
      type: 'value',
      name: 'Value',
      splitLine: { lineStyle: { color: theme.palette.divider } },
      axisLabel: { color: theme.palette.text.secondary },
      nameTextStyle: { color: theme.palette.text.secondary }
    },
    series: [
      {
        name: config.title || 'Boxplot',
        type: 'boxplot',
        data: data,
        itemStyle: {
          color: theme.palette.primary.light,
          borderColor: theme.palette.primary.main
        }
      }
    ]
  };

  return <EChartBase option={option} height="100%" />;
};

export const BoxPlotWidgetManifest: WidgetManifest = {
  type: 'boxplot',
  name: 'Box Plot',
  category: 'Charts',
  description: 'Statistical chart showing outliers, min, max, and medians.',
  icon: CandlestickChartIcon,
  component: BoxPlotWidget,
  defaultWidth: 5,
  defaultHeight: 4,
  minWidth: 4,
  minHeight: 3,
  supportsRealtime: false,
  supportsHistory: true,
  configurable: true,
  defaultConfig: {
    type: 'boxplot',
    timeRange: '24h',
    refresh: 'live'
  }
};
