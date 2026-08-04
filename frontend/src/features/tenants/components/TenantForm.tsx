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
import type { Tenant } from '../types';

const schema = z.object({
  code: z.string().min(2).max(20),
  name: z.string().min(3).max(150),
  email: z.string().email('Invalid email'),
  description: z.string().max(500).optional(),
  phone: z.string().max(20).optional(),
  website: z.string().max(255).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'TRIAL', 'EXPIRED']).default('ACTIVE'),
});

interface TenantFormProps {
  open: boolean;
  tenant?: Tenant | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (values: any) => void;
}

export const TenantForm: React.FC<TenantFormProps> = ({
  open,
  tenant,
  submitting = false,
  onClose,
  onSubmit,
}) => {
  const isEdit = !!tenant;

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
      email: '',
      description: '',
      phone: '',
      website: '',
      status: 'ACTIVE',
    },
  });

  useEffect(() => {
    if (!open) return;
    reset(
      tenant
        ? {
            code: tenant.code,
            name: tenant.name,
            email: tenant.email,
            description: tenant.description ?? '',
            phone: tenant.phone ?? '',
            website: tenant.website ?? '',
            status: tenant.status,
          }
        : { code: '', name: '', email: '', description: '', phone: '', website: '', status: 'ACTIVE' }
    );
  }, [open, tenant, reset]);

  return (
    <FormDialog
      open={open}
      title={isEdit ? 'Edit Tenant' : 'Create Tenant'}
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
                label="Tenant Code"
                fullWidth
                size="small"
                disabled={isEdit}
                error={!!errors.code}
                helperText={errors.code?.message ? String(errors.code.message) : undefined}
                placeholder="e.g. TEN_PROD"
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
                label="Name"
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
            name="email"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Contact Email"
                fullWidth
                size="small"
                error={!!errors.email}
                helperText={errors.email?.message ? String(errors.email.message) : undefined}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <Controller
            name="phone"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Phone"
                fullWidth
                size="small"
                error={!!errors.phone}
                helperText={errors.phone?.message ? String(errors.phone.message) : undefined}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 8 }}>
          <Controller
            name="website"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="Website"
                fullWidth
                size="small"
                error={!!errors.website}
                helperText={errors.website?.message ? String(errors.website.message) : undefined}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 4 }}>
          <FormControl fullWidth size="small">
            <InputLabel id="tenant-status-label">Status</InputLabel>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select {...field} labelId="tenant-status-label" label="Status">
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
