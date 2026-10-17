import React from 'react';
import ReactECharts from 'echarts-for-react';
import type { EChartsReactProps } from 'echarts-for-react';
import { useTheme } from '@mui/material/styles';

export interface EChartBaseProps extends EChartsReactProps {
  height?: number | string;
}

/**
 * A reusable wrapper around ECharts that automatically applies
 * Material-UI theme aesthetics and responsive sizing.
 */
export const EChartBase: React.FC<EChartBaseProps> = ({
  height = 300,
  style,
  option,
  ...props
}) => {
  const theme = useTheme();
  
  // Inject theme defaults into the user's options
  const defaultOption = {
    backgroundColor: 'transparent',
    textStyle: {
      fontFamily: theme.typography.fontFamily,
      color: theme.palette.text.primary,
    },
    tooltip: {
      backgroundColor: theme.palette.background.paper,
      borderColor: theme.palette.divider,
      confine: true,
      extraCssText: 'box-shadow: 0 8px 24px rgba(0,0,0,0.12); border-radius: 10px; padding: 10px; z-index: 1000;',
      textStyle: {
        color: theme.palette.text.primary,
        fontSize: 12,
        fontWeight: 600,
      },
      ...option?.tooltip,
    },
    grid: {
      top: 40,
      right: 25,
      bottom: 25,
      left: 30,
      containLabel: true,
      ...option?.grid,
    },
    xAxis: option?.xAxis ? {
      ...option.xAxis,
      axisLine: { lineStyle: { color: theme.palette.divider } },
      axisLabel: { color: theme.palette.text.secondary },
      splitLine: { show: false },
    } : undefined,
    yAxis: option?.yAxis ? {
      ...option.yAxis,
      axisLine: { show: false },
      axisLabel: { color: theme.palette.text.secondary },
      splitLine: {
        lineStyle: { color: theme.palette.divider, type: 'dashed' },
      },
    } : undefined,
  };

  const finalOption = { ...option, ...defaultOption };

  return (
    <ReactECharts
      option={finalOption}
      style={{ height, width: '100%', ...style }}
      theme={theme.palette.mode === 'dark' ? 'dark' : undefined}
      {...props}
    />
  );
};
