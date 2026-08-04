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
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>
          Notification Preferences
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
          Manage how you receive alerts and communications.
        </Typography>

        <FormGroup>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <FormControlLabel
              control={
                <Switch
                  checked={emailPref?.is_enabled ?? true}
                  onChange={handleEmailToggle}
                  disabled={mutation.isPending}
                />
              }
              label="Email Notifications"
            />
            {mutation.isPending && <CircularProgress size={16} sx={{ ml: 2 }} />}
          </Box>
        </FormGroup>
      </CardContent>
    </Card>
  );
};
