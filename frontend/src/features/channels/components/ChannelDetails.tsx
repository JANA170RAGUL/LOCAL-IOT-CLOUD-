import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Button, Card, CardContent, 
  CircularProgress, IconButton, Tooltip, Chip, Paper, Tabs, Tab, Grid, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, TablePagination,
  TextField, MenuItem, Select, FormControl, InputLabel, OutlinedInput, Checkbox, ListItemText, Alert,
  Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { 
  ArrowBack, ContentCopy, Visibility, VisibilityOff, Refresh, Public, Lock, Business,
  Storage, Speed, Message, AccessTime, CheckCircle, Warning, Error as ErrorIcon, ArrowUpward, ArrowDownward, Code, CloudUpload, CloudDownload, Delete
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router';
import { channelsApi, Channel, ChannelFeed, ChannelDashboardMetrics, ImportSummary } from '../api/channels';
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { format, formatDistanceToNow } from 'date-fns';
import { ChannelWebhooksTab } from './ChannelWebhooksTab';
import { ChannelThingSpeakTab } from './ChannelThingSpeakTab';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function CustomTabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;
  return (
    <div role="tabpanel" hidden={value !== index} {...other}>
      {value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
    </div>
  );
}

export const ChannelDetails: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const [channel, setChannel] = useState<Channel | null>(null);
  const [feeds, setFeeds] = useState<ChannelFeed[]>([]);
  const [metrics, setMetrics] = useState<ChannelDashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  
  const [showWriteKey, setShowWriteKey] = useState(false);
  const [mainTab, setMainTab] = useState(0);
  const [codeTab, setCodeTab] = useState(0);
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  // Export State
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportStart, setExportStart] = useState('');
  const [exportEnd, setExportEnd] = useState('');
  const [exportFields, setExportFields] = useState<string[]>([]);
  const [exporting, setExporting] = useState(false);

  // Import State
  const [importFormat, setImportFormat] = useState('csv');
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importSummary, setImportSummary] = useState<ImportSummary | null>(null);
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);

  const fetchData = async () => {
    if (!id) return;
    try {
      const [chRes, feedsRes, metricsRes] = await Promise.all([
        channelsApi.getChannel(id),
        channelsApi.getChannelFeeds(id, undefined, 500),
        channelsApi.getChannelDashboard(id)
      ]);
      setChannel(chRes);
      setFeeds(feedsRes.feeds.reverse()); // Oldest to newest for charts
      setMetrics(metricsRes);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [id]);

  const [createdRawKeyModal, setCreatedRawKeyModal] = useState<{ open: boolean; rawKey: string; keyType: string; name: string }>({
    open: false,
    rawKey: '',
    keyType: '',
    name: ''
  });

  const copyToClipboard = (text: string) => navigator.clipboard.writeText(text);

  const handleRegenerate = async (type: 'read' | 'write') => {
    if (window.confirm(`Are you sure you want to regenerate the ${type.toUpperCase()} API key? Any applications using the old key will lose access immediately.`)) {
      if (id) {
        try {
          const res = await channelsApi.regenerateApiKey(id, type);
          setCreatedRawKeyModal({
            open: true,
            rawKey: res.raw_key,
            keyType: res.key_type,
            name: res.name
          });
          fetchData();
        } catch (e) {
          console.error(e);
          alert('Failed to regenerate key');
        }
      }
    }
  };

  const handleDeleteChannel = async () => {
    if (window.confirm(`Are you sure you want to delete channel "${channel?.name}"? All associated settings and telemetry feeds will be permanently deleted.`)) {
      if (id) {
        try {
          await channelsApi.deleteChannel(id);
          navigate('/channels');
        } catch (e) {
          console.error('Failed to delete channel', e);
          alert('Failed to delete channel');
        }
      }
    }
  };

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleExport = async () => {
    if (!id || !channel) return;
    setExporting(true);
    try {
      const readKey = channel.api_keys.find(k => k.key_type === 'read')?.api_key;
      const params: any = {};
      if (readKey) params.api_key = readKey;
      if (exportStart) params.start = new Date(exportStart).toISOString();
      if (exportEnd) params.end = new Date(exportEnd).toISOString();
      if (exportFields.length > 0) params.fields = exportFields;

      const blob = await channelsApi.exportChannelData(id, exportFormat, params);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const exts: Record<string, string> = { csv: 'csv', excel: 'xlsx', json: 'json' };
      a.download = `channel_${id}_export.${exts[exportFormat]}`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (e) {
      console.error('Export failed', e);
      alert('Export failed.');
    } finally {
      setExporting(false);
    }
  };

  const handleImport = async () => {
    if (!id || !channel || !importFile) return;
    setImporting(true);
    setImportError(null);
    setImportSummary(null);
    try {
      const writeKey = channel.api_keys.find(k => k.key_type === 'write')?.api_key;
      const summary = await channelsApi.importChannelData(id, importFormat, importFile, writeKey);
      setImportSummary(summary);
      fetchData(); // Refresh dashboard
    } catch (e: any) {
      console.error('Import failed', e);
      setImportError(e.response?.data?.detail || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  if (loading) return <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;
  if (!channel || !metrics) return <Box sx={{ p: 3 }}><Typography>Channel not found</Typography></Box>;

  const readKey = channel.api_keys.find(k => k.key_type === 'read')?.api_key;
  const writeKey = channel.api_keys.find(k => k.key_type === 'write')?.api_key;
  const publicUrl = `${window.location.origin}/public/channel/${channel.id}`;
  const apiUrl = `${window.location.origin}/api/v1/channels/write`;

  const lastFeed = feeds.length > 0 ? feeds[feeds.length - 1] : null;
  const prevFeed = feeds.length > 1 ? feeds[feeds.length - 2] : null;

  const handleDownloadPostman = () => {
    const postmanData = {
      info: {
        name: `Local IoT Cloud - ${channel.name}`,
        schema: "https://schema.getpostman.com/json/collection/v2.1.0/collection.json"
      },
      item: [
        {
          name: "Write Data",
          request: {
            method: "POST",
            header: [ { key: "Content-Type", value: "application/json" } ],
            url: { raw: apiUrl, host: [apiUrl] },
            body: {
              mode: "raw",
              raw: JSON.stringify({
                api_key: writeKey,
                ...Object.fromEntries(channel.fields.map(f => [f.field_key, 25.5]))
              }, null, 2)
            }
          }
        }
      ]
    };
    const blob = new Blob([JSON.stringify(postmanData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `postman_collection_${channel.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Reverse feeds for the table (Newest to Oldest)
  const tableFeeds = [...feeds].reverse();

  return (
    <Box sx={{ p: 3 }}>
      <Button startIcon={<ArrowBack />} onClick={() => navigate('/channels')} sx={{ mb: 2 }}>
        Back to Channels
      </Button>
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>{channel.name}</Typography>
          <Typography color="textSecondary" sx={{ mb: 1 }}>{channel.description}</Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {channel.visibility === 'public' && <Chip size="small" icon={<Public fontSize="small"/>} label="Public" color="success" variant="outlined" />}
            {channel.visibility === 'private' && <Chip size="small" icon={<Lock fontSize="small"/>} label="Private" color="default" variant="outlined" />}
            {channel.visibility === 'enterprise' && <Chip size="small" icon={<Business fontSize="small"/>} label="Enterprise" color="primary" variant="outlined" />}
            
            <Chip 
              size="small" 
              icon={metrics.health_status === 'Healthy' ? <CheckCircle fontSize="small" /> : metrics.health_status === 'Idle' ? <Warning fontSize="small"/> : <ErrorIcon fontSize="small"/>}
              label={metrics.health_status} 
              color={metrics.health_status === 'Healthy' ? 'success' : metrics.health_status === 'Idle' ? 'warning' : 'error'} 
              variant="filled" 
            />
          </Box>
        </Box>

        <Button
          variant="outlined"
          color="error"
          startIcon={<Delete />}
          onClick={handleDeleteChannel}
          sx={{ borderRadius: 2 }}
        >
          Delete Channel
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={mainTab} onChange={(e, v) => setMainTab(v)}>
          <Tab label="Operational Dashboard" />
          <Tab label="Settings & Integration" />
          <Tab label="Data Import / Export" />
          <Tab label="Webhooks & Events" />
          <Tab label="MATLAB / ThingSpeak" />
        </Tabs>
      </Box>

      {/* DASHBOARD TAB */}
      <CustomTabPanel value={mainTab} index={0}>
        <Grid container spacing={3}>
          {/* KPI Cards */}
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ bgcolor: 'primary.main', color: 'primary.contrastText', height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Total Messages</Typography>
                  <Message />
                </Box>
                <Typography variant="h4" sx={{ mt: 2, fontWeight: 'bold' }}>{metrics.total_messages.toLocaleString()}</Typography>
                <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>{metrics.messages_today.toLocaleString()} today</Typography>
              </CardContent>
            </Card>
          </Grid>
          
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ bgcolor: 'secondary.main', color: 'secondary.contrastText', height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Last Write</Typography>
                  <AccessTime />
                </Box>
                <Typography variant="h5" sx={{ mt: 2, fontWeight: 'bold' }}>
                  {metrics.last_write ? formatDistanceToNow(new Date(metrics.last_write), { addSuffix: true }) : 'Never'}
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>
                  {metrics.last_write ? format(new Date(metrics.last_write), 'PPpp') : '--'}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ bgcolor: 'info.main', color: 'info.contrastText', height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Average Rate</Typography>
                  <Speed />
                </Box>
                <Typography variant="h4" sx={{ mt: 2, fontWeight: 'bold' }}>{metrics.average_rate_sec}</Typography>
                <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>msg / sec</Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Card sx={{ bgcolor: 'success.main', color: 'success.contrastText', height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Typography variant="subtitle2" sx={{ opacity: 0.8 }}>Storage Used</Typography>
                  <Storage />
                </Box>
                <Typography variant="h4" sx={{ mt: 2, fontWeight: 'bold' }}>
                  {(metrics.storage_used_bytes / 1024 / 1024).toFixed(2)} MB
                </Typography>
                <Typography variant="body2" sx={{ mt: 1, opacity: 0.8 }}>Estimated series footprint</Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Live Charts */}
          <Grid size={{ xs: 12 }}>
            <Card sx={{ borderRadius: 2, boxShadow: 3 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>Live Telemetry</Typography>
                <Box sx={{ height: 350, width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={feeds}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.2} />
                      <XAxis dataKey="created_at" tickFormatter={(t) => format(new Date(t), 'HH:mm')} />
                      <YAxis />
                      <RechartsTooltip labelFormatter={(l) => format(new Date(l), 'PPpp')} />
                      {channel.fields.map((field, i) => (
                        <Line 
                          key={field.field_key} 
                          type="monotone" 
                          dataKey={field.field_key} 
                          name={field.name}
                          stroke={['#0f4c81', '#ff7300', '#387908', '#ff0000', '#00bcd4', '#9c27b0'][i % 6]} 
                          strokeWidth={2} 
                          dot={false} 
                          isAnimationActive={false}
                        />
                      ))}
                    </LineChart>
                  </ResponsiveContainer>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Field KPI Cards */}
          {channel.fields.map(field => {
            const currentVal = lastFeed ? lastFeed[field.field_key] : null;
            const previousVal = prevFeed ? prevFeed[field.field_key] : null;
            
            let delta = 0;
            if (currentVal !== null && previousVal !== null && typeof currentVal === 'number' && typeof previousVal === 'number') {
              delta = currentVal - previousVal;
            }

            return (
              <Grid size={{ xs: 12, sm: 6, md: 3 }} key={field.id}>
                <Card sx={{ borderRadius: 2, height: '100%', boxShadow: 2 }}>
                  <CardContent>
                    <Typography variant="subtitle2" color="textSecondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                      {field.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', mt: 1 }}>
                      <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                        {currentVal !== null && currentVal !== undefined ? currentVal : '--'}
                      </Typography>
                      {field.unit && <Typography variant="h6" color="textSecondary" sx={{ ml: 1 }}>{field.unit}</Typography>}
                    </Box>
                    <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                      {delta !== 0 && (
                        delta > 0 
                          ? <ArrowUpward color="success" fontSize="small" sx={{ mr: 0.5 }} /> 
                          : <ArrowDownward color="error" fontSize="small" sx={{ mr: 0.5 }} />
                      )}
                      <Typography variant="body2" color={delta > 0 ? 'success.main' : delta < 0 ? 'error.main' : 'textSecondary'}>
                        {delta !== 0 ? `${delta > 0 ? '+' : ''}${typeof delta === 'number' ? delta.toFixed(2) : delta}` : 'No change'}
                      </Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}

          {/* API Usage & Health */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Card sx={{ borderRadius: 2, height: '100%', boxShadow: 2 }}>
              <CardContent>
                <Typography variant="h6" sx={{ mb: 2 }}>API Usage & Health</Typography>
                
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="textSecondary">Requests Today</Typography>
                  <Typography sx={{ fontWeight: 'bold' }}>{metrics.api_usage.requests_today}</Typography>
                </Box>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="textSecondary">Failed Requests</Typography>
                  <Typography sx={{ fontWeight: 'bold' }} color="error">{metrics.api_usage.failed_requests}</Typography>
                </Box>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="textSecondary">Avg Response Time</Typography>
                  <Typography sx={{ fontWeight: 'bold' }}>{metrics.api_usage.average_response_time_ms} ms</Typography>
                </Box>
                
                <Typography variant="subtitle2" sx={{ mt: 3, mb: 1, fontWeight: 'bold' }}>Data Quality</Typography>
                <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="textSecondary">Missing Values</Typography>
                  <Typography sx={{ fontWeight: 'bold' }}>{metrics.data_quality.missing_values}</Typography>
                </Box>
                <Box sx={{ mb: 1, display: 'flex', justifyContent: 'space-between' }}>
                  <Typography color="textSecondary">Packet Loss Est.</Typography>
                  <Typography sx={{ fontWeight: 'bold' }}>{metrics.data_quality.packet_loss_estimate}</Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Recent Feeds Table */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Card sx={{ borderRadius: 2, height: '100%', boxShadow: 2 }}>
              <CardContent sx={{ p: 0 }}>
                <Box sx={{ p: 2, borderBottom: 1, borderColor: 'divider' }}>
                  <Typography variant="h6">Recent Feeds</Typography>
                </Box>
                <TableContainer>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Time</TableCell>
                        {channel.fields.map(f => (
                          <TableCell key={f.field_key}>{f.name}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {tableFeeds
                        .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                        .map((row, i) => (
                        <TableRow key={i} hover>
                          <TableCell>{format(new Date(row.created_at), 'PPpp')}</TableCell>
                          {channel.fields.map(f => (
                            <TableCell key={f.field_key}>{row[f.field_key] !== undefined ? row[f.field_key] : '--'}</TableCell>
                          ))}
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                <TablePagination
                  rowsPerPageOptions={[10, 25, 50]}
                  component="div"
                  count={tableFeeds.length}
                  rowsPerPage={rowsPerPage}
                  page={page}
                  onPageChange={handleChangePage}
                  onRowsPerPageChange={handleChangeRowsPerPage}
                />
              </CardContent>
            </Card>
          </Grid>

        </Grid>
      </CustomTabPanel>

      {/* SETTINGS TAB */}
      <CustomTabPanel value={mainTab} index={1}>
        <Grid container spacing={3}>
          {/* Share Dialog Card */}
          <Grid size={{ xs: 12, md: 5 }}>
            <Card sx={{ borderRadius: 2, height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                  <Public color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Share & Access</Typography>
                </Box>
                
                {channel.visibility === 'public' && (
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Public URL</Typography>
                    <Typography variant="body2" color="textSecondary">Anyone with this link can view this channel's live dashboard.</Typography>
                    <Paper variant="outlined" sx={{ p: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1, bgcolor: 'background.default' }}>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', overflow: 'hidden', textOverflow: 'ellipsis' }}>{publicUrl}</Typography>
                      <Tooltip title="Copy Public URL">
                        <IconButton size="small" onClick={() => copyToClipboard(publicUrl)}>
                          <ContentCopy fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Paper>
                  </Box>
                )}

                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Read API Key</Typography>
                  <Typography variant="body2" color="textSecondary">Hashed securely in database. Raw key shown once upon creation/rotation.</Typography>
                  <Paper variant="outlined" sx={{ p: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1, bgcolor: 'background.default' }}>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {readKey ? `${readKey.substring(0, 16)}...` : 'Key Hashed & Active'}
                    </Typography>
                    <Box>
                      <Tooltip title="Regenerate / Rotate Read Key">
                        <IconButton size="small" onClick={() => handleRegenerate('read')} color="warning">
                          <Refresh fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Paper>
                </Box>

                <Box sx={{ mb: 3 }}>
                  <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Write API Key</Typography>
                  <Typography variant="body2" color="textSecondary">Hashed securely in database. Raw key shown once upon creation/rotation.</Typography>
                  <Paper variant="outlined" sx={{ p: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1, bgcolor: 'background.default' }}>
                    <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                      {writeKey ? `${writeKey.substring(0, 16)}...` : 'Key Hashed & Active'}
                    </Typography>
                    <Box>
                      <Tooltip title="Regenerate / Rotate Write Key">
                        <IconButton size="small" onClick={() => handleRegenerate('write')} color="warning">
                          <Refresh fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  </Paper>
                </Box>

                <Box sx={{ mt: 4, pt: 3, borderTop: 1, borderColor: 'divider' }}>
                  <Typography variant="subtitle2" color="error" sx={{ fontWeight: 'bold', mb: 1 }}>Danger Zone</Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>Permanently delete this channel and all recorded telemetry feeds.</Typography>
                  <Button variant="outlined" color="error" startIcon={<Delete />} onClick={handleDeleteChannel} fullWidth>
                    Delete Channel
                  </Button>
                </Box>
              </CardContent>
            </Card>
          </Grid>

          {/* Code Examples Card */}
          <Grid size={{ xs: 12, md: 7 }}>
            <Card sx={{ borderRadius: 2, height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                  <Typography variant="h6">Code Examples</Typography>
                  <Button variant="outlined" size="small" onClick={handleDownloadPostman}>
                    Download Postman
                  </Button>
                </Box>
                
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                  <Tabs value={codeTab} onChange={(e, v) => setCodeTab(v)} variant="scrollable" scrollButtons="auto">
                    <Tab label="cURL" />
                    <Tab label="Python" />
                    <Tab label="Node.js" />
                    <Tab label="ESP32 / Arduino" />
                  </Tabs>
                </Box>

                <CustomTabPanel value={codeTab} index={0}>
                  <Paper sx={{ p: 2, bgcolor: '#1e1e1e', color: '#d4d4d4', overflowX: 'auto', borderRadius: 1 }}>
                    <Typography variant="body2" component="pre" sx={{ m: 0, fontFamily: 'monospace' }}>
{`curl -X POST ${apiUrl} \\
  -H "Content-Type: application/json" \\
  -d '{
    "api_key": "${writeKey}",
${channel.fields.map((f, i) => `    "${f.field_key}": 25.5${i < channel.fields.length - 1 ? ',' : ''}`).join('\n')}
  }'`}
                    </Typography>
                  </Paper>
                </CustomTabPanel>

                <CustomTabPanel value={codeTab} index={1}>
                  <Paper sx={{ p: 2, bgcolor: '#1e1e1e', color: '#d4d4d4', overflowX: 'auto', borderRadius: 1 }}>
                    <Typography variant="body2" component="pre" sx={{ m: 0, fontFamily: 'monospace' }}>
{`import requests

url = "${apiUrl}"
payload = {
    "api_key": "${writeKey}",
${channel.fields.map((f, i) => `    "${f.field_key}": 25.5${i < channel.fields.length - 1 ? ',' : ''}`).join('\n')}
}
response = requests.post(url, json=payload)
print(response.json())`}
                    </Typography>
                  </Paper>
                </CustomTabPanel>

                <CustomTabPanel value={codeTab} index={2}>
                  <Paper sx={{ p: 2, bgcolor: '#1e1e1e', color: '#d4d4d4', overflowX: 'auto', borderRadius: 1 }}>
                    <Typography variant="body2" component="pre" sx={{ m: 0, fontFamily: 'monospace' }}>
{`const axios = require('axios');

const writeData = async () => {
  try {
    const response = await axios.post('${apiUrl}', {
      api_key: '${writeKey}',
${channel.fields.map((f, i) => `      ${f.field_key}: 25.5${i < channel.fields.length - 1 ? ',' : ''}`).join('\n')}
    });
    console.log(response.data);
  } catch (error) {
    console.error(error);
  }
};

writeData();`}
                    </Typography>
                  </Paper>
                </CustomTabPanel>

                <CustomTabPanel value={codeTab} index={3}>
                  <Paper sx={{ p: 2, bgcolor: '#1e1e1e', color: '#d4d4d4', overflowX: 'auto', borderRadius: 1 }}>
                    <Typography variant="body2" component="pre" sx={{ m: 0, fontFamily: 'monospace' }}>
{`#include <WiFi.h>
#include <HTTPClient.h>

const char* ssid = "YOUR_WIFI_SSID";
const char* password = "YOUR_WIFI_PASSWORD";

void setup() {
  Serial.begin(115200);
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
  }
}

void loop() {
  if(WiFi.status() == WL_CONNECTED){
    HTTPClient http;
    http.begin("${apiUrl}");
    http.addHeader("Content-Type", "application/json");

    String payload = "{ \\"api_key\\": \\"${writeKey}\\", "
${channel.fields.map(f => `                     "\\"${f.field_key}\\": 25.5, "`).join('\n')}
                     "}";
                     
    // Note: Remove the trailing comma from the payload string above in actual code.

    int httpResponseCode = http.POST(payload);
    Serial.println(httpResponseCode);
    http.end();
  }
  delay(10000);
}`}
                    </Typography>
                  </Paper>
                </CustomTabPanel>

              </CardContent>
            </Card>
          </Grid>

        </Grid>
      </CustomTabPanel>

      {/* DATA IMPORT / EXPORT TAB */}
      <CustomTabPanel value={mainTab} index={2}>
        <Grid container spacing={3}>
          
          {/* EXPORT PANEL */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ borderRadius: 2, height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <CloudDownload color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Export Data</Typography>
                </Box>
                
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Format</InputLabel>
                  <Select value={exportFormat} onChange={(e) => setExportFormat(e.target.value)} label="Format">
                    <MenuItem value="csv">CSV (Comma Separated Values)</MenuItem>
                    <MenuItem value="excel">Excel (.xlsx)</MenuItem>
                    <MenuItem value="json">JSON Array</MenuItem>
                  </Select>
                </FormControl>

                <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                  <TextField 
                    label="Start Time (Optional)" 
                    type="datetime-local" 
                    fullWidth 
                    slotProps={{ inputLabel: { shrink: true } }}
                    value={exportStart}
                    onChange={(e) => setExportStart(e.target.value)}
                  />
                  <TextField 
                    label="End Time (Optional)" 
                    type="datetime-local" 
                    fullWidth 
                    slotProps={{ inputLabel: { shrink: true } }}
                    value={exportEnd}
                    onChange={(e) => setExportEnd(e.target.value)}
                  />
                </Box>

                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Fields to Export (Default: All)</InputLabel>
                  <Select
                    multiple
                    value={exportFields}
                    onChange={(e) => setExportFields(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                    input={<OutlinedInput label="Fields to Export (Default: All)" />}
                    renderValue={(selected) => selected.join(', ')}
                  >
                    {channel.fields.map((field) => (
                      <MenuItem key={field.field_key} value={field.field_key}>
                        <Checkbox checked={exportFields.indexOf(field.field_key) > -1} />
                        <ListItemText primary={field.name} secondary={field.field_key} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Button 
                  variant="contained" 
                  color="primary" 
                  fullWidth 
                  startIcon={exporting ? <CircularProgress size={20} color="inherit" /> : <CloudDownload />}
                  onClick={handleExport}
                  disabled={exporting}
                >
                  {exporting ? 'Exporting...' : 'Download Export'}
                </Button>
              </CardContent>
            </Card>
          </Grid>

          {/* IMPORT PANEL */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Card sx={{ borderRadius: 2, height: '100%' }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
                  <CloudUpload color="primary" sx={{ mr: 1 }} />
                  <Typography variant="h6">Import Historical Data</Typography>
                </Box>
                
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Format</InputLabel>
                  <Select value={importFormat} onChange={(e) => setImportFormat(e.target.value)} label="Format">
                    <MenuItem value="csv">CSV (Comma Separated Values)</MenuItem>
                    <MenuItem value="excel">Excel (.xlsx)</MenuItem>
                    <MenuItem value="json">JSON Array</MenuItem>
                  </Select>
                </FormControl>

                <Box sx={{ mb: 3 }}>
                  <Button
                    variant="outlined"
                    component="label"
                    fullWidth
                    sx={{ py: 4, borderStyle: 'dashed', borderWidth: 2 }}
                  >
                    {importFile ? importFile.name : 'Select File to Upload'}
                    <input
                      type="file"
                      hidden
                      accept={importFormat === 'csv' ? '.csv' : importFormat === 'excel' ? '.xlsx' : '.json'}
                      onChange={(e) => {
                        if (e.target.files && e.target.files.length > 0) {
                          setImportFile(e.target.files[0]);
                        }
                      }}
                    />
                  </Button>
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1, textAlign: 'center' }}>
                    File must contain a 'created_at' or 'timestamp' column. Data will be overwritten if timestamps match.
                  </Typography>
                </Box>

                <Button 
                  variant="contained" 
                  color="secondary" 
                  fullWidth 
                  startIcon={importing ? <CircularProgress size={20} color="inherit" /> : <CloudUpload />}
                  onClick={handleImport}
                  disabled={importing || !importFile}
                  sx={{ mb: 2 }}
                >
                  {importing ? 'Importing...' : 'Import Data'}
                </Button>

                {importError && (
                  <Alert severity="error" sx={{ mb: 2 }}>{importError}</Alert>
                )}

                {importSummary && (
                  <Alert severity="success" sx={{ mb: 2 }}>
                    Import Complete!
                    <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px' }}>
                      <li><strong>Total Rows:</strong> {importSummary.total}</li>
                      <li><strong>Imported:</strong> {importSummary.imported}</li>
                      <li><strong>Failed/Skipped:</strong> {importSummary.errors}</li>
                    </ul>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </Grid>
          
        </Grid>
      </CustomTabPanel>

      {/* WEBHOOKS TAB */}
      <CustomTabPanel value={mainTab} index={3}>
        <ChannelWebhooksTab channelId={id as string} />
      </CustomTabPanel>

      {/* MATLAB / THINGSPEAK TAB */}
      <CustomTabPanel value={mainTab} index={4}>
        <ChannelThingSpeakTab channel={channel!} />
      </CustomTabPanel>

      {/* ONE-TIME RAW API KEY DISPLAY MODAL */}
      <Dialog open={createdRawKeyModal.open} onClose={() => setCreatedRawKeyModal({ ...createdRawKeyModal, open: false })} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>One-Time API Key Display</DialogTitle>
        <DialogContent dividers>
          <Alert severity="warning" sx={{ mb: 2 }}>
            <strong>Important:</strong> Copy your API key now! For security reasons, this key is hashed with HMAC SHA-256 and will <strong>never</strong> be displayed again after closing this window.
          </Alert>
          <Typography variant="subtitle2" color="textSecondary" sx={{ mb: 1 }}>
            {createdRawKeyModal.name} ({createdRawKeyModal.keyType})
          </Typography>
          <Paper variant="outlined" sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', bgcolor: '#1e1e1e', color: '#61afef' }}>
            <Typography variant="body1" sx={{ fontFamily: 'monospace', wordBreak: 'break-all' }}>
              {createdRawKeyModal.rawKey}
            </Typography>
            <Tooltip title="Copy Key">
              <IconButton onClick={() => copyToClipboard(createdRawKeyModal.rawKey)} sx={{ color: '#fff', ml: 1 }}>
                <ContentCopy />
              </IconButton>
            </Tooltip>
          </Paper>
        </DialogContent>
        <DialogActions>
          <Button variant="contained" onClick={() => setCreatedRawKeyModal({ ...createdRawKeyModal, open: false })}>
            I Have Saved My API Key
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};
