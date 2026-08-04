import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Card, CardContent, CircularProgress, Grid, Paper, AppBar, Toolbar 
} from '@mui/material';
import { CloudQueue, Public } from '@mui/icons-material';
import { useParams } from 'react-router';
import { channelsApi, ChannelFeed } from '../../features/channels/api/channels';
import { LineChart, Line, XAxis, YAxis, Tooltip as RechartsTooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

export const PublicChannelView: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [channel, setChannel] = useState<any>(null);
  const [feeds, setFeeds] = useState<ChannelFeed[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      channelsApi.getPublicChannel(id)
        .then(setChannel)
        .catch(() => setError('Channel not found or is not public.'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  useEffect(() => {
    if (id && !error) {
      const fetchFeeds = () => {
        channelsApi.getPublicChannelFeeds(id, 50)
          .then(res => setFeeds(res.feeds.reverse())) // Reverse for charting
          .catch(console.error);
      };
      fetchFeeds();
      const interval = setInterval(fetchFeeds, 10000); // 10s refresh
      return () => clearInterval(interval);
    }
  }, [id, error]);

  if (loading) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !channel) {
    return (
      <Box sx={{ height: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center', flexDirection: 'column' }}>
        <Public sx={{ fontSize: 60, color: 'text.secondary', mb: 2 }} />
        <Typography variant="h5" color="textSecondary">{error || 'Channel not found'}</Typography>
      </Box>
    );
  }

  const lastFeed = feeds.length > 0 ? feeds[feeds.length - 1] : null;

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default' }}>
      <AppBar position="static" color="transparent" elevation={0} sx={{ borderBottom: 1, borderColor: 'divider', bgcolor: 'background.paper' }}>
        <Toolbar>
          <CloudQueue sx={{ mr: 2, color: 'primary.main' }} />
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            Local IoT Cloud
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Public fontSize="small" color="success" />
            <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>
              Public Read-Only View
            </Typography>
          </Box>
        </Toolbar>
      </AppBar>

      <Box sx={{ maxWidth: 1200, margin: '0 auto', p: 3 }}>
        <Box sx={{ mb: 4, textAlign: 'center' }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>{channel.name}</Typography>
          <Typography variant="subtitle1" color="textSecondary">{channel.description}</Typography>
        </Box>

        <Grid container spacing={3}>
          {channel.fields.map((field: any) => {
            const currentVal = lastFeed ? lastFeed[field.field_key] : null;
            return (
              <Grid size={{ xs: 12, md: 6, lg: 4 }} key={field.field_key}>
                <Card sx={{ borderRadius: 2, height: '100%', display: 'flex', flexDirection: 'column', boxShadow: 3 }}>
                  <CardContent sx={{ flexGrow: 1 }}>
                    <Typography variant="subtitle2" color="textSecondary" sx={{ textTransform: 'uppercase', letterSpacing: 1 }}>
                      {field.name}
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'baseline', mt: 1, mb: 2 }}>
                      <Typography variant="h2" sx={{ fontWeight: 'bold' }}>
                        {currentVal !== null && currentVal !== undefined ? currentVal : '--'}
                      </Typography>
                      {field.unit && <Typography variant="h6" color="textSecondary" sx={{ ml: 1 }}>{field.unit}</Typography>}
                    </Box>
                    <Box sx={{ height: 180, width: '100%' }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={feeds}>
                          <XAxis dataKey="created_at" tickFormatter={(t) => format(new Date(t), 'HH:mm:ss')} hide />
                          <YAxis domain={['auto', 'auto']} hide />
                          <RechartsTooltip labelFormatter={(l) => format(new Date(l), 'PPpp')} />
                          <Line type="monotone" dataKey={field.field_key} stroke="#0f4c81" strokeWidth={3} dot={false} animationDuration={300} />
                        </LineChart>
                      </ResponsiveContainer>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
          {channel.fields.length === 0 && (
            <Grid size={{ xs: 12 }}>
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography color="textSecondary">No data fields configured for this channel.</Typography>
              </Paper>
            </Grid>
          )}
        </Grid>
      </Box>
    </Box>
  );
};
