import React from 'react';
import { useTheme } from '@mui/material/styles';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import GridOnIcon from '@mui/icons-material/GridOn';
import { EChartBase } from '../../../../components/charts/EChartBase';
import type { WidgetConfig } from '../../types';
import type { WidgetManifest } from '../../registry/types';

export const HeatmapWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  const theme = useTheme();

  const hours = ['12a', '1a', '2a', '3a', '4a', '5a', '6a', '7a', '8a', '9a', '10a', '11a'];
  const days = ['Saturday', 'Friday', 'Thursday', 'Wednesday', 'Tuesday', 'Monday', 'Sunday'];
  
  // Real data array [x, y, value] provided via config or zero initialized
  const rawData: Array<[number, number, number]> = (config as any).heatmapData || [];
  const hasData = rawData.length > 0;

  const data: Array<[number, number, number]> = hasData
    ? rawData
    : hours.flatMap((_, i) => days.map((_, j) => [i, j, 0] as [number, number, number]));

  const option = {
    tooltip: { position: 'top' },
    grid: { height: '70%', top: '10%' },
    xAxis: {
      type: 'category',
      data: hours,
      splitArea: { show: true },
      axisLabel: { color: theme.palette.text.secondary }
    },
    yAxis: {
      type: 'category',
      data: days,
      splitArea: { show: true },
      axisLabel: { color: theme.palette.text.secondary }
    },
    visualMap: {
      min: 0,
      max: hasData ? Math.max(...data.map(d => d[2]), 10) : 10,
      calculable: true,
      orient: 'horizontal',
      left: 'center',
      bottom: '0%',
      textStyle: { color: theme.palette.text.secondary }
    },
    series: [
      {
        name: config.title || 'Heatmap',
        type: 'heatmap',
        data: data,
        label: { show: hasData, color: 'white' },
        emphasis: {
          itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' }
        }
      }
    ]
  };

  return (
    <Box sx={{ width: '100%', height: '100%', position: 'relative' }}>
      {!hasData && (
        <Box
          sx={{
            position: 'absolute',
            top: 8,
            right: 8,
            zIndex: 10,
            backgroundColor: 'rgba(0,0,0,0.6)',
            px: 1,
            py: 0.5,
            borderRadius: 1,
          }}
        >
          <Typography variant="caption" color="text.secondary">
            No telemetry available
          </Typography>
        </Box>
      )}
      <EChartBase option={option} height="100%" />
    </Box>
  );
};

export const HeatmapWidgetManifest: WidgetManifest = {
  type: 'heatmap',
  name: 'Heatmap',
  category: 'Charts',
  description: 'Visualizes data density in a matrix layout.',
  icon: GridOnIcon,
  component: HeatmapWidget,
  defaultWidth: 6,
  defaultHeight: 4,
  minWidth: 4,
  minHeight: 4,
  supportsRealtime: false,
  supportsHistory: true,
  configurable: true,
  defaultConfig: {
    type: 'heatmap',
    timeRange: '24h',
    refresh: 'live'
  }
};
