import React, { useEffect, useState } from 'react';
import { 
  Box, Typography, Button, Card, CardContent, CardActions, 
  Chip, CircularProgress, Grid 
} from '@mui/material';
import { Add as AddIcon, Public, Lock, Business } from '@mui/icons-material';
import { useNavigate } from 'react-router';
import { channelsApi, Channel } from '../api/channels';

export const ChannelList: React.FC = () => {
  const [channels, setChannels] = useState<Channel[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchChannels = async () => {
      try {
        const data = await channelsApi.getChannels();
        setChannels(data);
      } catch (error) {
        console.error("Failed to fetch channels", error);
      } finally {
        setLoading(false);
      }
    };
    fetchChannels();
  }, []);

  if (loading) return <Box sx={{ p: 3, display: 'flex', justifyContent: 'center' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>Channels</Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={() => navigate('/channels/new')}
        >
          New Channel
        </Button>
      </Box>

      {channels.length === 0 ? (
        <Card sx={{ p: 4, textAlign: 'center', borderRadius: 2 }}>
          <Typography color="textSecondary" sx={{ mb: 2 }}>You haven't created any channels yet.</Typography>
          <Button variant="outlined" onClick={() => navigate('/channels/new')}>Create your first Channel</Button>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {channels.map((channel) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={channel.id}>
              <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', borderRadius: 2 }}>
                <CardContent sx={{ flexGrow: 1 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box>
                      <Typography variant="h6" sx={{ fontWeight: 'bold' }}>{channel.name}</Typography>
                      {channel.visibility === 'public' && <Chip size="small" icon={<Public fontSize="small"/>} label="Public" color="success" variant="outlined" sx={{ mt: 0.5 }}/>}
                      {channel.visibility === 'private' && <Chip size="small" icon={<Lock fontSize="small"/>} label="Private" color="default" variant="outlined" sx={{ mt: 0.5 }}/>}
                      {channel.visibility === 'enterprise' && <Chip size="small" icon={<Business fontSize="small"/>} label="Enterprise" color="primary" variant="outlined" sx={{ mt: 0.5 }}/>}
                    </Box>
                  </Box>
                  <Typography variant="body2" color="textSecondary" sx={{ mb: 2, height: 40, overflow: 'hidden' }}>
                    {channel.description || 'No description provided.'}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {channel.fields.length} Fields Configured
                  </Typography>
                </CardContent>
                <CardActions>
                  <Button size="small" onClick={() => navigate(`/channels/${channel.id}`)}>
                    View Details
                  </Button>
                </CardActions>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}
    </Box>
  );
};
