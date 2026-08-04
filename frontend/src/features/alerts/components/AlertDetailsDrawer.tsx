import React, { useState } from 'react';
import {
  Drawer,
  Box,
  Typography,
  IconButton,
  Divider,
  Button,
  Grid,
  TextField,
} from '@mui/material';
import { Close as CloseIcon, CheckCircle as ResolveIcon, Engineering as AcknowledgeIcon } from '@mui/icons-material';
import { format } from 'date-fns';
import { SeverityChip } from './SeverityChip';
import { AlertStatusChip } from './AlertStatusChip';
import type { BackendAlert } from '../types';

export interface AlertDetailsDrawerProps {
  alert: BackendAlert | null;
  open: boolean;
  onClose: () => void;
  onAcknowledge: (alertId: string, operatorName: string) => void;
  onResolve: (alertId: string) => void;
}

export const AlertDetailsDrawer: React.FC<AlertDetailsDrawerProps> = ({
  alert,
  open,
  onClose,
  onAcknowledge,
  onResolve,
}) => {
  const [operatorName, setOperatorName] = useState('System Operator');

  if (!alert) return null;

  const canAcknowledge = alert.status === 'OPEN';
  const canResolve = alert.status === 'OPEN' || alert.status === 'ACKNOWLEDGED';

  return (
    <Drawer anchor="right" open={open} onClose={onClose} sx={{ '& .MuiDrawer-paper': { width: 450 } }}>
      <Box sx={{ p: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h6">Alert Details</Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      
      <Box sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', gap: 1, mb: 3 }}>
          <SeverityChip severity={alert.severity} />
          <AlertStatusChip status={alert.status} />
        </Box>

        <Typography variant="h5" sx={{ mb: 1 }}>{alert.title}</Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
          {alert.message}
        </Typography>

        <Grid container spacing={3} sx={{ mb: 4 }}>
          <Grid size={6}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Created At</Typography>
            <Typography variant="body2">{format(new Date(alert.created_at), 'MMM d, yyyy HH:mm:ss')}</Typography>
          </Grid>
          <Grid size={6}>
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Updated At</Typography>
            <Typography variant="body2">{format(new Date(alert.updated_at), 'MMM d, yyyy HH:mm:ss')}</Typography>
          </Grid>
          
          {alert.acknowledged_at && (
            <Grid size={6}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Acknowledged At</Typography>
              <Typography variant="body2">{format(new Date(alert.acknowledged_at), 'MMM d, yyyy HH:mm:ss')}</Typography>
            </Grid>
          )}
          {alert.acknowledged_by && (
            <Grid size={6}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Acknowledged By</Typography>
              <Typography variant="body2">{alert.acknowledged_by}</Typography>
            </Grid>
          )}

          {alert.resolved_at && (
            <Grid size={6}>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>Resolved At</Typography>
              <Typography variant="body2">{format(new Date(alert.resolved_at), 'MMM d, yyyy HH:mm:ss')}</Typography>
            </Grid>
          )}
        </Grid>

        {alert.metadata && Object.keys(alert.metadata).length > 0 && (
          <Box sx={{ mb: 4 }}>
            <Typography variant="subtitle2" sx={{ mb: 1 }}>Metadata</Typography>
            <Box sx={{ p: 2, bgcolor: 'background.default', borderRadius: 1, overflowX: 'auto' }}>
              <pre style={{ margin: 0, fontSize: '0.8rem' }}>
                {JSON.stringify(alert.metadata, null, 2)}
              </pre>
            </Box>
          </Box>
        )}

        <Divider sx={{ mb: 3 }} />

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {canAcknowledge && (
            <Box sx={{ display: 'flex', gap: 2 }}>
              <TextField
                size="small"
                label="Operator Name"
                value={operatorName}
                onChange={(e) => setOperatorName(e.target.value)}
                fullWidth
              />
              <Button
                variant="contained"
                color="warning"
                startIcon={<AcknowledgeIcon />}
                onClick={() => onAcknowledge(alert.id, operatorName)}
                disabled={!operatorName.trim()}
              >
                Acknowledge
              </Button>
            </Box>
          )}

          {canResolve && (
            <Button
              variant="contained"
              color="success"
              startIcon={<ResolveIcon />}
              onClick={() => onResolve(alert.id)}
              fullWidth
            >
              Mark as Resolved
            </Button>
          )}
        </Box>
      </Box>
    </Drawer>
  );
};
