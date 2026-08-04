import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  MenuItem,
  TextField,
  Box,
} from '@mui/material';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import type { WidgetConfig } from '../types';
import { WidgetRegistry } from '../registry/WidgetRegistry';

const widgetSchema = z.object({
  id: z.string(),
  title: z.string().min(1, 'Title is required'),
  type: z.string(),
  deviceId: z.string().min(1, 'Device ID is required'),
  sensorCode: z.string().min(1, 'Sensor code is required'),
  timeRange: z.enum(['15m', '1h', '6h', '24h', '7d']),
  refresh: z.enum(['live', 'static']),
  color: z.string().optional(),
  aggregation: z.string().optional(),
});

export type WidgetFormValues = z.infer<typeof widgetSchema>;

interface WidgetEditorProps {
  open: boolean;
  initialValues?: Partial<WidgetConfig>;
  onClose: () => void;
  onSave: (config: WidgetConfig) => void;
}

export const WidgetEditor: React.FC<WidgetEditorProps> = ({
  open,
  initialValues,
  onClose,
  onSave,
}) => {
  const { control, handleSubmit, reset } = useForm<WidgetFormValues>({
    resolver: zodResolver(widgetSchema),
    defaultValues: {
      id: initialValues?.id || crypto.randomUUID(),
      title: initialValues?.title || 'New Widget',
      type: initialValues?.type || 'line',
      deviceId: initialValues?.deviceId || '',
      sensorCode: initialValues?.sensorCode || '',
      timeRange: initialValues?.timeRange || '1h',
      refresh: initialValues?.refresh || 'live',
      color: initialValues?.color || '#1976d2',
      aggregation: initialValues?.aggregation || 'mean',
    },
  });

  // Reset form when opened with new values
  React.useEffect(() => {
    if (open) {
      reset({
        id: initialValues?.id || crypto.randomUUID(),
        title: initialValues?.title || 'New Widget',
        type: initialValues?.type || 'line',
        deviceId: initialValues?.deviceId || '',
        sensorCode: initialValues?.sensorCode || '',
        timeRange: initialValues?.timeRange || '1h',
        refresh: initialValues?.refresh || 'live',
        color: initialValues?.color || '#1976d2',
        aggregation: initialValues?.aggregation || 'mean',
      });
    }
  }, [open, initialValues, reset]);

  const onSubmit = (data: WidgetFormValues) => {
    onSave(data as WidgetConfig);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{initialValues?.id ? 'Edit Widget' : 'Add Widget'}</DialogTitle>
      <form onSubmit={handleSubmit(onSubmit)}>
        <DialogContent dividers>
          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="title"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Widget Title"
                    fullWidth
                    size="small"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select label="Widget Type" fullWidth size="small">
                    {WidgetRegistry.getAll().map((manifest) => {
                      const IconComponent = manifest.icon;
                      return (
                        <MenuItem key={manifest.type} value={manifest.type}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <IconComponent fontSize="small" color="action" />
                            {manifest.name}
                          </Box>
                        </MenuItem>
                      );
                    })}
                  </TextField>
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="deviceId"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Device ID"
                    fullWidth
                    size="small"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="sensorCode"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField
                    {...field}
                    label="Sensor Code"
                    fullWidth
                    size="small"
                    error={!!fieldState.error}
                    helperText={fieldState.error?.message}
                  />
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="timeRange"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select label="Time Range" fullWidth size="small">
                    <MenuItem value="15m">Last 15m</MenuItem>
                    <MenuItem value="1h">Last 1h</MenuItem>
                    <MenuItem value="6h">Last 6h</MenuItem>
                    <MenuItem value="24h">Last 24h</MenuItem>
                    <MenuItem value="7d">Last 7d</MenuItem>
                  </TextField>
                )}
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="refresh"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select label="Update Mode" fullWidth size="small">
                    <MenuItem value="live">Live Stream (WebSocket)</MenuItem>
                    <MenuItem value="static">Static Snapshot</MenuItem>
                  </TextField>
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button type="submit" variant="contained">
            Save
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
