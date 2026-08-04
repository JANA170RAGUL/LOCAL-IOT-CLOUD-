import React from 'react';
import { ToggleButton, ToggleButtonGroup } from '@mui/material';
export type TimeRange = '15m' | '1h' | '6h' | '24h' | '7d' | '30d' | '90d' | 'Custom';

export interface TimeRangeSelectorProps {
  value: TimeRange;
  onChange: (value: TimeRange, startTime: string, endTime: string, window: string) => void;
}

export const TimeRangeSelector: React.FC<TimeRangeSelectorProps> = ({ value, onChange }) => {
  const handleChange = (
    _event: React.MouseEvent<HTMLElement>,
    newValue: TimeRange | null
  ) => {
    if (!newValue) return; // Enforce at least one selection

    let startTime = '';
    const endTime = 'now()';
    let window = '1m';

    switch (newValue) {
      case '15m':
        startTime = '-15m';
        window = '10s';
        break;
      case '1h':
        startTime = '-1h';
        window = '1m';
        break;
      case '6h':
        startTime = '-6h';
        window = '5m';
        break;
      case '24h':
        startTime = '-24h';
        window = '15m';
        break;
      case '7d':
        startTime = '-7d';
        window = '1h';
        break;
      case '30d':
        startTime = '-30d';
        window = '6h';
        break;
      case '90d':
        startTime = '-90d';
        window = '12h';
        break;
      case 'Custom':
        startTime = '-1h'; // default for custom fallback
        window = '1m';
        break;
    }

    onChange(newValue, startTime, endTime, window);
  };

  return (
    <ToggleButtonGroup
      value={value}
      exclusive
      onChange={handleChange}
      aria-label="time range selection"
      size="small"
    >
      <ToggleButton value="15m" aria-label="last 15 minutes">
        15m
      </ToggleButton>
      <ToggleButton value="1h" aria-label="last hour">
        1h
      </ToggleButton>
      <ToggleButton value="6h" aria-label="last 6 hours">
        6h
      </ToggleButton>
      <ToggleButton value="24h" aria-label="last 24 hours">
        24h
      </ToggleButton>
      <ToggleButton value="7d" aria-label="last 7 days">
        7d
      </ToggleButton>
      <ToggleButton value="30d" aria-label="last 30 days">
        30d
      </ToggleButton>
      <ToggleButton value="90d" aria-label="last 90 days">
        90d
      </ToggleButton>
      <ToggleButton value="Custom" aria-label="custom range">
        Custom
      </ToggleButton>
    </ToggleButtonGroup>
  );
};
