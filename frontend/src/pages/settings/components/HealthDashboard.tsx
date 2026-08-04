import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { settingsApi } from '../../../features/settings/api/settings';
import { CheckCircleIcon, XCircleIcon } from '@heroicons/react/solid';
import { Box, Typography, Button, Grid, LinearProgress, List, ListItem, ListItemIcon, ListItemText, Chip, Paper } from '@mui/material';

export default function HealthDashboard() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['settings', 'health'],
    queryFn: () => settingsApi.getHealthStatus(),
    refetchInterval: 10000 // Refetch every 10 seconds
  });

  if (isLoading) return <Box sx={{ p: 2 }}><Typography>Loading system health...</Typography></Box>;
  if (isError) return <Box sx={{ p: 2 }}><Typography color="error">Failed to load system health. Ensure backend is reachable.</Typography></Box>;

  const getProgressBarColor = (percent: number) => {
    if (percent < 60) return 'success';
    if (percent < 85) return 'warning';
    return 'error';
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 'medium' }}>System Health Dashboard</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Real-time status of the host system and critical services.
          </Typography>
        </Box>
        <Button size="small" onClick={() => refetch()}>
          Refresh Now
        </Button>
      </Box>

      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>Host Metrics</Typography>
        <Grid container spacing={3}>
          {/* CPU */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>CPU Usage</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{data?.system.cpu_percent}%</Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={Math.min(100, data?.system.cpu_percent || 0)} 
                color={getProgressBarColor(data?.system.cpu_percent || 0)}
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Paper>
          </Grid>

          {/* Memory */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>Memory Usage</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{data?.system.memory_percent}%</Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={Math.min(100, data?.system.memory_percent || 0)} 
                color={getProgressBarColor(data?.system.memory_percent || 0)}
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Paper>
          </Grid>

          {/* Disk */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>Disk Usage</Typography>
                <Typography variant="body2" sx={{ fontWeight: 'medium' }}>{data?.system.disk_percent}%</Typography>
              </Box>
              <LinearProgress 
                variant="determinate" 
                value={Math.min(100, data?.system.disk_percent || 0)} 
                color={getProgressBarColor(data?.system.disk_percent || 0)}
                sx={{ height: 10, borderRadius: 5 }}
              />
            </Paper>
          </Grid>
        </Grid>
      </Box>

      <Box>
        <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>Core Services</Typography>
        <Paper variant="outlined">
          <List disablePadding>
            {data?.services.map((service, index) => (
              <ListItem 
                key={index} 
                divider={index < data.services.length - 1}
                sx={{ display: 'flex', justifyContent: 'space-between' }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <ListItemIcon sx={{ minWidth: 40 }}>
                    {service.status === 'up' ? (
                      <CheckCircleIcon style={{ width: 24, height: 24, color: '#10b981' }} />
                    ) : (
                      <XCircleIcon style={{ width: 24, height: 24, color: '#ef4444' }} />
                    )}
                  </ListItemIcon>
                  <ListItemText 
                    primary={<Typography variant="body2" sx={{ fontWeight: 'medium' }}>{service.name}</Typography>}
                    secondary={<Typography variant="caption">{service.details.message}</Typography>}
                  />
                </Box>
                <Chip 
                  label={service.status} 
                  size="small" 
                  color={service.status === 'up' ? 'success' : 'error'} 
                  variant="outlined" 
                  sx={{ textTransform: 'capitalize' }}
                />
              </ListItem>
            ))}
          </List>
        </Paper>
      </Box>
    </Box>
  );
}
