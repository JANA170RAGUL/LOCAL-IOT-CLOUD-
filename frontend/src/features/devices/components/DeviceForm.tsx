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
} from '@mui/material';
import { FormDialog } from '../../../components/FormDialog';
import type { DeviceBase } from '../types';

const schema = z.object({
  code: z.string().min(2).max(20),
  name: z.string().min(3).max(150),
  description: z.string().max(500).optional(),
  device_type: z.string().max(50).optional(),
  manufacturer: z.string().max(100).optional(),
  model: z.string().max(100).optional(),
  serial_number: z.string().max(100).optional(),
  firmware_version: z.string().max(50).optional(),
  hardware_version: z.string().max(50).optional(),
  mac_address: z.string().max(17).optional(),
  ip_address: z.string().max(45).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'TRIAL', 'EXPIRED']).default('ACTIVE'),
});

interface DeviceFormProps {
  open: boolean;
  device?: Partial<DeviceBase> | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (values: any) => void;
}

export const DeviceForm: React.FC<DeviceFormProps> = ({
  open,
  device,
  submitting = false,
  onClose,
  onSubmit,
}) => {
  const isEdit = !!(device && device.code);

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
      description: '',
      device_type: '',
      manufacturer: '',
      model: '',
      serial_number: '',
      firmware_version: '',
      hardware_version: '',
      mac_address: '',
      ip_address: '',
      status: 'ACTIVE',
    },
  });

  useEffect(() => {
    if (!open) return;
    reset(
      device
        ? {
            code: device.code ?? '',
            name: device.name ?? '',
            description: device.description ?? '',
            device_type: device.device_type ?? '',
            manufacturer: device.manufacturer ?? '',
            model: device.model ?? '',
            serial_number: device.serial_number ?? '',
            firmware_version: device.firmware_version ?? '',
            hardware_version: device.hardware_version ?? '',
            mac_address: device.mac_address ?? '',
            ip_address: device.ip_address ?? '',
            status: (device as any).status ?? 'ACTIVE',
          }
        : {
            code: '',
            name: '',
            description: '',
            device_type: '',
            manufacturer: '',
            model: '',
            serial_number: '',
            firmware_version: '',
            hardware_version: '',
            mac_address: '',
            ip_address: '',
            status: 'ACTIVE',
          }
    );
  }, [open, device, reset]);

  return (
    <FormDialog
      open={open}
      title={isEdit ? 'Edit Device' : 'Create Device'}
      onClose={onClose}
      onSubmit={handleSubmit(onSubmit)}
      loading={submitting}
    >
      <Grid container spacing={2}>
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="code"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Device Code"
                fullWidth
                size="small"
                disabled={isEdit}
                error={!!errors.code}
                helperText={errors.code?.message ? String(errors.code.message) : undefined}
                placeholder="e.g. DEV_01"
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
                label="Device Name"
                fullWidth
                size="small"
                error={!!errors.name}
                helperText={errors.name?.message ? String(errors.name.message) : undefined}
              />
            )}
          />
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="device_type"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Device Type"
                fullWidth
                size="small"
                error={!!errors.device_type}
                helperText={errors.device_type?.message ? String(errors.device_type.message) : undefined}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth size="small">
            <InputLabel id="device-status-label">Status</InputLabel>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select {...field} labelId="device-status-label" label="Status">
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

        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="manufacturer"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Manufacturer"
                fullWidth
                size="small"
                error={!!errors.manufacturer}
                helperText={errors.manufacturer?.message ? String(errors.manufacturer.message) : undefined}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="model"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Model"
                fullWidth
                size="small"
                error={!!errors.model}
                helperText={errors.model?.message ? String(errors.model.message) : undefined}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="serial_number"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Serial Number"
                fullWidth
                size="small"
                error={!!errors.serial_number}
                helperText={errors.serial_number?.message ? String(errors.serial_number.message) : undefined}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="firmware_version"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Firmware Version"
                fullWidth
                size="small"
                error={!!errors.firmware_version}
                helperText={errors.firmware_version?.message ? String(errors.firmware_version.message) : undefined}
              />
            )}
          />
        </Grid>
        
        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="hardware_version"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Hardware Version"
                fullWidth
                size="small"
                error={!!errors.hardware_version}
                helperText={errors.hardware_version?.message ? String(errors.hardware_version.message) : undefined}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="ip_address"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="IP Address"
                fullWidth
                size="small"
                error={!!errors.ip_address}
                helperText={errors.ip_address?.message ? String(errors.ip_address.message) : undefined}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="mac_address"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="MAC Address"
                fullWidth
                size="small"
                error={!!errors.mac_address}
                helperText={errors.mac_address?.message ? String(errors.mac_address.message) : undefined}
              />
            )}
          />
        </Grid>

        <Grid size={12}>
          <Controller
            name="description"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Description"
                fullWidth
                size="small"
                multiline
                rows={3}
                error={!!errors.description}
                helperText={errors.description?.message ? String(errors.description.message) : undefined}
              />
            )}
          />
        </Grid>
      </Grid>
    </FormDialog>
  );
};
