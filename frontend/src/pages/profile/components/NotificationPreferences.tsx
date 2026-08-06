import React from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Card,
  CardContent,
  Typography,
  Switch,
  FormControlLabel,
  FormGroup,
  Alert,
  CircularProgress,
  Box
} from '@mui/material';
import { notificationApi } from '../../../features/notifications/api/notifications';

export const NotificationPreferences: React.FC = () => {
  const queryClient = useQueryClient();

  const { data: preferences, isLoading, error } = useQuery({
    queryKey: ['notificationPreferences'],
    queryFn: notificationApi.getPreferences
  });

  const mutation = useMutation({
    mutationFn: notificationApi.updatePreference,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notificationPreferences'] });
    }
  });

  if (isLoading) {
    return <CircularProgress size={24} />;
  }

  if (error) {
    return <Alert severity="error">Failed to load preferences</Alert>;
  }

  const emailPref = preferences?.find(p => p.channel === 'EMAIL');

  const handleEmailToggle = (event: React.ChangeEvent<HTMLInputElement>) => {
    mutation.mutate({
      channel: 'EMAIL',
      is_enabled: event.target.checked
    });
  };

  return (
    <Card variant="outlined" sx={{ borderRadius: '12px', boxShadow: 'none' }}>
      <CardContent sx={{ p: 3, '&:last-child': { pb: 3 } }}>
        <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, fontSize: '1.125rem' }}>
          Notification Preferences
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Manage how you receive alerts and communications.
        </Typography>

        <FormGroup>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <FormControlLabel
              control={
                <Switch
                  checked={emailPref?.is_enabled ?? true}
                  onChange={handleEmailToggle}
                  disabled={mutation.isPending}
                  color="primary"
                />
              }
              label={
                <Typography variant="body2" sx={{ fontWeight: 500 }}>
                  Email Notifications
                </Typography>
              }
            />
            {mutation.isPending && <CircularProgress size={16} sx={{ ml: 2 }} />}
          </Box>
        </FormGroup>
      </CardContent>
    </Card>
  );
};
