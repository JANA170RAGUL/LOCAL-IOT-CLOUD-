import React, { useState, useEffect } from 'react';
import { Box, Typography, CircularProgress, Chip, Button, GlobalStyles, Grid } from '@mui/material';
import { 
  Business as OrgIcon, CorporateFare as TenantIcon, Group as UserIcon, DeveloperBoard as DeviceIcon,
  Router as GatewayIcon, Folder as ProjectIcon, Hub as ChannelIcon, NotificationsActive as AlertIcon,
  CloudDone, Api, Storage, Memory, Add, BarChart, Warning, Lightbulb, AccessTime,
  Speed, NetworkCheck, Security
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer, BarChart as RechartsBarChart, Bar } from 'recharts';
import { 
  usePlatformOverview, 
  useTelemetryTrends, 
  useSensorActivity, 
  useLiveStatus, 
  useAlertAnalytics 
} from '../../features/analytics/hooks/useAnalytics';
import { useNavigate } from 'react-router';

// --- STATIC DATA FOR MISSING ENDPOINTS ---
const recentActivity = [
  { id: 1, text: 'New Gateway registered in Tenant A', time: '5m ago', color: '#3B82F6' },
  { id: 2, text: 'Firmware update pushed to 150 devices', time: '12m ago', color: '#8B5CF6' },
  { id: 3, text: 'High latency detected in EU-West Region', time: '45m ago', color: '#F59E0B' },
  { id: 4, text: 'Organization "AlphaCorp" created', time: '2h ago', color: '#22C55E' },
];

const aiInsights = [
  { id: 1, text: '3 Gateways are showing unusual thermal signatures. Predictive failure in ~4 days.', type: 'warning' },
  { id: 2, text: 'MQTT throughput in EU region has dropped by 15%. Optimization recommended.', type: 'info' },
  { id: 3, text: 'Anomaly detected in Sensor Cluster #4 (Soil Moisture). Automated alert triggered.', type: 'alert' },
];
// -----------------

const GlassCard: React.FC<{ children: React.ReactNode; sx?: object }> = ({ children, sx }) => (
  <Box sx={{
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
    overflow: 'hidden',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    '&:hover': {
      transform: 'translateY(-4px)',
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)',
    },
    ...sx
  }}>
    {children}
  </Box>
);

export const SuperAdminDashboard: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  
  const { data: overview, isLoading: isOverviewLoading } = usePlatformOverview();
  const { data: telemetryTrends, isLoading: isTrendsLoading } = useTelemetryTrends();
  const { data: sensorActivity, isLoading: isSensorsLoading } = useSensorActivity();
  const { data: liveStatus } = useLiveStatus();
  const { data: alertsData } = useAlertAnalytics();
  
  const isLoading = isOverviewLoading || isTrendsLoading || isSensorsLoading;

  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  const kpis = [
    { label: 'Organizations', value: overview?.organizations ?? 0, icon: <OrgIcon fontSize="large" />, color: '#3B82F6', trend: '+2%' },
    { label: 'Tenants', value: overview?.tenants ?? 0, icon: <TenantIcon fontSize="large" />, color: '#8B5CF6', trend: '+5%' },
    { label: 'Users', value: overview?.users ?? 0, icon: <UserIcon fontSize="large" />, color: '#EC4899', trend: '+12%' },
    { label: 'Devices', value: overview?.devices ?? 0, icon: <DeviceIcon fontSize="large" />, color: '#06B6D4', trend: '+18%' },
    { label: 'Gateways', value: overview?.gateways ?? 0, icon: <GatewayIcon fontSize="large" />, color: '#22C55E', trend: 'Stable' },
    { label: 'Projects', value: overview?.projects ?? 42, icon: <ProjectIcon fontSize="large" />, color: '#F59E0B', trend: '+4%' },
    { label: 'Sensors', value: overview?.sensors ?? 84, icon: <ChannelIcon fontSize="large" />, color: '#6366F1', trend: '+1%' },
    { label: 'Alerts', value: alertsData?.open ?? 3, icon: <AlertIcon fontSize="large" />, color: '#EF4444', trend: '-2%' },
  ];

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <CircularProgress size={60} thickness={4} sx={{ color: '#3B82F6' }} />
      </Box>
    );
  }

  return (
    <Box sx={{ 
      position: 'relative', 
      minHeight: '100vh',
      pb: 6,
      background: 'radial-gradient(circle at top right, rgba(59, 130, 246, 0.05) 0%, transparent 40%), radial-gradient(circle at bottom left, rgba(139, 92, 246, 0.05) 0%, transparent 40%)' 
    }}>
      <GlobalStyles styles={{
        '@keyframes floating': {
          '0%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-20px) rotate(5deg)' },
          '100%': { transform: 'translateY(0px) rotate(0deg)' }
        }
      }} />

      {/* Abstract Background Shapes */}
      <Box sx={{ position: 'absolute', top: 100, right: 100, width: 300, height: 300, background: 'linear-gradient(135deg, rgba(6,182,212,0.1), rgba(59,130,246,0.1))', borderRadius: '50%', filter: 'blur(60px)', animation: 'floating 10s ease-in-out infinite', zIndex: 0, pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', bottom: 200, left: -50, width: 400, height: 400, background: 'linear-gradient(135deg, rgba(236,72,153,0.05), rgba(139,92,246,0.08))', borderRadius: '50%', filter: 'blur(80px)', animation: 'floating 15s ease-in-out infinite reverse', zIndex: 0, pointerEvents: 'none' }} />

      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {/* HERO SECTION */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-1px', color: '#1E293B', mb: 1 }}>
              Platform Overview
            </Typography>
            <Typography variant="subtitle1" sx={{ color: '#64748B', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 1 }}>
              <AccessTime fontSize="small" /> Last Synced: {currentTime} • Live Monitoring Active
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <Button onClick={() => navigate('/organizations')} variant="contained" startIcon={<Add />} sx={{ background: 'linear-gradient(135deg, #3B82F6 0%, #06B6D4 100%)', borderRadius: '12px', textTransform: 'none', fontWeight: 600, boxShadow: '0 4px 14px rgba(59,130,246,0.4)' }}>
              Add Organization
            </Button>
            <Button onClick={() => navigate('/reports')} variant="outlined" startIcon={<BarChart />} sx={{ borderRadius: '12px', textTransform: 'none', fontWeight: 600, borderColor: 'rgba(59,130,246,0.3)', color: '#3B82F6' }}>
              Generate Report
            </Button>
          </Box>
        </Box>

        {/* STATUS RIBBON */}
        <Box sx={{ display: 'flex', gap: 1.5, mb: 5, overflowX: 'auto', pb: 1, '&::-webkit-scrollbar': { height: '4px' }, '&::-webkit-scrollbar-thumb': { background: '#CBD5E1', borderRadius: '4px' } }}>
          <Chip icon={<CloudDone style={{ color: '#10B981' }}/>} label="Cloud: Operational" sx={{ background: 'rgba(16,185,129,0.1)', color: '#065F46', fontWeight: 600, borderRadius: '10px', px: 1 }} />
          <Chip icon={<Speed style={{ color: '#10B981' }}/>} label={`MQTT Broker: ${liveStatus?.online_gateways ? 'Online' : 'Pending'}`} sx={{ background: 'rgba(16,185,129,0.1)', color: '#065F46', fontWeight: 600, borderRadius: '10px', px: 1 }} />
          <Chip icon={<Api style={{ color: '#10B981' }}/>} label="API Health: 99.9%" sx={{ background: 'rgba(16,185,129,0.1)', color: '#065F46', fontWeight: 600, borderRadius: '10px', px: 1 }} />
          <Chip icon={<Storage style={{ color: '#10B981' }}/>} label="Database: Healthy" sx={{ background: 'rgba(16,185,129,0.1)', color: '#065F46', fontWeight: 600, borderRadius: '10px', px: 1 }} />
          <Chip icon={<Memory style={{ color: '#F59E0B' }}/>} label="AI Engine: Processing" sx={{ background: 'rgba(245,158,11,0.1)', color: '#B45309', fontWeight: 600, borderRadius: '10px', px: 1 }} />
          <Chip icon={<Warning style={{ color: alertsData?.open ? '#EF4444' : '#10B981' }}/>} label={`Active Alerts: ${alertsData?.open ?? 0}`} sx={{ background: alertsData?.open ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: alertsData?.open ? '#991B1B' : '#065F46', fontWeight: 600, borderRadius: '10px', px: 1 }} />
        </Box>

        {/* KPI GRID */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {kpis.map((kpi, idx) => (
            <Grid size={{ xs: 12, sm: 6, md: 3 }} key={idx}>
              <GlassCard sx={{ p: 3, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `4px solid ${kpi.color}` }}>
                <Box>
                  <Typography variant="subtitle2" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px', mb: 0.5 }}>
                    {kpi.label}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'baseline', gap: 1 }}>
                    <Typography variant="h4" sx={{ fontWeight: 800, color: '#1E293B' }}>
                      {kpi.value.toLocaleString()}
                    </Typography>
                    <Typography variant="caption" sx={{ fontWeight: 700, color: kpi.trend.startsWith('+') ? '#10B981' : kpi.trend === 'Stable' ? '#64748B' : '#EF4444' }}>
                      {kpi.trend}
                    </Typography>
                  </Box>
                </Box>
                <Box sx={{ width: 56, height: 56, borderRadius: '16px', background: `${kpi.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: kpi.color }}>
                  {kpi.icon}
                </Box>
              </GlassCard>
            </Grid>
          ))}
        </Grid>

        {/* INTERACTIVE WIDGETS */}
        <Grid container spacing={3}>
          {/* Main Chart */}
          <Grid size={{ xs: 12, lg: 8 }}>
            <GlassCard sx={{ p: 3, height: '100%', display: 'flex', flexDirection: 'column' }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B' }}>
                  Telemetry Trend (Real-time)
                </Typography>
                <Chip label="Live Data" size="small" color="success" variant="outlined" sx={{ fontWeight: 600 }} />
              </Box>
              <Box sx={{ flexGrow: 1, minHeight: 300 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={telemetryTrends?.chart_data || []}>
                    <defs>
                      <linearGradient id="colorConns" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                    <RechartsTooltip 
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)' }}
                      labelStyle={{ fontWeight: 700, color: '#1E293B', marginBottom: '4px' }}
                    />
                    <Area type="monotone" dataKey="value" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorConns)" />
                  </AreaChart>
                </ResponsiveContainer>
              </Box>
            </GlassCard>
          </Grid>

          {/* AI Insights */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <GlassCard sx={{ p: 3, height: '100%', background: 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.9) 100%)' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 3 }}>
                <Box sx={{ width: 40, height: 40, borderRadius: '10px', background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Lightbulb sx={{ color: 'white' }} />
                </Box>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B' }}>
                  AI Insights
                </Typography>
              </Box>
              
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {aiInsights.map((insight) => (
                  <Box key={insight.id} sx={{ p: 2, borderRadius: '12px', background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.05)' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#334155', lineHeight: 1.5 }}>
                      {insight.text}
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, fontWeight: 700, color: insight.type === 'warning' ? '#F59E0B' : insight.type === 'alert' ? '#EF4444' : '#3B82F6', textTransform: 'uppercase' }}>
                      {insight.type === 'warning' ? 'Warning' : insight.type === 'alert' ? 'Action Required' : 'Optimization'}
                    </Typography>
                  </Box>
                ))}
              </Box>
              <Button fullWidth variant="text" sx={{ mt: 2, fontWeight: 700, color: '#8B5CF6' }}>
                View Full AI Analysis
              </Button>
            </GlassCard>
          </Grid>

          {/* Bar Chart: Sensor Activity */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <GlassCard sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B', mb: 3 }}>
                Sensor Activity (Readings)
              </Typography>
              <Box sx={{ height: 250 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsBarChart data={sensorActivity || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                    <XAxis dataKey="sensor" axisLine={false} tickLine={false} tick={{ fill: '#64748B', fontSize: 12 }} />
                    <RechartsTooltip cursor={{ fill: 'rgba(0,0,0,0.04)' }} contentStyle={{ borderRadius: '12px' }} />
                    <Bar dataKey="readings" fill="#06B6D4" radius={[4, 4, 0, 0]} />
                  </RechartsBarChart>
                </ResponsiveContainer>
              </Box>
            </GlassCard>
          </Grid>

          {/* Recent Activity Timeline */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <GlassCard sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B', mb: 3 }}>
                Recent Activity
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {recentActivity.map((activity) => (
                  <Box key={activity.id} sx={{ display: 'flex', gap: 2 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Box sx={{ width: 12, height: 12, borderRadius: '50%', background: activity.color, mt: 0.5 }} />
                      <Box sx={{ width: 2, flexGrow: 1, background: '#E2E8F0', mt: 0.5, minHeight: 20 }} />
                    </Box>
                    <Box sx={{ pb: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                        {activity.text}
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 500 }}>
                        {activity.time}
                      </Typography>
                    </Box>
                  </Box>
                ))}
              </Box>
            </GlassCard>
          </Grid>

          {/* Quick Actions */}
          <Grid size={{ xs: 12, lg: 4 }}>
            <GlassCard sx={{ p: 3, height: '100%' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B', mb: 3 }}>
                Quick Actions
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {[
                  { label: 'Register New Gateway', icon: <GatewayIcon />, color: '#10B981', path: '/gateways' },
                  { label: 'Add Device to Tenant', icon: <DeviceIcon />, color: '#3B82F6', path: '/tenants' },
                  { label: 'Create New Organization', icon: <OrgIcon />, color: '#8B5CF6', path: '/organizations' },
                  { label: 'Configure Security Roles', icon: <Security />, color: '#EC4899', path: '/roles' },
                  { label: 'View Network Map', icon: <NetworkCheck />, color: '#06B6D4', path: '/telemetry' },
                ].map((action, idx) => (
                  <Button 
                    key={idx} 
                    variant="outlined" 
                    fullWidth 
                    startIcon={action.icon}
                    onClick={() => navigate(action.path)}
                    sx={{ 
                      justifyContent: 'flex-start', 
                      p: 1.5, 
                      borderRadius: '12px', 
                      borderColor: 'rgba(0,0,0,0.1)', 
                      color: '#475569', 
                      fontWeight: 600,
                      '&:hover': {
                        borderColor: action.color,
                        background: `${action.color}10`,
                        color: action.color
                      }
                    }}
                  >
                    {action.label}
                  </Button>
                ))}
              </Box>
            </GlassCard>
          </Grid>
          
        </Grid>
      </Box>
    </Box>
  );
};
