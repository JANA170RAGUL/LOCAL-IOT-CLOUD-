import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
  CircularProgress,
  Alert
} from '@mui/material';
import { commandsApi } from '../../../../features/commands/api/commands';
import { useAuthStore } from '../../../../features/auth/store/useAuthStore';
import { useSnackbar } from 'notistack';

interface CommandConfirmationDialogProps {
  open: boolean;
  deviceId: string;
  commandName: string;
  commandPayload: any;
  onClose: () => void;
  onSuccess: () => void;
}

export const CommandConfirmationDialog: React.FC<CommandConfirmationDialogProps> = ({
  open,
  deviceId,
  commandName,
  commandPayload,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuthStore();
  const { enqueueSnackbar } = useSnackbar();

  const handleConfirm = async () => {
    if (user?.role === 'viewer') {
      setError('You do not have permission to execute commands.');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Issue command
      await commandsApi.issueCommand(deviceId, {
        command_type: commandName,
        payload: commandPayload
      });
      
      enqueueSnackbar(`Command ${commandName} sent to device!`, { variant: 'success' });
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.response?.data?.detail || err.message || 'Failed to send command');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
      <DialogTitle>Confirm Action</DialogTitle>
      <DialogContent dividers>
        <Typography variant="body1" gutterBottom>
          Are you sure you want to execute <strong>{commandName}</strong> on this device?
        </Typography>
        
        {user?.role === 'viewer' && (
          <Alert severity="warning" sx={{ mt: 2 }}>
            Your current role ({user.role}) does not allow device control.
          </Alert>
        )}

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleClose} disabled={loading} color="inherit">
          Cancel
        </Button>
        <Button 
          onClick={handleConfirm} 
          disabled={loading || user?.role === 'viewer'} 
          variant="contained" 
          color="primary"
          startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
        >
          {loading ? 'Sending...' : 'Confirm'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
