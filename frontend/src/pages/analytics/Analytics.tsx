import React from 'react';
import { useNavigate } from 'react-router';
import ReactECharts from 'echarts-for-react';
import { PageHeader } from '@/components/PageHeader';
import { Button } from '@/components/Button';
import { Card, Box, Typography, Grid } from '@mui/material';
import { Download, Activity, Server, AlertTriangle, Lock } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';
import { useLicenseStatus } from '@/features/settings/api/license';
import { 
  usePlatformOverview, 
  useLiveStatus, 
  useAlertAnalytics, 
  useRuleAnalytics, 
  useSensorActivity, 
  useTelemetryTrends 
} from '@/features/analytics/hooks/useAnalytics';

export const Analytics = () => {
  const navigate = useNavigate();
  const { data: licenseStatus, isLoading: isLicenseLoading } = useLicenseStatus();
  
  const isAnalyticsLicensed = licenseStatus?.status === 'ACTIVE' && 
    (licenseStatus?.features?.analytics || licenseStatus?.features?.Analytics);

  const { data: overview } = usePlatformOverview(isAnalyticsLicensed);
  const { data: liveStatus } = useLiveStatus(isAnalyticsLicensed);
  const { data: alerts } = useAlertAnalytics(isAnalyticsLicensed);
  const { data: rules } = useRuleAnalytics(isAnalyticsLicensed);
  const { data: sensors } = useSensorActivity(isAnalyticsLicensed);
  const { data: trends } = useTelemetryTrends(isAnalyticsLicensed);

  if (!isLicenseLoading && !isAnalyticsLicensed) {
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', pt: 4 }}>
        <EmptyState 
          icon={<Lock size={48} />}
          title="Analytics Not Licensed"
          description="The analytics module requires an active license with the Analytics feature enabled."
          action={
            <Button variant="contained" onClick={() => navigate('/settings/license')}>
              Manage License
            </Button>
          }
        />
      </Box>
    );
  }

  const handleExportCSV = () => {
    if (!overview || !liveStatus) return;
    
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Metric,Value\n"
      + `Organizations,${overview.organizations}\n`
      + `Devices,${overview.devices}\n`
      + `Online Devices,${liveStatus.online_devices}\n`
      + `Offline Devices,${liveStatus.offline_devices}\n`;
      
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "platform_analytics.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const healthPercent = liveStatus && overview?.devices 
    ? Math.round((liveStatus.online_devices / (overview.devices || 1)) * 100) 
    : 100;

  const trendOption = {
    title: { text: 'Device Trend' },
    tooltip: { trigger: 'axis' },
    xAxis: { 
      type: 'category', 
      data: trends?.chart_data.map(d => d.time) || [] 
    },
    yAxis: { type: 'value' },
    series: [{
      data: trends?.chart_data.map(d => d.value) || [],
      type: 'line',
      smooth: true,
      areaStyle: {}
    }]
  };

  const ruleOption = {
    title: { text: 'Most Triggered Rules' },
    tooltip: { trigger: 'axis' },
    xAxis: { type: 'value' },
    yAxis: { 
      type: 'category', 
      data: rules?.map(r => r.rule) || [] 
    },
    series: [{
      type: 'bar',
      data: rules?.map(r => r.count) || [],
      color: '#3b82f6'
    }]
  };

  const sensorOption = {
    title: { text: 'Sensor Types', left: 'center' },
    tooltip: { trigger: 'item' },
    legend: { orient: 'vertical', left: 'left' },
    series: [{
      type: 'pie',
      radius: '50%',
      data: sensors?.map(s => ({ value: s.readings, name: s.sensor })) || [],
      emphasis: {
        itemStyle: {
          shadowBlur: 10,
          shadowOffsetX: 0,
          shadowColor: 'rgba(0, 0, 0, 0.5)'
        }
      }
    }]
  };

  const gatewayGaugeOption = {
    tooltip: { formatter: '{a} <br/>{b} : {c}%' },
    series: [{
      name: 'Gateway Health',
      type: 'gauge',
      progress: { show: true },
      detail: { valueAnimation: true, formatter: '{value}%' },
      data: [{ 
        value: liveStatus && overview?.gateways 
          ? Math.round((liveStatus.online_gateways / (overview.gateways || 1)) * 100) 
          : 100, 
        name: 'Online' 
      }]
    }]
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <PageHeader 
          title="Platform Analytics" 
          description="Executive dashboard for IoT infrastructure"
        />
        <Button onClick={handleExportCSV} variant="outlined" startIcon={<Download />}>
          Export CSV
        </Button>
      </Box>

      <Grid container spacing={2}>
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Card>
            <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: 'primary.light', color: 'primary.dark', borderRadius: 2, display: 'flex' }}>
                <Activity size={24} />
              </Box>
              <Box sx={{ ml: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>Platform Health</Typography>
                <Typography variant="h5" color="text.primary" sx={{ fontWeight: 'bold' }}>{healthPercent}%</Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
        
        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Card>
            <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: 'success.light', color: 'success.dark', borderRadius: 2, display: 'flex' }}>
                <Server size={24} />
              </Box>
              <Box sx={{ ml: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>Organizations</Typography>
                <Typography variant="h5" color="text.primary" sx={{ fontWeight: 'bold' }}>{overview?.organizations || 0}</Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Card>
            <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: 'secondary.light', color: 'secondary.dark', borderRadius: 2, display: 'flex' }}>
                <Server size={24} />
              </Box>
              <Box sx={{ ml: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>Total Devices</Typography>
                <Typography variant="h5" color="text.primary" sx={{ fontWeight: 'bold' }}>{overview?.devices || 0}</Typography>
              </Box>
            </Box>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6, lg: 3 }}>
          <Card>
            <Box sx={{ display: 'flex', alignItems: 'center', p: 2 }}>
              <Box sx={{ p: 1.5, bgcolor: 'error.light', color: 'error.dark', borderRadius: 2, display: 'flex' }}>
                <AlertTriangle size={24} />
              </Box>
              <Box sx={{ ml: 2 }}>
                <Typography variant="body2" color="text.secondary" sx={{ fontWeight: 'medium' }}>Active Alerts</Typography>
                <Typography variant="h5" color="text.primary" sx={{ fontWeight: 'bold' }}>{alerts?.open || 0}</Typography>
              </Box>
            </Box>
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ p: 2 }}>
            <ReactECharts option={trendOption} style={{ height: '350px' }} />
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ p: 2 }}>
            <ReactECharts option={ruleOption} style={{ height: '350px' }} />
          </Card>
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ p: 2 }}>
            <ReactECharts option={sensorOption} style={{ height: '350px' }} />
          </Card>
        </Grid>
        <Grid size={{ xs: 12, lg: 6 }}>
          <Card sx={{ p: 2 }}>
            <ReactECharts option={gatewayGaugeOption} style={{ height: '350px' }} />
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Analytics;
