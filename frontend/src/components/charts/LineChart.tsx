import React from 'react';
import { EChartBase } from './EChartBase';
import { useTheme } from '@mui/material/styles';

export interface TimeSeriesData {
  timestamp: string | number | Date;
  value: number;
}

export interface LineChartProps {
  data: TimeSeriesData[];
  title?: string;
  seriesName?: string;
  color?: string;
  unit?: string;
  height?: number | string;
  smooth?: boolean;
}

export const LineChart: React.FC<LineChartProps> = ({
  data,
  title,
  seriesName = 'Value',
  color,
  unit = '',
  height = 300,
  smooth = true,
}) => {
  const theme = useTheme();
  const themeColor = color || theme.palette.primary.main;

  const option = {
    title: title ? { text: title, left: 'center' } : undefined,
    tooltip: {
      trigger: 'axis',
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
        symbol: 'none', // clean premium look without dots unless hovered
        itemStyle: { color: themeColor },
        lineStyle: { width: 3 },
        data: data.map((d) => [new Date(d.timestamp).getTime(), d.value]),
      },
    ],
  };

  return <EChartBase option={option} height={height} />;
};
