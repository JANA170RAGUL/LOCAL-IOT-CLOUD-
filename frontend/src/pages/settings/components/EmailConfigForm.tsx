import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../../../features/settings/api/settings';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Box, Typography, Grid } from '@mui/material';

interface EmailSettingsData {
  smtpHost: string;
  smtpPort: number;
  username?: string;
  password?: string;
  senderName: string;
  senderEmail: string;
}

export default function EmailConfigForm() {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset, getValues } = useForm<EmailSettingsData>();

  const { data, isLoading } = useQuery({
    queryKey: ['settings', 'email'],
    queryFn: () => settingsApi.getCategorySettings('email')
  });

  useEffect(() => {
    if (data) {
      reset({
        smtpHost: data.smtpHost || '',
        smtpPort: data.smtpPort || 587,
        username: data.username || '',
        password: data.password || '',
        senderName: data.senderName || 'LocalIoTCloud',
        senderEmail: data.senderEmail || 'noreply@localiotcloud.com'
      });
    }
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: (settings: EmailSettingsData) => settingsApi.updateCategorySettings('email', { settings }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'email'] });
    }
  });

  const testEmailMutation = useMutation({
    mutationFn: (config: any) => settingsApi.sendTestEmail(config),
    onSuccess: (data) => {
      alert(data.detail || "Test email sent successfully!");
    },
    onError: (error: any) => {
      alert(error.response?.data?.detail || "Failed to send test email.");
    }
  });

  const onSubmit = (formData: EmailSettingsData) => {
    formData.smtpPort = Number(formData.smtpPort);
    mutation.mutate(formData);
  };

  if (isLoading) return <Box sx={{ p: 2 }}><Typography>Loading...</Typography></Box>;

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 'medium' }}>Email Configuration</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Configure SMTP settings for system notifications and alerts.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 8 }}>
          <Input
            label="SMTP Host"
            placeholder="e.g. smtp.gmail.com"
            {...register('smtpHost')}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Input
            label="SMTP Port"
            type="number"
            {...register('smtpPort')}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Input
            label="Username"
            {...register('username')}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Input
            label="Password"
            type="password"
            {...register('password')}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Input
            label="Sender Name"
            placeholder="e.g. LocalIoTCloud System"
            {...register('senderName')}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Input
            label="Sender Email"
            type="email"
            placeholder="e.g. alerts@example.com"
            {...register('senderEmail')}
          />
        </Grid>
      </Grid>

      <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
          type="button"
          variant="outlined"
          onClick={() => {
            const currentValues = getValues();
            if (!currentValues.smtpHost || !currentValues.smtpPort) {
              alert("Please enter SMTP Host and Port first.");
              return;
            }
            const toEmail = window.prompt("Enter an email address to send the test to:", currentValues.senderEmail || "");
            if (toEmail) {
              testEmailMutation.mutate({
                ...currentValues,
                toEmail
              });
            }
          }}
          disabled={testEmailMutation.isPending}
        >
          {testEmailMutation.isPending ? "Sending..." : "Send Test Email"}
        </Button>
        <Button
          type="submit"
          disabled={mutation.isPending}
        >
          {mutation.isPending ? "Saving..." : "Save Configuration"}
        </Button>
      </Box>
    </Box>
  );
}
