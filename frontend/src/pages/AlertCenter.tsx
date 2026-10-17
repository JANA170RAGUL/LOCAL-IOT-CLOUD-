import React, { useState, useEffect } from 'react';
import { Box, Card, Typography, Chip, CircularProgress, Alert, GlobalStyles, Grid, Divider } from '@mui/material';
import { CloudDone, Speed, Memory, CheckCircle, Warning, ErrorOutlined, DeviceHub, Timeline, FilterList, AccessTime, Info } from '@mui/icons-material';
import { HierarchySelector } from '../components/HierarchySelector';
import type { HierarchySelection } from '../components/HierarchySelector';
import { AlertTable } from '../features/alerts/components/AlertTable';
import { AlertFilters } from '../features/alerts/components/AlertFilters';
import { AlertDetailsDrawer } from '../features/alerts/components/AlertDetailsDrawer';
import { useAlertsQuery, useAcknowledgeAlertMutation, useResolveAlertMutation, useAlertsStream } from '../features/alerts/hooks/useAlerts';
import type { AlertFilterParams, BackendAlert } from '../features/alerts/types';
import { usePlatformOverview, useLiveStatus, useAlertAnalytics } from '../features/analytics/hooks/useAnalytics';
import { EChartBase } from '../components/charts/EChartBase';

// --- STYLED COMPONENTS ---
const GlassCard: React.FC<{ children: React.ReactNode; sx?: object; id?: string }> = ({ children, sx, id }) => (
  <Box id={id} sx={{
    background: 'rgba(255, 255, 255, 0.7)',
    backdropFilter: 'blur(20px)',
    borderRadius: '20px',
    border: '1px solid rgba(255, 255, 255, 0.5)',
    boxShadow: '0 8px 32px rgba(0, 0, 0, 0.04)',
    overflow: 'hidden',
    transition: 'transform 0.3s ease, box-shadow 0.3s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.06)',
    },
    ...sx
  }}>
    {children}
  </Box>
);

export const AlertCenter: React.FC = () => {
  const [selection, setSelection] = useState<HierarchySelection>({
    orgId: '',
    tenantId: '',
    projectId: '',
    gatewayId: '',
  });

  const selectedProjectId = selection.projectId;
  
  const [filters, setFilters] = useState<AlertFilterParams>({
    page: 1,
    page_size: 10,
  });

  const [selectedAlert, setSelectedAlert] = useState<BackendAlert | null>(null);

  // REAL API HOOKS
  const { data: alertsData, isLoading: alertsLoading } = useAlertsQuery(selectedProjectId, filters);
  const acknowledgeMutation = useAcknowledgeAlertMutation();
  const resolveMutation = useResolveAlertMutation();

  const { data: liveStatus, isError: liveStatusError } = useLiveStatus();
  const { data: overview, isError: overviewError } = usePlatformOverview();
  const { data: alertStats, isLoading: alertStatsLoading, isError: alertStatsError } = useAlertAnalytics();

  // Initialize live streaming if a project is selected
  useAlertsStream(selectedProjectId);

  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handlePageChange = (newPage: number) => {
    setFilters({ ...filters, page: newPage });
  };

  const handlePageSizeChange = (newPageSize: number) => {
    setFilters({ ...filters, page_size: newPageSize, page: 1 });
  };

  const handleAcknowledge = (alertId: string, operatorName: string) => {
    acknowledgeMutation.mutate({ alertId, acknowledgedBy: operatorName });
  };

  const handleResolve = (alertId: string) => {
    resolveMutation.mutate(alertId);
  };

  const kpis = [
    { label: 'OPEN', value: alertStats?.open ?? 0, color: '#EF4444' },
    { label: 'ACKNOWLEDGED', value: alertStats?.acknowledged ?? 0, color: '#F59E0B' },
    { label: 'RESOLVED', value: alertStats?.resolved ?? 0, color: '#10B981' },
    { label: 'CRITICAL', value: alertStats?.critical ?? 0, color: '#DC2626' },
    { label: 'WARNING', value: alertStats?.warning ?? 0, color: '#F97316' },
    { label: 'TOTAL ALERTS', value: (alertStats?.open ?? 0) + (alertStats?.acknowledged ?? 0) + (alertStats?.resolved ?? 0), color: '#3B82F6' },
  ];

  const pieChartOption = {
    tooltip: { trigger: 'item' },
    legend: { top: '5%', left: 'center' },
    series: [
      {
        name: 'Severity',
        type: 'pie',
        radius: ['40%', '70%'],
        avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#fff', borderWidth: 2 },
        label: { show: false, position: 'center' },
        emphasis: {
          label: { show: true, fontSize: 20, fontWeight: 'bold' }
        },
        labelLine: { show: false },
        data: [
          { value: alertStats?.critical ?? 0, name: 'Critical', itemStyle: { color: '#EF4444' } },
          { value: alertStats?.warning ?? 0, name: 'Warning', itemStyle: { color: '#F59E0B' } }
        ]
      }
    ]
  };

  const trendChartOption = {
    title: { text: 'No historical alert data available from backend', left: 'center', top: 'center', textStyle: { color: '#94A3B8', fontSize: 14, fontWeight: 500 } },
    xAxis: { type: 'category', data: [], show: false },
    yAxis: { type: 'value', show: false },
    series: []
  };

  return (
    <Box sx={{ 
      position: 'relative', 
      minHeight: '100vh',
      pb: 6,
      background: 'radial-gradient(circle at top left, rgba(59, 130, 246, 0.05) 0%, transparent 40%), radial-gradient(circle at bottom right, rgba(239, 68, 68, 0.05) 0%, transparent 40%)' 
    }}>
      <GlobalStyles styles={{
        '@keyframes floatPulse': {
          '0%': { transform: 'scale(1)', opacity: 0.1 },
          '50%': { transform: 'scale(1.05)', opacity: 0.15 },
          '100%': { transform: 'scale(1)', opacity: 0.1 }
        }
      }} />

      <Box sx={{ position: 'absolute', top: 50, right: -50, width: 400, height: 400, background: 'linear-gradient(135deg, rgba(239,68,68,0.1), rgba(245,158,11,0.1))', borderRadius: '50%', filter: 'blur(80px)', animation: 'floatPulse 10s ease-in-out infinite', zIndex: 0, pointerEvents: 'none' }} />

      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {/* HERO SECTION */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-1px', color: '#1E293B', mb: 1 }}>
              Alert Center
            </Typography>
            <Typography variant="subtitle1" sx={{ color: '#64748B', fontWeight: 500 }}>
              Platform-wide real-time monitoring and incident management
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Chip 
              icon={<Speed style={{ color: liveStatusError ? '#EF4444' : '#10B981' }}/>} 
              label={`MQTT Broker: ${liveStatusError ? 'Offline' : (liveStatus?.online_gateways ? 'Connected' : 'Waiting')}`} 
              sx={{ background: liveStatusError ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)', color: liveStatusError ? '#991B1B' : '#065F46', fontWeight: 600, borderRadius: '10px' }} 
            />
            <Chip 
              icon={<CloudDone style={{ color: overviewError ? '#EF4444' : '#3B82F6' }}/>} 
              label={`Local Cloud: ${overviewError ? 'Error' : 'Running'}`} 
              sx={{ background: overviewError ? 'rgba(239,68,68,0.1)' : 'rgba(59,130,246,0.1)', color: overviewError ? '#991B1B' : '#1D4ED8', fontWeight: 600, borderRadius: '10px' }} 
            />
            <Chip 
              icon={<DeviceHub style={{ color: liveStatusError ? '#EF4444' : '#8B5CF6' }}/>} 
              label={`Active Devices: ${liveStatus?.online_devices ?? 0}`} 
              sx={{ background: liveStatusError ? 'rgba(239,68,68,0.1)' : 'rgba(139,92,246,0.1)', color: liveStatusError ? '#991B1B' : '#5B21B6', fontWeight: 600, borderRadius: '10px' }} 
            />
            <Chip 
              icon={<AccessTime style={{ color: '#64748B' }}/>} 
              label={`Last Updated: ${currentTime}`} 
              sx={{ background: 'rgba(100,116,139,0.1)', color: '#334155', fontWeight: 600, borderRadius: '10px' }} 
            />
          </Box>
        </Box>

        {/* KPI GRID (REAL DATA) */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {kpis.map((kpi, idx) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }} key={idx}>
              <GlassCard sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderBottom: `4px solid ${kpi.color}`, height: '100%' }}>
                {alertStatsLoading ? (
                  <CircularProgress size={30} sx={{ color: kpi.color, mb: 1 }} />
                ) : (
                  <Typography variant="h4" sx={{ fontWeight: 800, color: '#1E293B', mb: 0.5 }}>
                    {kpi.value}
                  </Typography>
                )}
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  {kpi.label}
                </Typography>
              </GlassCard>
            </Grid>
          ))}
        </Grid>

        {/* FILTER PANEL */}
        <GlassCard sx={{ p: 3, mb: 4 }}>
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle2" sx={{ color: '#475569', fontWeight: 700, textTransform: 'uppercase', display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <FilterList fontSize="small" /> Scope Selection
            </Typography>
            <HierarchySelector selection={selection} onChange={setSelection} maxDepth="project" variant="dropdown" />
          </Box>
        </GlassCard>

        {selectedProjectId ? (
          <Grid container spacing={4} sx={{ mb: 4 }}>
            {/* ALERT TREND (EMPTY STATE) */}
            <Grid size={{ xs: 12, lg: 8 }}>
              <GlassCard sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Timeline color="primary" /> Live Alert Trend
                </Typography>
                <Box sx={{ height: 250, background: 'rgba(248,250,252,0.5)', borderRadius: '12px', border: '1px dashed #CBD5E1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <EChartBase option={trendChartOption} height={250} />
                </Box>
              </GlassCard>
            </Grid>
            
            {/* SEVERITY DISTRIBUTION */}
            <Grid size={{ xs: 12, lg: 4 }}>
              <GlassCard sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B', mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ErrorOutlined color="warning" /> Severity Distribution
                </Typography>
                <Box sx={{ height: 250, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  {((alertStats?.critical ?? 0) + (alertStats?.warning ?? 0)) > 0 ? (
                    <EChartBase option={pieChartOption} height={250} />
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 3 }}>
                      <CheckCircle sx={{ fontSize: 44, color: '#10B981', mb: 1, opacity: 0.9 }} />
                      <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>
                        No Active Alerts
                      </Typography>
                      <Typography variant="caption" sx={{ color: '#94A3B8', display: 'block', mt: 0.5 }}>
                        0 Critical &bull; 0 Warning
                      </Typography>
                    </Box>
                  )}
                </Box>
              </GlassCard>
            </Grid>
          </Grid>
        ) : null}

        {selectedProjectId ? (
          <Grid container spacing={4}>
            {/* ACTIVE ALERTS TABLE */}
            <Grid size={{ xs: 12, lg: 8 }}>
              <GlassCard sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Warning color="error" /> Active Alerts Stream
                </Typography>
                <Box sx={{ mb: 3 }}>
                  <AlertFilters filters={filters} onFilterChange={setFilters} />
                </Box>
                {alertsData?.items && alertsData.items.length === 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 8 }}>
                    <CheckCircle sx={{ fontSize: 60, color: '#10B981', mb: 2 }} />
                    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B' }}>No Active Alerts</Typography>
                    <Typography variant="body2" sx={{ color: '#64748B' }}>System operating normally for this scope.</Typography>
                  </Box>
                ) : (
                  <AlertTable
                    alerts={alertsData?.items || []}
                    loading={alertsLoading}
                    page={filters.page!}
                    pageSize={filters.page_size!}
                    total={alertsData?.total || 0}
                    onPageChange={handlePageChange}
                    onPageSizeChange={handlePageSizeChange}
                    onViewDetails={setSelectedAlert}
                  />
                )}
              </GlassCard>
            </Grid>
            
            {/* RECENT EVENTS TIMELINE */}
            <Grid size={{ xs: 12, lg: 4 }}>
              <GlassCard sx={{ p: 3, height: '100%', background: 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.9) 100%)' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AccessTime color="info" /> Recent Events
                </Typography>
                {alertsLoading ? (
                  <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}><CircularProgress /></Box>
                ) : alertsData?.items && alertsData.items.length > 0 ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {alertsData.items.slice(0, 5).map((evt, i) => (
                      <Box key={evt.id} sx={{ display: 'flex', gap: 2 }}>
                        <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: evt.severity === 'CRITICAL' ? '#EF4444' : '#F59E0B', mt: 0.5 }} />
                          {i < 4 && <Box sx={{ width: 2, flexGrow: 1, background: '#E2E8F0', mt: 0.5, minHeight: 24 }} />}
                        </Box>
                        <Box sx={{ pb: i < 4 ? 2 : 0 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>{evt.title}</Typography>
                          <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 500, display: 'block' }}>{new Date(evt.created_at).toLocaleString()}</Typography>
                          <Typography variant="caption" sx={{ color: '#1D4ED8', fontWeight: 600 }}>{evt.status}</Typography>
                        </Box>
                      </Box>
                    ))}
                  </Box>
                ) : (
                  <Typography variant="body2" sx={{ color: '#64748B', textAlign: 'center', py: 4 }}>No recent events to display.</Typography>
                )}
              </GlassCard>
            </Grid>
          </Grid>
        ) : (
          <GlassCard sx={{ p: 6, textAlign: 'center' }}>
            <Info sx={{ fontSize: 48, color: '#3B82F6', mb: 2 }} />
            <Typography variant="h5" sx={{ fontWeight: 700, color: '#1E293B', mb: 1 }}>Scope Selection Required</Typography>
            <Typography color="text.secondary">
              Please select a Project from the hierarchy filter above to view live alerts and trends.
            </Typography>
          </GlassCard>
        )}

        <AlertDetailsDrawer
          open={Boolean(selectedAlert)}
          alert={selectedAlert || null}
          onClose={() => setSelectedAlert(null)}
          onAcknowledge={handleAcknowledge}
          onResolve={handleResolve}
        />
      </Box>
    </Box>
  );
};
