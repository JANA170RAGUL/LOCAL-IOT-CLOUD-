import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router';
import { 
  Box, 
  Button, 
  IconButton, 
  TextField, 
  MenuItem, 
  Grid, 
  Paper, 
  CircularProgress,
  Alert,
  Stack
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import { PageHeader } from '@/components/PageHeader';
import { userApi } from '@/features/users/api/user';
import type { UserUpdate } from '@/features/users/types';

export function EditUser() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<UserUpdate>({
    first_name: '',
    last_name: '',
    phone: '',
    role: '',
    status: ''
  });
  const [email, setEmail] = useState('');

  useEffect(() => {
    if (id) {
      userApi.get(id)
        .then(user => {
          setFormData({
            first_name: user.first_name,
            last_name: user.last_name,
            phone: user.phone || '',
            role: user.role,
            status: user.status
          });
          setEmail(user.email);
        })
        .catch(err => setError(err.response?.data?.detail || 'Failed to load user'))
        .finally(() => setLoading(false));
    }
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    
    setError(null);
    setSaving(true);
    
    try {
      await userApi.update(id, formData);
      navigate('/users');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 8 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
        <IconButton onClick={() => navigate('/users')} sx={{ mt: 0.5, ml: -1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <PageHeader 
            title="Edit User" 
            description={`Updating details for ${email}`}
          />
        </Box>
      </Box>

      <Paper 
        component="form" 
        onSubmit={handleSubmit} 
        variant="outlined" 
        sx={{ p: 4 }}
      >
        <Stack spacing={4}>
          {error && (
            <Alert severity="error">
              {error}
            </Alert>
          )}

          <Grid container spacing={3}>
            <Grid sx={{ width: { xs: '100%', sm: '50%' } }}>
              <TextField
                required
                fullWidth
                label="First Name"
                value={formData.first_name}
                onChange={e => setFormData({...formData, first_name: e.target.value})}
              />
            </Grid>
            <Grid sx={{ width: { xs: '100%', sm: '50%' } }}>
              <TextField
                required
                fullWidth
                label="Last Name"
                value={formData.last_name}
                onChange={e => setFormData({...formData, last_name: e.target.value})}
              />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid sx={{ width: { xs: '100%', sm: '50%' } }}>
              <TextField
                fullWidth
                label="Email Address (Read-Only)"
                type="email"
                value={email}
                disabled
              />
            </Grid>
            <Grid sx={{ width: { xs: '100%', sm: '50%' } }}>
              <TextField
                fullWidth
                label="Phone Number (Optional)"
                type="tel"
                value={formData.phone}
                onChange={e => setFormData({...formData, phone: e.target.value})}
              />
            </Grid>
          </Grid>

          <Grid container spacing={3}>
            <Grid sx={{ width: { xs: '100%', sm: '50%' } }}>
              <TextField
                select
                fullWidth
                label="Role"
                value={formData.role}
                onChange={e => setFormData({...formData, role: e.target.value})}
              >
                <MenuItem value="Super Admin">Super Admin</MenuItem>
                <MenuItem value="Org Admin">Org Admin</MenuItem>
                <MenuItem value="Operator">Operator</MenuItem>
                <MenuItem value="Viewer">Viewer</MenuItem>
                <MenuItem value="Developer">Developer</MenuItem>
              </TextField>
            </Grid>
            <Grid sx={{ width: { xs: '100%', sm: '50%' } }}>
              <TextField
                select
                fullWidth
                label="Status"
                value={formData.status}
                onChange={e => setFormData({...formData, status: e.target.value})}
              >
                <MenuItem value="ACTIVE">Active</MenuItem>
                <MenuItem value="INACTIVE">Inactive</MenuItem>
              </TextField>
            </Grid>
          </Grid>

          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, pt: 2 }}>
            <Button
              type="button"
              onClick={() => navigate('/users')}
              color="inherit"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              disabled={saving}
              startIcon={<SaveIcon />}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}
