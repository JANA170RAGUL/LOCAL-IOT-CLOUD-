import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Grid,
  TextField,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  Typography,
  Divider,
} from '@mui/material';
import { FormDialog } from '../../../components/FormDialog';
import { SensorType, MeasurementUnit, DataType } from '../types';
import type { SensorBase } from '../types';

const schema = z.object({
  code: z.string().min(2).max(20),
  name: z.string().min(3).max(150),
  sensor_type: z.nativeEnum(SensorType).default(SensorType.CUSTOM),
  unit: z.nativeEnum(MeasurementUnit).nullable().optional(),
  data_type: z.nativeEnum(DataType).default(DataType.NUMBER),

  min_value: z.number().nullable().optional(),
  max_value: z.number().nullable().optional(),
  default_value: z.string().max(255).nullable().optional(),

  sampling_interval: z.number().min(1).default(5),
  calibration_offset: z.number().default(0),
  calibration_scale: z.number().default(1),

  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'TRIAL', 'EXPIRED']).default('ACTIVE'),
});

interface SensorFormProps {
  open: boolean;
  sensor?: Partial<SensorBase> | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (values: any) => void;
}

export const SensorForm: React.FC<SensorFormProps> = ({
  open,
  sensor,
  submitting = false,
  onClose,
  onSubmit,
}) => {
  const isEdit = !!(sensor && sensor.code);

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: {
      code: '',
      name: '',
      sensor_type: SensorType.CUSTOM,
      unit: null,
      data_type: DataType.NUMBER,
      min_value: null,
      max_value: null,
      default_value: '',
      sampling_interval: 5,
      calibration_offset: 0,
      calibration_scale: 1,
      status: 'ACTIVE',
    },
  });

  useEffect(() => {
    if (!open) return;
    reset(
      sensor
        ? {
            code: sensor.code ?? '',
            name: sensor.name ?? '',
            sensor_type: sensor.sensor_type ?? SensorType.CUSTOM,
            unit: sensor.unit ?? null,
            data_type: sensor.data_type ?? DataType.NUMBER,
            min_value: sensor.min_value ?? null,
            max_value: sensor.max_value ?? null,
            default_value: sensor.default_value ?? '',
            sampling_interval: sensor.sampling_interval ?? 5,
            calibration_offset: sensor.calibration_offset ?? 0,
            calibration_scale: sensor.calibration_scale ?? 1,
            status: (sensor as any).status ?? 'ACTIVE',
          }
        : {
            code: '',
            name: '',
            sensor_type: SensorType.CUSTOM,
            unit: null,
            data_type: DataType.NUMBER,
            min_value: null,
            max_value: null,
            default_value: '',
            sampling_interval: 5,
            calibration_offset: 0,
            calibration_scale: 1,
            status: 'ACTIVE',
          }
    );
  }, [open, sensor, reset]);

  return (
    <FormDialog
      open={open}
      title={isEdit ? 'Edit Sensor' : 'Create Sensor'}
      onClose={onClose}
      onSubmit={handleSubmit(onSubmit)}
      loading={submitting}
    >
      <Grid container spacing={3}>
        {/* General Section */}
        <Grid size={12}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
            General Information
          </Typography>
          <Divider sx={{ mt: 1, mb: 1 }} />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="code"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Sensor Code"
                fullWidth
                size="small"
                disabled={isEdit}
                error={!!errors.code}
                helperText={errors.code?.message ? String(errors.code.message) : undefined}
                placeholder="e.g. SENS_TEMP_01"
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Sensor Name"
                fullWidth
                size="small"
                error={!!errors.name}
                helperText={errors.name?.message ? String(errors.name.message) : undefined}
              />
            )}
          />
        </Grid>
        
        <Grid size={{ xs: 12, sm: 4 }}>
          <FormControl fullWidth size="small" error={!!errors.sensor_type}>
            <InputLabel id="sensor-type-label">Sensor Type</InputLabel>
            <Controller
              name="sensor_type"
              control={control}
              render={({ field }) => (
                <Select {...field} labelId="sensor-type-label" label="Sensor Type">
                  {Object.values(SensorType).map((type) => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              )}
            />
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <FormControl fullWidth size="small" error={!!errors.data_type}>
            <InputLabel id="data-type-label">Data Type</InputLabel>
            <Controller
              name="data_type"
              control={control}
              render={({ field }) => (
                <Select {...field} labelId="data-type-label" label="Data Type">
                  {Object.values(DataType).map((type) => (
                    <MenuItem key={type} value={type}>{type}</MenuItem>
                  ))}
                </Select>
              )}
            />
          </FormControl>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 4 }}>
          <FormControl fullWidth size="small" error={!!errors.unit}>
            <InputLabel id="unit-label">Measurement Unit</InputLabel>
            <Controller
              name="unit"
              control={control}
              render={({ field }) => (
                <Select {...field} labelId="unit-label" label="Measurement Unit" value={field.value || ''} onChange={(e) => field.onChange(e.target.value || null)}>
                  <MenuItem value="">— None —</MenuItem>
                  {Object.entries(MeasurementUnit).map(([key, value]) => (
                    <MenuItem key={key} value={value}>{value} ({key})</MenuItem>
                  ))}
                </Select>
              )}
            />
          </FormControl>
        </Grid>
        
        <Grid size={{ xs: 12, sm: 12 }}>
          <FormControl fullWidth size="small">
            <InputLabel id="sensor-status-label">Lifecycle Status</InputLabel>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select {...field} labelId="sensor-status-label" label="Lifecycle Status">
                  <MenuItem value="ACTIVE">Active</MenuItem>
                  <MenuItem value="INACTIVE">Inactive</MenuItem>
                  <MenuItem value="SUSPENDED">Suspended</MenuItem>
                  <MenuItem value="TRIAL">Trial</MenuItem>
                  <MenuItem value="EXPIRED">Expired</MenuItem>
                </Select>
              )}
            />
          </FormControl>
        </Grid>

        {/* Operating Range Section */}
        <Grid size={12}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 1 }}>
            Operating Limits
          </Typography>
          <Divider sx={{ mt: 1, mb: 1 }} />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Controller
            name="min_value"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                type="number"
                label="Min Value"
                fullWidth
                size="small"
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                error={!!errors.min_value}
                helperText={errors.min_value?.message ? String(errors.min_value.message) : undefined}
              />
            )}
          />
        </Grid>
        
        <Grid size={{ xs: 12, sm: 4 }}>
          <Controller
            name="max_value"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                type="number"
                label="Max Value"
                fullWidth
                size="small"
                value={field.value ?? ''}
                onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : null)}
                error={!!errors.max_value}
                helperText={errors.max_value?.message ? String(errors.max_value.message) : undefined}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Controller
            name="default_value"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Default Value"
                fullWidth
                size="small"
                value={field.value ?? ''}
                error={!!errors.default_value}
                helperText={errors.default_value?.message ? String(errors.default_value.message) : undefined}
              />
            )}
          />
        </Grid>

        {/* Calibration Section */}
        <Grid size={12}>
          <Typography variant="subtitle1" sx={{ fontWeight: 600, mt: 1 }}>
            Sampling & Calibration
          </Typography>
          <Divider sx={{ mt: 1, mb: 1 }} />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Controller
            name="sampling_interval"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                type="number"
                label="Sampling Interval (s)"
                fullWidth
                size="small"
                onChange={(e) => field.onChange(parseInt(e.target.value) || 1)}
                error={!!errors.sampling_interval}
                helperText={errors.sampling_interval?.message ? String(errors.sampling_interval.message) : undefined}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Controller
            name="calibration_scale"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                type="number"
                label="Scale Multiplier"
                fullWidth
                size="small"
                slotProps={{ htmlInput: { step: '0.01' } }}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 1)}
                error={!!errors.calibration_scale}
                helperText={errors.calibration_scale?.message ? String(errors.calibration_scale.message) : undefined}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <Controller
            name="calibration_offset"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                type="number"
                label="Offset Adder"
                fullWidth
                size="small"
                slotProps={{ htmlInput: { step: '0.01' } }}
                onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                error={!!errors.calibration_offset}
                helperText={errors.calibration_offset?.message ? String(errors.calibration_offset.message) : undefined}
              />
            )}
          />
        </Grid>
      </Grid>
    </FormDialog>
  );
};
