import React from 'react';
import { useTheme } from '@mui/material/styles';
import BubbleChartIcon from '@mui/icons-material/BubbleChart';
import { EChartBase } from '../../../../components/charts/EChartBase';
import type { WidgetConfig } from '../../types';
import type { WidgetManifest } from '../../registry/types';

export const BubbleChartWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  const theme = useTheme();

  // Mock data: [X, Y, Size, Category]
  const data = [
    [[28604, 77, 17096, 'Pump A'], [31163, 77.4, 27662, 'Pump B'], [1516, 68, 1154, 'Pump C']],
    [[13670, 74.7, 10082, 'Valve X'], [28599, 75, 16405, 'Valve Y'], [29476, 77.1, 15147, 'Valve Z']]
  ];

  const option = {
    legend: {
      right: '10%',
      top: '3%',
      textStyle: { color: theme.palette.text.secondary }
    },
    xAxis: {
      type: 'value',
      name: 'Run Hours',
      splitLine: { lineStyle: { color: theme.palette.divider } },
      axisLabel: { color: theme.palette.text.secondary },
      nameTextStyle: { color: theme.palette.text.secondary }
    },
    yAxis: {
      type: 'value',
      name: 'Efficiency',
      splitLine: { lineStyle: { color: theme.palette.divider } },
      axisLabel: { color: theme.palette.text.secondary },
      nameTextStyle: { color: theme.palette.text.secondary }
    },
    series: [
      {
        name: 'Pumps',
        data: data[0],
        type: 'scatter',
        symbolSize: (dataItem: any) => Math.sqrt(dataItem[2]) / 2,
        emphasis: {
          focus: 'series',
          label: { show: true, formatter: (param: any) => param.data[3], position: 'top' }
        },
        itemStyle: { color: theme.palette.primary.main, opacity: 0.7 }
      },
      {
        name: 'Valves',
        data: data[1],
        type: 'scatter',
        symbolSize: (dataItem: any) => Math.sqrt(dataItem[2]) / 2,
        emphasis: {
          focus: 'series',
          label: { show: true, formatter: (param: any) => param.data[3], position: 'top' }
        },
        itemStyle: { color: theme.palette.secondary.main, opacity: 0.7 }
      }
    ],
    tooltip: { trigger: 'item' }
  };

  return <EChartBase option={option} height="100%" />;
};

export const BubbleChartWidgetManifest: WidgetManifest = {
  type: 'bubble',
  name: 'Bubble Chart',
  category: 'Charts',
  description: 'Scatter plot representing three dimensions of data.',
  icon: BubbleChartIcon,
  component: BubbleChartWidget,
  defaultWidth: 6,
  defaultHeight: 4,
  minWidth: 4,
  minHeight: 4,
  supportsRealtime: true,
  supportsHistory: true,
  configurable: true,
  defaultConfig: {
    type: 'bubble',
    timeRange: '15m',
    refresh: 'live'
  }
};
