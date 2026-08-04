import React from 'react';
import { useTheme } from '@mui/material/styles';
import DataUsageIcon from '@mui/icons-material/DataUsage';
import { EChartBase } from '../../../../components/charts/EChartBase';
import type { WidgetConfig } from '../../types';
import type { WidgetManifest } from '../../registry/types';

export const PolarChartWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  const theme = useTheme();

  const option = {
    angleAxis: {
      type: 'category',
      data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
      axisLabel: { color: theme.palette.text.secondary }
    },
    radiusAxis: {
      axisLabel: { color: theme.palette.text.secondary }
    },
    polar: {},
    series: [
      {
        type: 'bar',
        data: [1, 2, 3, 4, 3, 5, 1],
        coordinateSystem: 'polar',
        name: 'Wind',
        itemStyle: {
          color: theme.palette.info.main
        }
      }
    ],
    legend: {
      show: true,
      data: ['Wind'],
      bottom: 0,
      textStyle: { color: theme.palette.text.secondary }
    }
  };

  return <EChartBase option={option} height="100%" />;
};

export const PolarChartWidgetManifest: WidgetManifest = {
  type: 'polar',
  name: 'Polar Chart',
  category: 'Charts',
  description: 'Displays data in a circular polar coordinate system.',
  icon: DataUsageIcon,
  component: PolarChartWidget,
  defaultWidth: 4,
  defaultHeight: 4,
  minWidth: 3,
  minHeight: 3,
  supportsRealtime: true,
  supportsHistory: true,
  configurable: true,
  defaultConfig: {
    type: 'polar',
    timeRange: '15m',
    refresh: 'live'
  }
};
