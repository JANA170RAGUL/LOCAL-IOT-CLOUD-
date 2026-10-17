import React from 'react';
import { EChartBase } from './EChartBase';
import { useTheme } from '@mui/material/styles';
import type { TimeSeriesData } from './LineChart';
import * as echarts from 'echarts/core';

export interface AreaChartProps {
  data: TimeSeriesData[];
  title?: string;
  seriesName?: string;
  color?: string;
  unit?: string;
  height?: number | string;
  smooth?: boolean;
}

export const AreaChart: React.FC<AreaChartProps> = ({
  data,
  title,
  seriesName = 'Value',
  color,
  unit = '',
  height = 300,
  smooth = true,
}) => {
  const theme = useTheme();
  const themeColor = color || theme.palette.secondary.main;

  const option = {
    title: title ? { text: title, left: 'center' } : undefined,
    tooltip: {
      trigger: 'axis',
      confine: true,
      valueFormatter: (value: any) => `${value} ${unit}`,
    },
    xAxis: {
      type: 'time',
      boundaryGap: false,
      axisLabel: {
        hideOverlap: true,
      },
    },
    yAxis: {
      type: 'value',
      name: unit ? `(${unit})` : undefined,
    },
    series: [
      {
        name: seriesName,
        type: 'line',
        smooth,
        symbol: 'none',
        itemStyle: { color: themeColor },
        lineStyle: { width: 2 },
        areaStyle: {
          color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
            { offset: 0, color: `${themeColor}80` }, // 50% opacity
            { offset: 1, color: `${themeColor}05` }, // almost transparent
          ]),
        },
        data: data.map((d) => [new Date(d.timestamp).getTime(), d.value]),
      },
    ],
  };

  return <EChartBase option={option} height={height} />;
};
