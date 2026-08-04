import React from 'react';
import { EChartBase } from './EChartBase';
import { useTheme } from '@mui/material/styles';

export interface GaugeChartProps {
  value: number;
  min?: number;
  max?: number;
  title?: string;
  unit?: string;
  height?: number | string;
  color?: string;
}

export const GaugeChart: React.FC<GaugeChartProps> = ({
  value,
  min = 0,
  max = 100,
  title = '',
  unit = '',
  height = 300,
  color,
}) => {
  const theme = useTheme();
  const themeColor = color || theme.palette.info.main;

  const option = {
    tooltip: {
      formatter: '{b} <br/>{c} {a}',
      backgroundColor: theme.palette.background.paper,
      borderColor: themeColor,
      borderWidth: 1,
      textStyle: { color: theme.palette.text.primary }
    },
    series: [
      {
        type: 'gauge',
        name: unit,
        startAngle: 225,
        endAngle: -45,
        min,
        max,
        splitNumber: 10,
        radius: '90%',
        progress: {
          show: true,
          width: 12,
          itemStyle: {
            color: themeColor,
          }
        },
        axisLine: {
          lineStyle: {
            width: 12,
            color: [[1, theme.palette.divider]],
          },
        },
        pointer: {
          show: true,
          length: '60%',
          width: 4,
          itemStyle: {
            color: themeColor,
          },
        },
        axisTick: {
          show: true,
          splitNumber: 5,
          length: 6,
          lineStyle: {
            color: theme.palette.text.secondary,
            width: 1,
          },
        },
        splitLine: {
          show: true,
          length: 12,
          lineStyle: {
            color: theme.palette.text.primary,
            width: 2,
          },
        },
        axisLabel: {
          distance: 20,
          color: theme.palette.text.secondary,
          fontSize: 12,
        },
        title: {
          show: false, // We can hide the static title to match the image, or keep it offset
        },
        detail: {
          fontSize: 24,
          fontWeight: 'bold',
          offsetCenter: [0, '70%'],
          valueAnimation: true,
          formatter: `{value} ${unit}`,
          color: theme.palette.text.primary,
        },
        data: [
          {
            value,
            name: title,
          },
        ],
      },
    ],
  };

  return <EChartBase option={option} height={height} />;
};
