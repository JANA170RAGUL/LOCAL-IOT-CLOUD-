import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { 
  Box, 
  Typography, 
  Button, 
  IconButton, 
  Card, 
  CardContent, 
  Avatar, 
  Chip, 
  Grid,
  Paper,
  Stack,
  CircularProgress
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import PersonIcon from '@mui/icons-material/Person';
import SecurityIcon from '@mui/icons-material/Security';
import BusinessIcon from '@mui/icons-material/Business';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import EditIcon from '@mui/icons-material/Edit';
import { PageHeader } from '@/components/PageHeader';
import { userApi } from '@/features/users/api/user';
import type { User } from '@/features/users/types';
import { useAuthStore } from '@/features/auth/store/useAuthStore';

export function UserDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user: currentUser } = useAuthStore();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      userApi.get(id)
        .then(setUser)
        .catch(err => setError(err.response?.data?.detail || 'Failed to load user'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const canManageUsers = currentUser?.role === 'Super Admin' || currentUser?.role === 'Org Admin' || currentUser?.role === 'Admin';

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error || !user) {
    return (
      <Box sx={{ p: 8, color: 'error.main' }}>
        <Typography>{error || 'User not found'}</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 1000, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
        <IconButton onClick={() => navigate('/users')} sx={{ mt: 0.5, ml: -1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <PageHeader 
            title="User Profile" 
            description="View details and recent activity."
            actionLabel={canManageUsers ? "Edit Profile" : undefined}
            actionIcon={<EditIcon />}
            onAction={canManageUsers ? () => navigate(`/users/${user.id}/edit`) : undefined}
          />
        </Box>
      </Box>

      <Grid container spacing={3}>
        {/* Left Column: Profile Card */}
        <Grid sx={{ width: { xs: '100%', md: '33.333333%' } }}>
          <Stack spacing={3}>
            <Card variant="outlined">
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', p: 3 }}>
                <Avatar 
                  sx={{ 
                    width: 96, 
                    height: 96, 
                    mb: 2, 
                    bgcolor: 'primary.main',
                    fontSize: '2.5rem',
                    fontWeight: 'bold'
                  }}
                >
                  {user.first_name[0]}{user.last_name[0]}
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {user.first_name} {user.last_name}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {user.email}
                </Typography>
                
                <Stack direction="row" spacing={1} useFlexGap sx={{ mb: 1, justifyContent: 'center', flexWrap: 'wrap' }}>
                  <Chip 
                    icon={<SecurityIcon fontSize="small" />} 
                    label={user.role} 
                    size="small" 
                    variant="outlined"
                  />
                  <Chip 
                    label={user.status} 
                    size="small"
                    color={user.status === 'ACTIVE' ? 'success' : 'error'}
                    variant="outlined"
                  />
                </Stack>
              </CardContent>
            </Card>
            
            <Card variant="outlined">
              <CardContent sx={{ p: 3 }}>
                <Typography variant="overline" sx={{ display: 'block', mb: 2, fontWeight: 'bold' }}>
                  Contact Info
                </Typography>
                <Stack spacing={2}>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <PersonIcon color="action" sx={{ mr: 2, fontSize: 20 }} />
                    <Typography variant="body2">{user.phone || 'No phone provided'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <BusinessIcon color="action" sx={{ mr: 2, fontSize: 20 }} />
                    <Typography variant="body2">{user.tenant_id ? 'Assigned to Tenant' : 'Platform Level'}</Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center' }}>
                    <AccessTimeIcon color="action" sx={{ mr: 2, fontSize: 20 }} />
                    <Typography variant="body2">Joined {new Date(user.created_at).toLocaleDateString()}</Typography>
                  </Box>
                </Stack>
              </CardContent>
            </Card>
          </Stack>
        </Grid>

        {/* Right Column: Activity / History */}
        <Grid sx={{ width: { xs: '100%', md: '66.666667%' } }}>
          <Card variant="outlined" sx={{ height: '100%' }}>
            <Box sx={{ px: 3, py: 2, borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h6">Login History</Typography>
              <Typography variant="body2" color="text.secondary">Recent authentication events for this user.</Typography>
            </Box>
            <CardContent sx={{ p: 3 }}>
              {/* Placeholder login history */}
              <Stack spacing={3}>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Box sx={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center', 
                    width: 40, 
                    height: 40, 
                    borderRadius: '50%', 
                    bgcolor: 'primary.light',
                    color: 'primary.main',
                    flexShrink: 0
                  }}>
                    <AccessTimeIcon fontSize="small" />
                  </Box>
                  <Paper variant="outlined" sx={{ p: 2, flexGrow: 1, bgcolor: 'background.default' }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.5, flexWrap: 'wrap' }}>
                      <Typography variant="subtitle2" sx={{ fontWeight: 'bold' }}>Successful Login</Typography>
                      <Typography variant="caption" color="text.secondary">
                        {user.last_login ? new Date(user.last_login).toLocaleString() : 'Just now'}
                      </Typography>
                    </Box>
                    <Typography variant="body2" color="text.secondary">IP: 192.168.1.1 (Windows)</Typography>
                  </Paper>
                </Box>
              </Stack>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
