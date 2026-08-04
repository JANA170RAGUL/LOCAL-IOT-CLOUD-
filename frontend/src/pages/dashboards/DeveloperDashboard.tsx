import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  LinearProgress,
} from '@mui/material';
import {
  Code as VersionIcon,
  Storage as DbIcon,
  Memory as RamIcon,
  Speed as CpuIcon,
  CloudQueue as MqttIcon,
  CheckCircle as ActiveIcon,
  Warning as WarningIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

export const DeveloperDashboard: React.FC = () => {
  const theme = useTheme();

  // Mocked data as requested since endpoints are not yet available for hardware metrics
  const sysMetrics = {
    cpu: 24,
    ram: 68,
    docker: 12,
    redis: 'Online',
    influxdb: 'Online',
    postgres: 'Online',
    mqtt: 'Connected (12ms)',
    workers: 8,
    version: 'v1.2.4 (Build 8901)'
  };

  const cardItems = [
    { text: 'Platform Version', value: sysMetrics.version, icon: <VersionIcon fontSize="large" />, color: theme.palette.primary.main },
    { text: 'MQTT Broker', value: sysMetrics.mqtt, icon: <MqttIcon fontSize="large" />, color: '#10b981' },
    { text: 'Database (PG)', value: sysMetrics.postgres, icon: <DbIcon fontSize="large" />, color: '#3b82f6' },
    { text: 'Redis Cache', value: sysMetrics.redis, icon: <ActiveIcon fontSize="large" />, color: '#ef4444' },
    { text: 'Background Workers', value: sysMetrics.workers, icon: <ActiveIcon fontSize="large" />, color: '#8b5cf6' },
  ];

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
          System Developer Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Infrastructure health, resource utilization, and internal services.
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {cardItems.map((card) => (
          <Grid size={{ xs: 12, sm: 6, md: 2.4 }} key={card.text}>
            <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', boxShadow: 'none', border: `1px solid ${theme.palette.divider}` }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                <Box sx={{ color: card.color, display: 'flex', alignItems: 'center' }}>
                  {card.icon}
                </Box>
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    {card.value}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {card.text}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ boxShadow: 'none', border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <CpuIcon color="primary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Host CPU Utilization
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Overall CPU Load</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{sysMetrics.cpu}%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={sysMetrics.cpu} color={sysMetrics.cpu > 80 ? "error" : "primary"} sx={{ height: 10, borderRadius: 5, mb: 3 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Docker Containers ({sysMetrics.docker})</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>Healthy</Typography>
              </Box>
              <LinearProgress variant="determinate" value={100} color="success" sx={{ height: 10, borderRadius: 5 }} />
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ boxShadow: 'none', border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <RamIcon color="secondary" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Host Memory Utilization
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">RAM Usage (16GB Total)</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{sysMetrics.ram}%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={sysMetrics.ram} color={sysMetrics.ram > 85 ? "warning" : "secondary"} sx={{ height: 10, borderRadius: 5, mb: 3 }} />
              
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" color="text.secondary">Swap Usage</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'bold' }}>12%</Typography>
              </Box>
              <LinearProgress variant="determinate" value={12} color="info" sx={{ height: 10, borderRadius: 5 }} />
            </CardContent>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12 }}>
          <Card sx={{ boxShadow: 'none', border: `1px solid ${theme.palette.divider}`, height: '100%' }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <WarningIcon color="error" />
                <Typography variant="h6" sx={{ fontWeight: 700 }}>
                  Recent System Errors (Mocked)
                </Typography>
              </Box>
              <Box sx={{ p: 2, bgcolor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.02)', borderRadius: 1 }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'error.main', mb: 1 }}>
                  [2026-07-17 10:15:22] ERROR: MQTT connection timeout on node-alpha.
                </Typography>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', color: 'warning.main' }}>
                  [2026-07-17 09:42:01] WARN: High memory usage in redis container (85%).
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};
