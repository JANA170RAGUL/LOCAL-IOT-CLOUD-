import React from 'react';
import { Box, Typography } from '@mui/material';
import MapIcon from '@mui/icons-material/Map';
import { useLatestTelemetryQuery } from '../../../../features/telemetry/hooks/useTelemetry';
import type { WidgetConfig } from '../../types';
import type { WidgetManifest } from '../../registry/types';

export const GpsWidget: React.FC<{ config: WidgetConfig }> = ({ config }) => {
  const { data } = useLatestTelemetryQuery(config.deviceId);
  
  // Look for lat/lng in telemetry. Fallback to a default location (e.g. London).
  const latReading = data?.find(d => d.sensor_code === 'latitude');
  const lngReading = data?.find(d => d.sensor_code === 'longitude');
  
  const lat = latReading ? Number(latReading.value) : 51.505;
  const lng = lngReading ? Number(lngReading.value) : -0.09;

  // Generate an OpenStreetMap embed URL
  const zoom = 14;
  const mapUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.05},${lat - 0.05},${lng + 0.05},${lat + 0.05}&layer=mapnik&marker=${lat},${lng}`;

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box sx={{ p: 1, display: 'flex', alignItems: 'center', borderBottom: '1px solid', borderColor: 'divider' }}>
        <MapIcon sx={{ mr: 1, color: 'primary.main' }} />
        <Typography variant="subtitle2" sx={{ flexGrow: 1 }} noWrap>
          {config.title || 'Device Location'}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {lat.toFixed(4)}, {lng.toFixed(4)}
        </Typography>
      </Box>
      <Box sx={{ flexGrow: 1, backgroundColor: '#e0e0e0' }}>
        <iframe 
          title="GPS Map"
          width="100%" 
          height="100%" 
          frameBorder="0" 
          scrolling="no" 
          marginHeight={0} 
          marginWidth={0} 
          src={mapUrl}
          style={{ border: 'none' }}
        ></iframe>
      </Box>
    </Box>
  );
};

export const GpsWidgetManifest: WidgetManifest = {
  type: 'gps',
  name: 'GPS Map',
  category: 'Maps',
  description: 'Live device location on OpenStreetMap.',
  icon: MapIcon,
  component: GpsWidget,
  supportedTelemetry: ['latitude', 'longitude'],
  defaultWidth: 4,
  defaultHeight: 4,
  configurable: true,
  defaultConfig: {
    type: 'gps',
    timeRange: '15m',
    refresh: 'live'
  }
};
