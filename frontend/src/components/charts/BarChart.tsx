import React from 'react';
import { EChartBase } from './EChartBase';
import { useTheme } from '@mui/material/styles';
import * as echarts from 'echarts/core';

export interface BarChartProps {
  categories: string[];
  data: number[];
  title?: string;
  seriesName?: string;
  color?: string;
  unit?: string;
  height?: number | string;
}

export const BarChart: React.FC<BarChartProps> = ({
  categories,
  data,
  title,
  seriesName = 'Value',
  color,
  unit = '',
  height = 300,
}) => {
  const theme = useTheme();
  const themeColor = color || theme.palette.primary.main;

  const option = {
    title: title ? { text: title, left: 'center' } : undefined,
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      valueFormatter: (value: any) => `${value} ${unit}`,
    },
    xAxis: {
      type: 'category',
      data: categories,
      axisTick: { alignWithLabel: true },
    },
    yAxis: {
      type: 'value',
      name: unit ? `(${unit})` : undefined,
    },
    series: [
      {
        name: seriesName,
        type: 'bar',
        barWidth: '60%',
        itemStyle: {
          borderRadius: [4, 4, 0, 0],
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: themeColor },
            { offset: 1, color: `${themeColor}80` }, // slightly transparent bottom
          ]),
        },
        data,
      },
    ],
  };

  return <EChartBase option={option} height={height} />;
};
