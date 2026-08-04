import React, { useState, useEffect } from 'react';
import { 
  Box, Typography, Button, Card, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, IconButton, Chip, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, FormControl, InputLabel, Select, 
  MenuItem, Checkbox, ListItemText, OutlinedInput, Tooltip, CircularProgress
} from '@mui/material';
import { Add, Edit, Delete, PlayArrow, Receipt } from '@mui/icons-material';
import { channelsApi, ChannelWebhook, WebhookLog } from '../api/channels';

interface ChannelWebhooksTabProps {
  channelId: string;
}

const AVAILABLE_EVENTS = ['telemetry.received', 'telemetry.bulk_received', 'test.event'];

export const ChannelWebhooksTab: React.FC<ChannelWebhooksTabProps> = ({ channelId }) => {
  const [webhooks, setWebhooks] = useState<ChannelWebhook[]>([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [openModal, setOpenModal] = useState(false);
  const [editingWebhook, setEditingWebhook] = useState<ChannelWebhook | null>(null);
  const [formData, setFormData] = useState<Partial<ChannelWebhook>>({
    name: '',
    target_url: '',
    webhook_type: 'http',
    trigger_events: ['telemetry.received'],
    max_retries: 3,
    timeout_seconds: 5,
    is_active: true,
  });

  // Logs State
  const [openLogs, setOpenLogs] = useState(false);
  const [selectedLogs, setSelectedLogs] = useState<WebhookLog[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);

  useEffect(() => {
    fetchWebhooks();
  }, [channelId]);

  const fetchWebhooks = async () => {
    try {
      const data = await channelsApi.getWebhooks(channelId);
      setWebhooks(data);
    } catch (e) {
      console.error('Failed to load webhooks', e);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (webhook?: ChannelWebhook) => {
    if (webhook) {
      setEditingWebhook(webhook);
      setFormData(webhook);
    } else {
      setEditingWebhook(null);
      setFormData({
        name: '',
        target_url: '',
        webhook_type: 'http',
        trigger_events: ['telemetry.received'],
        max_retries: 3,
        timeout_seconds: 5,
        is_active: true,
      });
    }
    setOpenModal(true);
  };

  const handleCloseModal = () => setOpenModal(false);

  const handleSave = async () => {
    try {
      if (editingWebhook) {
        await channelsApi.updateWebhook(channelId, editingWebhook.id, formData);
      } else {
        await channelsApi.createWebhook(channelId, formData);
      }
      handleCloseModal();
      fetchWebhooks();
    } catch (e) {
      console.error('Failed to save webhook', e);
      alert('Failed to save webhook');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Delete this webhook?')) return;
    try {
      await channelsApi.deleteWebhook(channelId, id);
      fetchWebhooks();
    } catch (e) {
      console.error('Failed to delete webhook', e);
    }
  };

  const handleTest = async (id: string) => {
    try {
      await channelsApi.testWebhook(channelId, id);
      alert('Test event dispatched in background. Check delivery logs in a moment.');
    } catch (e) {
      console.error('Test failed', e);
      alert('Failed to dispatch test event');
    }
  };

  const handleViewLogs = async (id: string) => {
    setOpenLogs(true);
    setLogsLoading(true);
    try {
      const logs = await channelsApi.getWebhookLogs(channelId, id);
      setSelectedLogs(logs);
    } catch (e) {
      console.error('Failed to load logs', e);
    } finally {
      setLogsLoading(false);
    }
  };

  if (loading) return <CircularProgress />;

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6">Event Webhooks</Typography>
        <Button variant="contained" startIcon={<Add />} onClick={() => handleOpenModal()}>
          Add Webhook
        </Button>
      </Box>

      <Card sx={{ borderRadius: 2 }}>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Type</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Events</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {webhooks.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">No webhooks configured.</TableCell>
                </TableRow>
              ) : (
                webhooks.map((wh) => (
                  <TableRow key={wh.id}>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{wh.name}</Typography>
                      <Typography variant="caption" color="textSecondary">{wh.target_url}</Typography>
                    </TableCell>
                    <TableCell><Chip size="small" label={wh.webhook_type.toUpperCase()} /></TableCell>
                    <TableCell>
                      <Chip size="small" label={wh.is_active ? 'Active' : 'Disabled'} color={wh.is_active ? 'success' : 'default'} />
                    </TableCell>
                    <TableCell>{wh.trigger_events.length} event(s)</TableCell>
                    <TableCell align="right">
                      <Tooltip title="Test Webhook">
                        <IconButton size="small" color="primary" onClick={() => handleTest(wh.id)}><PlayArrow /></IconButton>
                      </Tooltip>
                      <Tooltip title="Delivery Logs">
                        <IconButton size="small" onClick={() => handleViewLogs(wh.id)}><Receipt /></IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => handleOpenModal(wh)}><Edit /></IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" color="error" onClick={() => handleDelete(wh.id)}><Delete /></IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {/* CREATE/EDIT MODAL */}
      <Dialog open={openModal} onClose={handleCloseModal} maxWidth="md" fullWidth>
        <DialogTitle>{editingWebhook ? 'Edit Webhook' : 'New Webhook'}</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField 
              label="Webhook Name" 
              value={formData.name || ''} 
              onChange={(e) => setFormData({...formData, name: e.target.value})} 
              fullWidth 
            />
            <TextField 
              label="Target URL" 
              value={formData.target_url || ''} 
              onChange={(e) => setFormData({...formData, target_url: e.target.value})} 
              fullWidth 
              placeholder="https://example.com/api/webhook"
            />
            
            <FormControl fullWidth>
              <InputLabel>Webhook Type</InputLabel>
              <Select
                value={formData.webhook_type || 'http'}
                onChange={(e) => setFormData({...formData, webhook_type: e.target.value as any})}
                label="Webhook Type"
              >
                <MenuItem value="http">Standard HTTP POST</MenuItem>
                <MenuItem value="slack">Slack Incoming Webhook</MenuItem>
                <MenuItem value="discord">Discord Webhook</MenuItem>
                <MenuItem value="teams">MS Teams Webhook</MenuItem>
              </Select>
            </FormControl>

            <FormControl fullWidth>
              <InputLabel>Trigger Events</InputLabel>
              <Select
                multiple
                value={formData.trigger_events || []}
                onChange={(e) => setFormData({...formData, trigger_events: typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value})}
                input={<OutlinedInput label="Trigger Events" />}
                renderValue={(selected) => selected.join(', ')}
              >
                {AVAILABLE_EVENTS.map((evt) => (
                  <MenuItem key={evt} value={evt}>
                    <Checkbox checked={(formData.trigger_events || []).indexOf(evt) > -1} />
                    <ListItemText primary={evt} />
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField 
              label="Custom Auth Header Name (Optional)" 
              value={formData.auth_header || ''} 
              onChange={(e) => setFormData({...formData, auth_header: e.target.value})} 
              fullWidth 
              placeholder="e.g. Authorization or X-API-Key"
            />
            <TextField 
              label="Secret Token (Optional)" 
              value={formData.secret_token || ''} 
              onChange={(e) => setFormData({...formData, secret_token: e.target.value})} 
              fullWidth 
              type="password"
            />

            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField 
                label="Max Retries" 
                type="number" 
                value={formData.max_retries ?? 3} 
                onChange={(e) => setFormData({...formData, max_retries: parseInt(e.target.value)})} 
                fullWidth 
              />
              <TextField 
                label="Timeout (seconds)" 
                type="number" 
                value={formData.timeout_seconds ?? 5} 
                onChange={(e) => setFormData({...formData, timeout_seconds: parseInt(e.target.value)})} 
                fullWidth 
              />
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseModal}>Cancel</Button>
          <Button variant="contained" onClick={handleSave}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* LOGS MODAL */}
      <Dialog open={openLogs} onClose={() => setOpenLogs(false)} maxWidth="lg" fullWidth>
        <DialogTitle>Delivery History</DialogTitle>
        <DialogContent dividers>
          {logsLoading ? <CircularProgress /> : (
            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Event</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Time (ms)</TableCell>
                    <TableCell>Retries</TableCell>
                    <TableCell>Response</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedLogs.length === 0 ? (
                    <TableRow><TableCell colSpan={6}>No logs found.</TableCell></TableRow>
                  ) : (
                    selectedLogs.map(log => (
                      <TableRow key={log.id}>
                        <TableCell>{new Date(log.created_at).toLocaleString()}</TableCell>
                        <TableCell>{log.event_type}</TableCell>
                        <TableCell>
                          <Chip 
                            size="small" 
                            label={log.http_status || 'ERROR'} 
                            color={log.success ? 'success' : 'error'} 
                          />
                        </TableCell>
                        <TableCell>{log.response_time_ms}</TableCell>
                        <TableCell>{log.retry_count}</TableCell>
                        <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          <Tooltip title={log.response_body || ''}>
                            <span>{log.response_body || 'N/A'}</span>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenLogs(false)}>Close</Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
};
