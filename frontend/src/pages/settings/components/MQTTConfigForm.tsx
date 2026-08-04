import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../../../features/settings/api/settings';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Box, Typography, Grid, FormControlLabel, Checkbox } from '@mui/material';

interface MQTTSettingsData {
  host: string;
  port: number;
  username?: string;
  password?: string;
  tls: boolean;
  defaultTopic: string;
}

export default function MQTTConfigForm() {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm<MQTTSettingsData>();

  const { data, isLoading } = useQuery({
    queryKey: ['settings', 'mqtt'],
    queryFn: () => settingsApi.getCategorySettings('mqtt')
  });

  useEffect(() => {
    if (data) {
      reset({
        host: data.host || 'localhost',
        port: data.port || 1883,
        username: data.username || '',
        password: data.password || '',
        tls: data.tls || false,
        defaultTopic: data.defaultTopic || 'telemetry/#'
      });
    }
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: (settings: MQTTSettingsData) => settingsApi.updateCategorySettings('mqtt', { settings }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'mqtt'] });
    }
  });

  const onSubmit = (formData: MQTTSettingsData) => {
    formData.port = Number(formData.port);
    mutation.mutate(formData);
  };

  if (isLoading) return <Box sx={{ p: 2 }}><Typography>Loading...</Typography></Box>;

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 'medium' }}>MQTT Broker Configuration</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Settings for connecting to the MQTT broker to receive device telemetry.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 8 }}>
          <Input
            label="Broker Host"
            placeholder="e.g. localhost or mqtt.example.com"
            {...register('host')}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Input
            label="Port"
            type="number"
            {...register('port')}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Input
            label="Username (Optional)"
            {...register('username')}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Input
            label="Password (Optional)"
            type="password"
            {...register('password')}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 8 }}>
          <Input
            label="Default Subscription Topic"
            {...register('defaultTopic')}
          />
        </Grid>

        <Grid size={{ xs: 12 }}>
          <FormControlLabel
            control={<Checkbox {...register('tls')} />}
            label="Use TLS (MQTTS)"
          />
        </Grid>
      </Grid>

      <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider', display: 'flex', justifyItems: 'flex-end', justifyContent: 'flex-end' }}>
        <Button
          type="submit"
          isLoading={mutation.isPending}
        >
          Save Configuration
        </Button>
      </Box>
    </Box>
  );
}
