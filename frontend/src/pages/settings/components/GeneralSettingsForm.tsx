import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { settingsApi } from '../../../features/settings/api/settings';
import { Button } from '@/components/Button';
import { Input } from '@/components/Input';
import { Select } from '@/components/Select';
import { Box, Typography, Grid } from '@mui/material';

interface GeneralSettingsData {
  companyName: string;
  timezone: string;
  language: string;
  currency: string;
  dateFormat: string;
}

export default function GeneralSettingsForm() {
  const queryClient = useQueryClient();
  const { register, handleSubmit, reset } = useForm<GeneralSettingsData>();

  const { data, isLoading } = useQuery({
    queryKey: ['settings', 'general'],
    queryFn: () => settingsApi.getCategorySettings('general')
  });

  useEffect(() => {
    if (data) {
      reset({
        companyName: data.companyName || '',
        timezone: data.timezone || 'UTC',
        language: data.language || 'en',
        currency: data.currency || 'USD',
        dateFormat: data.dateFormat || 'YYYY-MM-DD',
      });
    }
  }, [data, reset]);

  const mutation = useMutation({
    mutationFn: (settings: GeneralSettingsData) => settingsApi.updateCategorySettings('general', { settings }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['settings', 'general'] });
      // In a real app, you might show a toast notification here
    }
  });

  const onSubmit = (formData: GeneralSettingsData) => {
    mutation.mutate(formData);
  };

  if (isLoading) return <Box sx={{ p: 2 }}><Typography>Loading...</Typography></Box>;

  return (
    <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <Box>
        <Typography variant="h6" sx={{ fontWeight: 'medium' }}>General Information</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Basic configuration for your platform instance.
        </Typography>
      </Box>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, sm: 8 }}>
          <Input
            label="Company Name"
            {...register('companyName')}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Select
            label="Timezone"
            {...register('timezone')}
            options={[
              { value: 'UTC', label: 'UTC' },
              { value: 'America/New_York', label: 'America/New_York' },
              { value: 'Europe/London', label: 'Europe/London' },
              { value: 'Asia/Tokyo', label: 'Asia/Tokyo' }
            ]}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Select
            label="Language"
            {...register('language')}
            options={[
              { value: 'en', label: 'English' },
              { value: 'es', label: 'Spanish' },
              { value: 'fr', label: 'French' },
              { value: 'de', label: 'German' }
            ]}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Input
            label="Currency"
            {...register('currency')}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Select
            label="Date Format"
            {...register('dateFormat')}
            options={[
              { value: 'YYYY-MM-DD', label: 'YYYY-MM-DD' },
              { value: 'DD/MM/YYYY', label: 'DD/MM/YYYY' },
              { value: 'MM/DD/YYYY', label: 'MM/DD/YYYY' }
            ]}
          />
        </Grid>
      </Grid>

      <Box sx={{ pt: 2, borderTop: 1, borderColor: 'divider', display: 'flex', justifyContent: 'flex-end' }}>
        <Button
          type="submit"
          isLoading={mutation.isPending}
        >
          Save Changes
        </Button>
      </Box>
    </Box>
  );
}
