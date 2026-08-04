import React from 'react';
import { useTheme } from '@mui/material/styles';
import ScatterPlotIcon from '@mui/icons-material/ScatterPlot';
import { EChartBase } from '../../../../components/charts/EChartBase';
import type { WidgetConfig } from '../../types';
import type { WidgetManifest } from '../../registry/types';

export const ScatterPlotWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  const theme = useTheme();

  // Mock data: [X, Y]
  const data = [
    [10.0, 8.04],
    [8.0, 6.95],
    [13.0, 7.58],
    [9.0, 8.81],
    [11.0, 8.33],
    [14.0, 9.96],
    [6.0, 7.24],
    [4.0, 4.26],
    [12.0, 10.84],
    [7.0, 4.82],
    [5.0, 5.68]
  ];

  const option = {
    xAxis: {
      type: 'value',
      name: 'X Axis',
      splitLine: { lineStyle: { color: theme.palette.divider } },
      axisLabel: { color: theme.palette.text.secondary },
      nameTextStyle: { color: theme.palette.text.secondary }
    },
    yAxis: {
      type: 'value',
      name: 'Y Axis',
      splitLine: { lineStyle: { color: theme.palette.divider } },
      axisLabel: { color: theme.palette.text.secondary },
      nameTextStyle: { color: theme.palette.text.secondary }
    },
    series: [
      {
        symbolSize: 12,
        data: data,
        type: 'scatter',
        itemStyle: {
          color: theme.palette.primary.main
        }
      }
    ],
    tooltip: {
      trigger: 'item',
      formatter: (params: any) => `X: ${params.value[0]}<br/>Y: ${params.value[1]}`
    }
  };

  return <EChartBase option={option} height="100%" />;
};

export const ScatterPlotWidgetManifest: WidgetManifest = {
  type: 'scatter',
  name: 'Scatter Plot',
  category: 'Charts',
  description: 'Displays correlation between two variables.',
  icon: ScatterPlotIcon,
  component: ScatterPlotWidget,
  defaultWidth: 6,
  defaultHeight: 4,
  minWidth: 4,
  minHeight: 3,
  supportsRealtime: true,
  supportsHistory: true,
  configurable: true,
  defaultConfig: {
    type: 'scatter',
    timeRange: '15m',
    refresh: 'live'
  }
};
