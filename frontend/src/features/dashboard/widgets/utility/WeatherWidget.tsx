import React from 'react';
import { Box, Typography, Divider } from '@mui/material';
import WbSunnyIcon from '@mui/icons-material/WbSunny';
import AirIcon from '@mui/icons-material/Air';
import WaterDropIcon from '@mui/icons-material/WaterDrop';
import type { WidgetConfig } from '../../types';
import type { WidgetManifest } from '../../registry/types';

export const WeatherWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  // Static Mocked Weather Data
  const weather = {
    temp: 24,
    condition: 'Sunny',
    humidity: 45,
    wind: 12,
    location: 'Plant HQ'
  };

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2, justifyContent: 'space-between', bgcolor: '#e3f2fd' }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="subtitle1" color="primary.dark" sx={{ fontWeight: 'bold' }}>
          {weather.location}
        </Typography>
        <WbSunnyIcon sx={{ color: '#fbc02d', fontSize: 40 }} />
      </Box>
      
      <Box sx={{ textAlign: 'center', my: 2 }}>
        <Typography variant="h2" sx={{ color: 'primary.dark', fontWeight: 'bold' }}>
          {weather.temp}°C
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {weather.condition}
        </Typography>
      </Box>

      <Divider sx={{ mb: 1 }} />
      
      <Box sx={{ display: 'flex', justifyContent: 'space-around' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', color: 'primary.main' }}>
          <WaterDropIcon fontSize="small" sx={{ mr: 0.5 }} />
          <Typography variant="body2">{weather.humidity}%</Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', color: 'primary.main' }}>
          <AirIcon fontSize="small" sx={{ mr: 0.5 }} />
          <Typography variant="body2">{weather.wind} km/h</Typography>
        </Box>
      </Box>
    </Box>
  );
};

export const WeatherWidgetManifest: WidgetManifest = {
  type: 'weather',
  name: 'Weather',
  category: 'Utility',
  description: 'Displays environmental ambient weather data.',
  icon: WbSunnyIcon,
  component: WeatherWidget,
  defaultWidth: 3,
  defaultHeight: 3,
  minWidth: 2,
  minHeight: 3,
  supportsMobile: true,
  configurable: true,
  defaultConfig: {
    type: 'weather'
  }
};
