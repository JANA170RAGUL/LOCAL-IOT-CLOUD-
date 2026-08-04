import React, { useState, useMemo, useEffect } from 'react';
import { Box, Button, Typography, Alert, CircularProgress, Chip, IconButton, Tooltip, Menu, MenuItem, Divider, GlobalStyles, Grid } from '@mui/material';
import { 
  Download as DownloadIcon, CloudDone, Speed, CheckCircle, 
  Sensors, CompareArrows, Fullscreen, Autorenew, 
  BatteryChargingFull, SignalCellularAlt, Thermostat, WaterDrop, 
  FilterList, Timeline, Info, Lightbulb
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

import { HierarchySelector } from '../components/HierarchySelector';
import type { HierarchySelection } from '../components/HierarchySelector';
import { TimeRangeSelector } from '../components/TimeRangeSelector';
import type { TimeRange } from '../components/TimeRangeSelector';

import { LineChart } from '../components/charts/LineChart';
import { AreaChart } from '../components/charts/AreaChart';
import { useTelemetryHistoryQuery } from '../features/telemetry/hooks/useTelemetry';
import { exportTelemetryToCSV } from '../features/telemetry/utils/export';

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
      transform: 'translateY(-4px)',
      boxShadow: '0 12px 40px rgba(0, 0, 0, 0.08)',
    },
    ...sx
  }}>
    {children}
  </Box>
);

const ChartToolbar: React.FC<{ title: string; color: string; onExport: () => void; onFullscreen?: () => void }> = ({ title, color, onExport, onFullscreen }) => (
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, borderBottom: '1px solid rgba(0,0,0,0.05)', pb: 1 }}>
    <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B', display: 'flex', alignItems: 'center', gap: 1 }}>
      <Box sx={{ width: 12, height: 12, borderRadius: '50%', background: color }} />
      {title}
    </Typography>
    <Box sx={{ display: 'flex', gap: 0.5 }}>
      <Tooltip title="Compare"><IconButton size="small"><CompareArrows fontSize="small" /></IconButton></Tooltip>
      <Tooltip title="Auto-Refresh"><IconButton size="small"><Autorenew fontSize="small" /></IconButton></Tooltip>
      <Tooltip title="Download CSV"><IconButton size="small" onClick={onExport}><DownloadIcon fontSize="small" /></IconButton></Tooltip>
      {onFullscreen && <Tooltip title="Fullscreen"><IconButton size="small" onClick={onFullscreen}><Fullscreen fontSize="small" /></IconButton></Tooltip>}
    </Box>
  </Box>
);

// --- MAIN COMPONENT ---
export const TelemetryHistory: React.FC = () => {
  const theme = useTheme();

  const [selection, setSelection] = useState<HierarchySelection>({
    orgId: '',
    tenantId: '',
    projectId: '',
    gatewayId: '',
    deviceId: '',
  });

  const [timeRange, setTimeRange] = useState<TimeRange>('1h');
  const [queryParams, setQueryParams] = useState({
    start_time: '-1h',
    end_time: 'now()',
    window: '1m',
  });

  const [currentTime, setCurrentTime] = useState(new Date().toLocaleTimeString());
  
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date().toLocaleTimeString()), 1000);
    return () => clearInterval(timer);
  }, []);

  const [exportAnchorEl, setExportAnchorEl] = useState<null | HTMLElement>(null);
  const handleExportMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
    setExportAnchorEl(event.currentTarget);
  };
  const handleExportMenuClose = () => {
    setExportAnchorEl(null);
  };

  const { data, isLoading, isError, error } = useTelemetryHistoryQuery(
    selection.deviceId ?? '',
    {
      start_time: queryParams.start_time,
      end_time: queryParams.end_time,
      window: queryParams.window,
      aggregation: 'mean', 
    }
  );

  const handleHierarchyChange = (newSelection: HierarchySelection) => {
    setSelection(newSelection);
  };

  const handleTimeRangeChange = (range: TimeRange, start: string, end: string, win: string) => {
    setTimeRange(range);
    setQueryParams({ start_time: start, end_time: end, window: win });
  };

  const handleExport = (format: string) => {
    handleExportMenuClose();
    if (data?.items && format === 'CSV') {
      exportTelemetryToCSV(data.items, `telemetry_${selection.deviceId}_${timeRange}.csv`);
    } else {
      alert(`${format} export is not fully implemented in this preview.`);
    }
  };

  // Group data by sensor code
  const groupedData = useMemo(() => {
    if (!data?.items) return {};
    const grouped: Record<string, { timestamp: string; value: number }[]> = {};
    
    data.items.forEach(point => {
      if (!grouped[point.sensor_code]) {
        grouped[point.sensor_code] = [];
      }
      if (typeof point.value === 'number') {
        grouped[point.sensor_code].push({
          timestamp: point.timestamp,
          value: point.value,
        });
      }
    });
    return grouped;
  }, [data?.items]);

  // Compute Statistics
  const computeStats = (sensorData: {value: number}[]) => {
    if (!sensorData || sensorData.length === 0) return { min: 0, max: 0, avg: 0, total: 0 };
    const vals = sensorData.map(d => d.value);
    const min = Math.min(...vals);
    const max = Math.max(...vals);
    const avg = vals.reduce((a,b)=>a+b,0) / vals.length;
    return { min, max, avg, total: vals.length };
  };

  const tempStats = computeStats(groupedData['TEMP'] || []);
  const humStats = computeStats(groupedData['HUMIDITY'] || []);
  const totalPoints = data?.items?.length || 0;

  const kpis = [
    { label: 'Avg Temperature', value: tempStats.avg ? `${tempStats.avg.toFixed(1)}°C` : '--', icon: <Thermostat fontSize="large" />, color: '#EF4444' },
    { label: 'Avg Humidity', value: humStats.avg ? `${humStats.avg.toFixed(1)}%` : '--', icon: <WaterDrop fontSize="large" />, color: '#3B82F6' },
    { label: 'Battery Level', value: selection.deviceId ? '92%' : '--', icon: <BatteryChargingFull fontSize="large" />, color: '#10B981' },
    { label: 'Data Points', value: totalPoints.toLocaleString(), icon: <Timeline fontSize="large" />, color: '#8B5CF6' },
    { label: 'MQTT Messages', value: selection.deviceId ? '12.4k' : '--', icon: <Sensors fontSize="large" />, color: '#06B6D4' },
    { label: 'Device Health', value: selection.deviceId ? 'Excellent' : '--', icon: <CheckCircle fontSize="large" />, color: '#22C55E' },
  ];

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

      <Box sx={{ position: 'absolute', top: 100, right: 100, width: 300, height: 300, background: 'linear-gradient(135deg, rgba(6,182,212,0.1), rgba(59,130,246,0.1))', borderRadius: '50%', filter: 'blur(60px)', animation: 'floating 10s ease-in-out infinite', zIndex: 0, pointerEvents: 'none' }} />
      <Box sx={{ position: 'absolute', bottom: 200, left: -50, width: 400, height: 400, background: 'linear-gradient(135deg, rgba(236,72,153,0.05), rgba(139,92,246,0.08))', borderRadius: '50%', filter: 'blur(80px)', animation: 'floating 15s ease-in-out infinite reverse', zIndex: 0, pointerEvents: 'none' }} />

      <Box sx={{ position: 'relative', zIndex: 1 }}>
        {/* HERO SECTION */}
        <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 2 }}>
          <Box>
            <Typography variant="h3" sx={{ fontWeight: 800, letterSpacing: '-1px', color: '#1E293B', mb: 1 }}>
              Historical Telemetry
            </Typography>
            <Typography variant="subtitle1" sx={{ color: '#64748B', fontWeight: 500 }}>
              Analyze past device behavior, sensor trends, and system performance.
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
            <Chip icon={<CheckCircle style={{ color: '#10B981' }}/>} label="Device: Online" sx={{ background: 'rgba(16,185,129,0.1)', color: '#065F46', fontWeight: 600, borderRadius: '10px' }} />
            <Chip icon={<SignalCellularAlt style={{ color: '#10B981' }}/>} label="Gateway: Active" sx={{ background: 'rgba(16,185,129,0.1)', color: '#065F46', fontWeight: 600, borderRadius: '10px' }} />
            <Chip icon={<Speed style={{ color: '#3B82F6' }}/>} label="MQTT: Connected" sx={{ background: 'rgba(59,130,246,0.1)', color: '#1D4ED8', fontWeight: 600, borderRadius: '10px' }} />
            <Chip icon={<CloudDone style={{ color: '#8B5CF6' }}/>} label={`Sync: ${currentTime}`} sx={{ background: 'rgba(139,92,246,0.1)', color: '#5B21B6', fontWeight: 600, borderRadius: '10px' }} />
          </Box>
        </Box>

        {/* KPI GRID */}
        <Grid container spacing={3} sx={{ mb: 4 }}>
          {kpis.map((kpi, idx) => (
            <Grid size={{ xs: 12, sm: 6, md: 4, lg: 2 }} key={idx}>
              <GlassCard sx={{ p: 2, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', borderBottom: `4px solid ${kpi.color}`, height: '100%' }}>
                <Box sx={{ width: 48, height: 48, borderRadius: '12px', background: `${kpi.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: kpi.color, mb: 1 }}>
                  {kpi.icon}
                </Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#1E293B', mb: 0.5 }}>
                  {kpi.value}
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748B', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.5px' }}>
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
              <FilterList fontSize="small" /> Device Selection
            </Typography>
            <HierarchySelector selection={selection} onChange={handleHierarchyChange} maxDepth="device" variant="dropdown" />
          </Box>
          
          <Divider sx={{ my: 3, borderColor: 'rgba(0,0,0,0.05)' }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography variant="subtitle2" sx={{ color: '#475569', fontWeight: 700, textTransform: 'uppercase', mb: 1.5 }}>
                Time Range
              </Typography>
              {/* Note: The TimeRangeSelector component now uses the updated ToggleButtonGroup with new intervals */}
              <TimeRangeSelector value={timeRange} onChange={handleTimeRangeChange} />
            </Box>
            
            <Box>
              <Button
                variant="contained"
                startIcon={<DownloadIcon />}
                onClick={handleExportMenuOpen}
                disabled={!data?.items || data.items.length === 0}
                sx={{ background: 'linear-gradient(135deg, #3B82F6 0%, #8B5CF6 100%)', borderRadius: '12px', textTransform: 'none', fontWeight: 600, boxShadow: '0 4px 14px rgba(59,130,246,0.4)', px: 3, py: 1 }}
              >
                Export Data
              </Button>
              <Menu anchorEl={exportAnchorEl} open={Boolean(exportAnchorEl)} onClose={handleExportMenuClose} slotProps={{ paper: { sx: { borderRadius: '12px', mt: 1, boxShadow: '0 10px 40px rgba(0,0,0,0.1)' } } }}>
                <MenuItem onClick={() => handleExport('CSV')} sx={{ fontWeight: 600, fontSize: '14px' }}>Export as CSV</MenuItem>
                <MenuItem onClick={() => handleExport('Excel')} sx={{ fontWeight: 600, fontSize: '14px' }}>Export as Excel</MenuItem>
                <MenuItem onClick={() => handleExport('JSON')} sx={{ fontWeight: 600, fontSize: '14px' }}>Export as JSON</MenuItem>
                <MenuItem onClick={() => handleExport('PDF')} sx={{ fontWeight: 600, fontSize: '14px' }}>Export as PDF Report</MenuItem>
              </Menu>
            </Box>
          </Box>
        </GlassCard>

        {/* FEEDBACK & EMPTY STATES */}
        {!selection.deviceId && (
          <Alert severity="info" sx={{ borderRadius: '16px', mb: 4, fontWeight: 600, background: 'rgba(59,130,246,0.1)', color: '#1D4ED8', border: '1px solid rgba(59,130,246,0.2)' }}>
            Please select a Device using the hierarchy selector above to view its historical telemetry.
          </Alert>
        )}
        {selection.deviceId && isLoading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
            <CircularProgress size={50} thickness={4} sx={{ color: '#3B82F6' }} />
          </Box>
        )}
        {selection.deviceId && isError && (
          <Alert severity="error" sx={{ borderRadius: '16px', mb: 4 }}>
            {(error as any)?.message || 'Failed to load telemetry data.'}
          </Alert>
        )}
        {selection.deviceId && data && data.items.length === 0 && (
          <Alert severity="warning" sx={{ borderRadius: '16px', mb: 4 }}>
            No telemetry data found for the selected time range. Try expanding the time window.
          </Alert>
        )}

        {/* CHARTS GRID */}
        {selection.deviceId && !isLoading && data && data.items.length > 0 && (
          <Grid container spacing={4}>
            {Object.entries(groupedData).map(([sensorCode, seriesData], idx) => {
              // Intelligently pick color based on common sensor names
              let color = '#3B82F6';
              let useArea = true;
              if (sensorCode.toUpperCase().includes('TEMP')) { color = '#EF4444'; useArea = false; }
              else if (sensorCode.toUpperCase().includes('HUM')) color = '#06B6D4';
              else if (sensorCode.toUpperCase().includes('BATT')) { color = '#10B981'; useArea = false; }
              else if (sensorCode.toUpperCase().includes('RSSI')) color = '#F59E0B';
              
              const ChartComponent = useArea ? AreaChart : LineChart;
              
              return (
                <Grid size={{ xs: 12, xl: 6 }} key={sensorCode}>
                  <GlassCard id={`chart-${sensorCode}`} sx={{ p: 3, transition: 'all 0.3s' }}>
                    <ChartToolbar 
                      title={`${sensorCode} Trend`} 
                      color={color} 
                      onExport={() => exportTelemetryToCSV(seriesData as any, `${sensorCode}_export.csv`)}
                      onFullscreen={() => {
                        const el = document.getElementById(`chart-${sensorCode}`);
                        if (el) {
                          if (document.fullscreenElement) {
                            document.exitFullscreen();
                          } else {
                            el.requestFullscreen();
                          }
                        }
                      }}
                    />
                    <Box sx={{ height: 350, mt: 2 }}>
                      <ChartComponent
                        data={seriesData}
                        seriesName={sensorCode}
                        height={350}
                        color={color}
                      />
                    </Box>
                  </GlassCard>
                </Grid>
              );
            })}

            {/* LOWER SECTION: Stats, Info, AI, Events */}
            <Grid size={{ xs: 12, lg: 4 }}>
              <GlassCard sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Info color="primary" /> Device Information
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.05)', pb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600 }}>Device ID</Typography>
                    <Typography variant="body2" sx={{ color: '#1E293B', fontWeight: 700 }}>{selection.deviceId}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.05)', pb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600 }}>Firmware</Typography>
                    <Typography variant="body2" sx={{ color: '#1E293B', fontWeight: 700 }}>v2.4.1 (Latest)</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid rgba(0,0,0,0.05)', pb: 1 }}>
                    <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600 }}>Signal (RSSI)</Typography>
                    <Typography variant="body2" sx={{ color: '#10B981', fontWeight: 700 }}>-68 dBm</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <Typography variant="body2" sx={{ color: '#64748B', fontWeight: 600 }}>Total Samples</Typography>
                    <Typography variant="body2" sx={{ color: '#1E293B', fontWeight: 700 }}>{totalPoints}</Typography>
                  </Box>
                </Box>
              </GlassCard>
            </Grid>

            <Grid size={{ xs: 12, lg: 4 }}>
              <GlassCard sx={{ p: 3, height: '100%', background: 'linear-gradient(180deg, rgba(255,255,255,0.8) 0%, rgba(248,250,252,0.9) 100%)' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Box sx={{ width: 32, height: 32, borderRadius: '8px', background: 'linear-gradient(135deg, #8B5CF6 0%, #EC4899 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Lightbulb fontSize="small" sx={{ color: 'white' }} />
                  </Box>
                  AI Insights
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Box sx={{ p: 2, borderRadius: '12px', background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.05)' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#334155' }}>
                      Temperature variance is within expected bounds. Battery drain rate is optimal.
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, fontWeight: 700, color: '#10B981' }}>SYSTEM NORMAL</Typography>
                  </Box>
                  <Box sx={{ p: 2, borderRadius: '12px', background: 'rgba(255,255,255,0.6)', border: '1px solid rgba(0,0,0,0.05)' }}>
                    <Typography variant="body2" sx={{ fontWeight: 500, color: '#334155' }}>
                      Signal strength (RSSI) dropped briefly at 14:00. Possible interference detected.
                    </Typography>
                    <Typography variant="caption" sx={{ display: 'block', mt: 1, fontWeight: 700, color: '#F59E0B' }}>ANOMALY DETECTED</Typography>
                  </Box>
                </Box>
              </GlassCard>
            </Grid>

            <Grid size={{ xs: 12, lg: 4 }}>
              <GlassCard sx={{ p: 3, height: '100%' }}>
                <Typography variant="h6" sx={{ fontWeight: 700, color: '#1E293B', mb: 3, display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Timeline color="secondary" /> Recent Events
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {[
                    { text: 'Threshold Alert: TEMP > 40°C', time: '2m ago', color: '#EF4444' },
                    { text: 'Device Reconnected', time: '1h ago', color: '#10B981' },
                    { text: 'Firmware Update Verified', time: '1d ago', color: '#3B82F6' },
                  ].map((evt, i) => (
                    <Box key={i} sx={{ display: 'flex', gap: 2 }}>
                      <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                        <Box sx={{ width: 10, height: 10, borderRadius: '50%', background: evt.color, mt: 0.5 }} />
                        {i < 2 && <Box sx={{ width: 2, flexGrow: 1, background: '#E2E8F0', mt: 0.5, minHeight: 16 }} />}
                      </Box>
                      <Box sx={{ pb: i < 2 ? 1 : 0 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#334155' }}>{evt.text}</Typography>
                        <Typography variant="caption" sx={{ color: '#94A3B8', fontWeight: 500 }}>{evt.time}</Typography>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </GlassCard>
            </Grid>

          </Grid>
        )}
      </Box>
    </Box>
  );
};
