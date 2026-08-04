import React, { useRef, useState } from 'react';
import { Box, Typography, Card, Chip, Button, CircularProgress, Divider, List, ListItem, ListItemText, Alert, IconButton, Snackbar } from '@mui/material';
import { ShieldCheckIcon, IdentificationIcon, KeyIcon, CloudUploadIcon, DuplicateIcon } from '@heroicons/react/outline';
import { useLicenseStatus, useUploadLicense } from '../../../features/settings/api/license';
import { format } from 'date-fns';

export default function LicenseDashboard() {
  const { data: license, isLoading, isError, refetch } = useLicenseStatus();
  const uploadMutation = useUploadLicense();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');

  if (isLoading) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>;
  if (isError || !license) return <Alert severity="error">Failed to load license status</Alert>;

  const isActive = license.status === 'ACTIVE';
  const statusColor = isActive ? 'success' : 'error';

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      try {
        await uploadMutation.mutateAsync(file);
        setSnackbarMessage('License uploaded successfully');
        setSnackbarOpen(true);
        refetch();
      } catch (err: any) {
        setSnackbarMessage(err.response?.data?.detail || 'Failed to upload license');
        setSnackbarOpen(true);
      }
    }
  };

  const handleCopyFingerprint = () => {
    navigator.clipboard.writeText(license.current_fingerprint);
    setSnackbarMessage('Fingerprint copied to clipboard');
    setSnackbarOpen(true);
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      {/* Overview Section */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
          <ShieldCheckIcon style={{ width: 24, height: 24, marginRight: 8 }} />
          License Overview
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(4, 1fr)' }, gap: 2 }}>
          <Card sx={{ p: 2, height: '100%' }}>
            <Typography variant="caption" color="text.secondary">Status</Typography>
            <Box sx={{ mt: 1 }}>
              <Chip label={license.status} color={statusColor} sx={{ fontWeight: 'bold' }} />
            </Box>
          </Card>
          <Card sx={{ p: 2, height: '100%' }}>
            <Typography variant="caption" color="text.secondary">Customer</Typography>
            <Typography variant="body1" sx={{ mt: 1, fontWeight: 'medium' }}>
              {license.customer || 'Unregistered'}
            </Typography>
          </Card>
          <Card sx={{ p: 2, height: '100%' }}>
            <Typography variant="caption" color="text.secondary">Plan</Typography>
            <Typography variant="body1" sx={{ mt: 1, fontWeight: 'medium' }}>
              {license.plan || 'N/A'}
            </Typography>
          </Card>
          <Card sx={{ p: 2, height: '100%' }}>
            <Typography variant="caption" color="text.secondary">Time Remaining</Typography>
            <Typography variant="body1" sx={{ mt: 1, fontWeight: 'medium', color: license.expires_in_days < 30 ? 'error.main' : 'inherit' }}>
              {license.expires_in_days >= 0 ? `${license.expires_in_days} Days` : 'Expired'}
            </Typography>
          </Card>
        </Box>
      </Box>

      <Divider />

      {/* Machine Information */}
      <Box>
        <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
          <IdentificationIcon style={{ width: 24, height: 24, marginRight: 8 }} />
          Machine Information
        </Typography>
        <Card sx={{ p: 3 }}>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
            <Box>
              <Typography variant="body2" color="text.secondary">Machine Fingerprint</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1, bgcolor: '#f5f5f5', p: 1.5, borderRadius: 1 }}>
                <Typography variant="body2" sx={{ fontFamily: 'monospace', flexGrow: 1, wordBreak: 'break-all' }}>
                  {license.current_fingerprint}
                </Typography>
                <IconButton size="small" onClick={handleCopyFingerprint}>
                  <DuplicateIcon style={{ width: 18, height: 18 }} />
                </IconButton>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Provide this exact fingerprint to your vendor to generate a valid license key for this server.
              </Typography>
            </Box>
            <Box>
              <Box sx={{ mb: 2 }}>
                <Typography variant="body2" color="text.secondary">Activation Status</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'medium', display: 'flex', alignItems: 'center', mt: 0.5 }}>
                  <span style={{ 
                    width: 8, height: 8, borderRadius: '50%', marginRight: 8, 
                    backgroundColor: license.machine_match ? '#4caf50' : '#f44336' 
                  }}></span>
                  {license.machine_match ? 'Fingerprint Matched' : 'Fingerprint Mismatch'}
                </Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="text.secondary">Activation Date</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'medium', mt: 0.5 }}>
                  {license.activated_at ? format(new Date(license.activated_at), 'PPP') : 'N/A'}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Card>
      </Box>

      <Divider />

      {/* Feature Matrix & Upload */}
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
        <Box>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
            <KeyIcon style={{ width: 24, height: 24, marginRight: 8 }} />
            Feature Matrix
          </Typography>
          <Card sx={{ p: 0 }}>
            {license.features && Object.keys(license.features).length > 0 ? (
              <List disablePadding>
                {Object.entries(license.features).map(([key, value], idx, arr) => (
                  <React.Fragment key={key}>
                    <ListItem sx={{ py: 1.5 }}>
                      <ListItemText 
                        primary={
                          <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                            {key}
                          </Typography>
                        } 
                      />
                      <Typography variant="body2" sx={{ 
                        color: value === true ? 'success.main' : value === false ? 'error.main' : 'primary.main',
                        fontWeight: 'bold'
                      }}>
                        {value === true ? 'Enabled' : value === false ? 'Disabled' : value.toString()}
                      </Typography>
                    </ListItem>
                    {idx < arr.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            ) : (
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body2" color="text.secondary">No features loaded.</Typography>
              </Box>
            )}
          </Card>
        </Box>

        <Box>
          <Typography variant="h6" sx={{ mb: 2, display: 'flex', alignItems: 'center', fontWeight: 'bold' }}>
            <CloudUploadIcon style={{ width: 24, height: 24, marginRight: 8 }} />
            License Upload
          </Typography>
          <Card sx={{ p: 3, textAlign: 'center', border: '2px dashed #ccc', bgcolor: '#fafafa', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 200 }}>
            <CloudUploadIcon style={{ width: 48, height: 48, color: '#9e9e9e', marginBottom: 16 }} />
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Upload a new `.lic` file to activate or upgrade your platform.
            </Typography>
            <input
              type="file"
              accept=".lic"
              ref={fileInputRef}
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleUploadClick}
              disabled={uploadMutation.isPending}
            >
              {uploadMutation.isPending ? 'Uploading...' : 'Browse License File'}
            </Button>
          </Card>
        </Box>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
}
