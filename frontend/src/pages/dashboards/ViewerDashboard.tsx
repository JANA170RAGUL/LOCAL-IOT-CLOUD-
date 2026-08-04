import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Paper,
  CircularProgress,
} from '@mui/material';
import {
  Wifi as OnlineIcon,
  WifiOff as OfflineIcon,
  NotificationsActive as AlertIcon,
  DeveloperBoard as DeviceIcon,
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import ReactECharts from 'echarts-for-react';
import {
  usePlatformOverview,
  useLiveStatus,
  useAlertAnalytics,
  useTelemetryTrends,
} from '../../features/analytics/hooks/useAnalytics';

export const ViewerDashboard: React.FC<{ isAnalyticsLicensed?: boolean }> = ({ isAnalyticsLicensed = true }) => {
  const theme = useTheme();
  
  const { data: overview, isLoading: isOverviewLoading } = usePlatformOverview(isAnalyticsLicensed);
  const { data: liveStatus, isLoading: isLiveStatusLoading } = useLiveStatus(isAnalyticsLicensed);
  const { data: alerts, isLoading: isAlertsLoading } = useAlertAnalytics(isAnalyticsLicensed);
  const { data: trends, isLoading: isTrendsLoading } = useTelemetryTrends(isAnalyticsLicensed);

  const isLoading = isOverviewLoading || isLiveStatusLoading || isAlertsLoading || isTrendsLoading;

  const cardItems = [
    { text: 'Total Devices', value: overview?.devices ?? 0, icon: <DeviceIcon fontSize="large" />, color: '#6366f1' },
    { text: 'Online Devices', value: liveStatus?.online_devices ?? 0, icon: <OnlineIcon fontSize="large" />, color: '#10b981' },
    { text: 'Offline Devices', value: liveStatus?.offline_devices ?? 0, icon: <OfflineIcon fontSize="large" />, color: '#f59e0b' },
    { text: 'Active Alerts', value: alerts?.open ?? 0, icon: <AlertIcon fontSize="large" />, color: theme.palette.error.main },
  ];

  const lineChartOption = {
    title: { text: 'Telemetry Trends (24h)', left: 'center', color: theme.palette.text.primary },
    tooltip: { trigger: 'axis' },
    xAxis: {
      type: 'category',
      data: trends?.chart_data?.map(d => d.time) || [],
      axisLabel: { color: theme.palette.text.secondary },
    },
    yAxis: {
      type: 'value',
      axisLabel: { color: theme.palette.text.secondary },
      splitLine: { lineStyle: { color: theme.palette.divider } },
    },
    series: [
      {
        data: trends?.chart_data?.map(d => d.value) || [],
        type: 'line',
        smooth: true,
        itemStyle: { color: theme.palette.primary.main },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [
              { offset: 0, color: theme.palette.primary.main },
              { offset: 1, color: 'rgba(255, 255, 255, 0)' },
            ],
          },
        },
      },
    ],
    grid: { left: '10%', right: '10%', bottom: '15%' },
  };

  const healthPercent = liveStatus && overview?.devices 
    ? Math.round((liveStatus.online_devices / (overview.devices || 1)) * 100) 
    : 100;

  const gaugeChartOption = {
    tooltip: { formatter: '{a} <br/>{b} : {c}%' },
    series: [
      {
        name: 'System Health',
        type: 'gauge',
        detail: { formatter: '{value}%', valueAnimation: true, fontSize: 16, color: theme.palette.text.primary },
        data: [{ value: healthPercent, name: 'Health' }],
        axisLabel: { color: theme.palette.text.secondary, fontSize: 9 },
        title: { color: theme.palette.text.secondary, fontSize: 11 },
        progress: { show: true, itemStyle: { color: theme.palette.secondary.main } },
      },
    ],
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ fontWeight: 700, mb: 1, color: 'text.primary' }}>
          Viewer Dashboard
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Read-only overview of platform metrics and health.
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        {cardItems.map((card) => (
          <Grid size={{ xs: 12, sm: 6, md: 3 }} key={card.text}>
            <Card sx={{ height: '100%', display: 'flex', alignItems: 'center', boxShadow: 'none', border: `1px solid ${theme.palette.divider}` }}>
              <CardContent sx={{ display: 'flex', alignItems: 'center', width: '100%', gap: 2 }}>
                <Box sx={{ color: card.color, display: 'flex', alignItems: 'center' }}>
                  {card.icon}
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800 }}>
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

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Paper sx={{ p: 3, boxShadow: 'none', border: `1px solid ${theme.palette.divider}`, display: 'flex', flexDirection: 'column', height: 350 }}>
            <ReactECharts option={lineChartOption} style={{ height: '100%', width: '100%' }} />
          </Paper>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <Paper sx={{ p: 3, boxShadow: 'none', border: `1px solid ${theme.palette.divider}`, display: 'flex', flexDirection: 'column', height: 350, alignItems: 'center', justifyContent: 'center' }}>
            <Typography variant="h6" sx={{ fontSize: '0.95rem', fontWeight: 600, mb: 2, color: 'text.primary' }}>
              System Health Indicator
            </Typography>
            <ReactECharts option={gaugeChartOption} style={{ height: '80%', width: '100%' }} />
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};
