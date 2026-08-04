import React, { useEffect, useState } from 'react';
import { Box, Typography } from '@mui/material';
import NumbersIcon from '@mui/icons-material/Numbers';
import { useLatestTelemetryQuery } from '../../../../features/telemetry/hooks/useTelemetry';
import type { WidgetConfig } from '../../types';
import type { WidgetManifest } from '../../registry/types';

export const DigitalCounterWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  const { data } = useLatestTelemetryQuery(config.deviceId);
  const [displayValue, setDisplayValue] = useState(0);

  // Extract configured telemetry or fallback to random/first
  const telemetryKey = (config as any).sensorCode || 'devices_online';
  const reading = data?.find(d => d.sensor_code === telemetryKey);
  const targetValue = reading ? Number(reading.value) : 1254; // Mock default

  // Animated counting effect
  useEffect(() => {
    let startTimestamp: number | null = null;
    const duration = 1000; // 1 second animation
    const startValue = displayValue;

    const step = (timestamp: number) => {
      if (!startTimestamp) startTimestamp = timestamp;
      const progress = Math.min((timestamp - startTimestamp) / duration, 1);
      
      // Simple easeOutQuart
      const ease = 1 - Math.pow(1 - progress, 4);
      const current = Math.floor(startValue + (targetValue - startValue) * ease);
      
      setDisplayValue(current);
      
      if (progress < 1) {
        window.requestAnimationFrame(step);
      } else {
        setDisplayValue(targetValue);
      }
    };
    
    window.requestAnimationFrame(step);
  }, [targetValue]);

  const prefix = (config as any).prefix || '';
  const suffix = (config as any).suffix || '';
  const isAlarm = targetValue > ((config as any).threshold || 5000);
  const color = isAlarm ? 'error.main' : 'info.main';

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2, alignItems: 'center', justifyContent: 'center' }}>
      <Typography variant="subtitle1" color="text.secondary" gutterBottom>
        {config.title || 'Digital Counter'}
      </Typography>
      <Typography variant="h2" sx={{ fontWeight: 'bold', color, fontFamily: 'monospace' }}>
        {prefix}{displayValue.toLocaleString()}{suffix}
      </Typography>
    </Box>
  );
};

export const DigitalCounterWidgetManifest: WidgetManifest = {
  type: 'counter',
  name: 'Digital Counter',
  category: 'KPI',
  description: 'Animated numerical display with prefixes and suffixes.',
  icon: NumbersIcon,
  component: DigitalCounterWidget,
  defaultWidth: 3,
  defaultHeight: 2,
  minWidth: 2,
  minHeight: 2,
  supportsRealtime: true,
  supportsMobile: true,
  configurable: true,
  defaultConfig: {
    type: 'counter',
    refresh: 'live'
  }
};
