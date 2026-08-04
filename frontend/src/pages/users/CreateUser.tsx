import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { 
  Box, 
  Button, 
  IconButton, 
  TextField, 
  MenuItem, 
  Grid, 
  Paper, 
  Alert,
  Stack,
  FormControlLabel,
  Checkbox,
  Typography,
  Divider
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import SaveIcon from '@mui/icons-material/Save';
import { PageHeader } from '@/components/PageHeader';
import { userApi } from '@/features/users/api/user';
import type { UserCreate } from '@/features/users/types';

export function CreateUser() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<UserCreate>({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    role: 'Viewer',
    password: ''
  });
  
  const [autoGenerate, setAutoGenerate] = useState(true);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    
    try {
      const payload = { ...formData };
      let generatedPassword = null;
      if (autoGenerate) {
        // Generate a valid complex temporary password
        generatedPassword = Math.random().toString(36).slice(-10) + 'A!1';
        payload.password = generatedPassword;
      }
      
      await userApi.create(payload);
      
      if (generatedPassword) {
        alert(`User created successfully!\n\nA welcome email has been dispatched with their temporary password.\n\nFor your records, the temporary password is:\n${generatedPassword}`);
      }
      
      navigate('/users');
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create user');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 800, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2 }}>
        <IconButton onClick={() => navigate('/users')} sx={{ mt: 0.5, ml: -1 }}>
          <ArrowBackIcon />
        </IconButton>
        <Box sx={{ flexGrow: 1 }}>
          <PageHeader 
            title="Create User" 
            description="Add a new user to the platform."
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
                required
                fullWidth
                label="Email Address"
                type="email"
                value={formData.email}
                onChange={e => setFormData({...formData, email: e.target.value})}
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
            <Grid sx={{ width: '100%' }}>
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
          </Grid>

          <Divider sx={{ my: 1 }} />
          
          <Box>
            <Typography variant="h6" gutterBottom>
              Authentication
            </Typography>
            <FormControlLabel
              control={
                <Checkbox 
                  checked={autoGenerate}
                  onChange={e => setAutoGenerate(e.target.checked)}
                  color="primary"
                />
              }
              label="Auto-generate temporary password and send email"
            />
            
            {!autoGenerate && (
              <Box sx={{ mt: 2, maxWidth: { xs: '100%', sm: '50%' } }}>
                <TextField
                  required={!autoGenerate}
                  fullWidth
                  label="Manual Password"
                  type="password"
                  value={formData.password}
                  onChange={e => setFormData({...formData, password: e.target.value})}
                  helperText="Minimum 8 characters"
                />
              </Box>
            )}
          </Box>

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
              disabled={loading}
              startIcon={<SaveIcon />}
            >
              {loading ? 'Creating...' : 'Create User'}
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Box>
  );
}
