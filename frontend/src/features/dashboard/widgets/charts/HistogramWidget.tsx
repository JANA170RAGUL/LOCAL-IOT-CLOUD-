import React from 'react';
import { useTheme } from '@mui/material/styles';
import BarChartIcon from '@mui/icons-material/BarChart';
import { EChartBase } from '../../../../components/charts/EChartBase';
import type { WidgetConfig } from '../../types';
import type { WidgetManifest } from '../../registry/types';

export const HistogramWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  const theme = useTheme();

  // Binned data ranges
  const xAxisData = ['0-10', '10-20', '20-30', '30-40', '40-50', '50-60', '60-70'];
  const yAxisData = [5, 20, 36, 10, 10, 20, 4];

  const option = {
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' }
    },
    grid: {
      left: '3%',
      right: '4%',
      bottom: '3%',
      containLabel: true
    },
    xAxis: {
      type: 'category',
      data: xAxisData,
      axisTick: { alignWithLabel: true },
      axisLabel: { color: theme.palette.text.secondary }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: theme.palette.divider } },
      axisLabel: { color: theme.palette.text.secondary }
    },
    series: [
      {
        name: config.title || 'Frequency',
        type: 'bar',
        barWidth: '99%', // Creates the histogram look
        data: yAxisData,
        itemStyle: {
          color: theme.palette.info.main,
          borderColor: theme.palette.background.paper,
          borderWidth: 1
        }
      }
    ]
  };

  return <EChartBase option={option} height="100%" />;
};

export const HistogramWidgetManifest: WidgetManifest = {
  type: 'histogram',
  name: 'Histogram',
  category: 'Charts',
  description: 'Displays the frequency distribution of a dataset.',
  icon: BarChartIcon,
  component: HistogramWidget,
  defaultWidth: 5,
  defaultHeight: 4,
  minWidth: 4,
  minHeight: 3,
  supportsRealtime: true,
  supportsHistory: true,
  configurable: true,
  defaultConfig: {
    type: 'histogram',
    timeRange: '15m',
    refresh: 'live'
  }
};
