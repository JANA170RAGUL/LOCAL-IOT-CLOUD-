import React, { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
} from '@mui/material';
import type { Organization } from '../types';

const schema = z.object({
  code: z.string().min(2, 'Code must be at least 2 characters').max(20, 'Code too long'),
  name: z.string().min(3, 'Name must be at least 3 characters').max(150, 'Name too long'),
  email: z.string().email('Invalid email address'),
  description: z.string().max(500, 'Description too long').optional(),
  phone: z.string().max(20, 'Phone too long').optional(),
  website: z.string().max(255, 'Website URL too long').optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'TRIAL', 'EXPIRED']).default('ACTIVE'),
  license_type: z.enum(['Community', 'Professional', 'Enterprise', 'Academic']).default('Community'),
});

type FormValues = z.infer<typeof schema>;

interface OrganizationFormProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (values: any) => void;
  organization?: Organization | null;
  submitting?: boolean;
}

export const OrganizationForm: React.FC<OrganizationFormProps> = ({
  open,
  onClose,
  onSubmit,
  organization,
  submitting = false,
}) => {
  const isEdit = !!organization;

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
      license_type: 'Community',
    },
  });

  useEffect(() => {
    if (organization) {
      reset({
        code: organization.code,
        name: organization.name,
        email: organization.email,
        description: organization.description || '',
        phone: organization.phone || '',
        website: organization.website || '',
        status: organization.status,
        license_type: organization.license_type,
      });
    } else {
      reset({
        code: '',
        name: '',
        email: '',
        description: '',
        phone: '',
        website: '',
        status: 'ACTIVE',
        license_type: 'Community',
      });
    }
  }, [organization, reset, open]);

  const onFormSubmit = (data: FormValues) => {
    onSubmit(data);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ fontWeight: 700 }}>
        {isEdit ? 'Edit Organization' : 'Create Organization'}
      </DialogTitle>
      <form onSubmit={handleSubmit(onFormSubmit)}>
        <DialogContent dividers>
          <Grid container spacing={2}>
            {/* Code */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="code"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Organization Code"
                    fullWidth
                    disabled={isEdit}
                    error={!!errors.code}
                    helperText={errors.code?.message ? String(errors.code.message) : undefined}
                    placeholder="e.g. ORG_DEV"
                    size="small"
                  />
                )}
              />
            </Grid>

            {/* Name */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="name"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Name"
                    fullWidth
                    error={!!errors.name}
                    helperText={errors.name?.message ? String(errors.name.message) : undefined}
                    size="small"
                  />
                )}
              />
            </Grid>

            {/* Email */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="email"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Contact Email"
                    fullWidth
                    error={!!errors.email}
                    helperText={errors.email?.message ? String(errors.email.message) : undefined}
                    size="small"
                  />
                )}
              />
            </Grid>

            {/* Phone */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <Controller
                name="phone"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Contact Phone"
                    fullWidth
                    error={!!errors.phone}
                    helperText={errors.phone?.message ? String(errors.phone.message) : undefined}
                    size="small"
                  />
                )}
              />
            </Grid>

            {/* Website */}
            <Grid size={12}>
              <Controller
                name="website"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Website URL"
                    fullWidth
                    error={!!errors.website}
                    helperText={errors.website?.message ? String(errors.website.message) : undefined}
                    size="small"
                  />
                )}
              />
            </Grid>

            {/* License Type */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small" error={!!errors.license_type}>
                <InputLabel id="license-type-label">License Type</InputLabel>
                <Controller
                  name="license_type"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      labelId="license-type-label"
                      label="License Type"
                    >
                      <MenuItem value="Community">Community</MenuItem>
                      <MenuItem value="Professional">Professional</MenuItem>
                      <MenuItem value="Enterprise">Enterprise</MenuItem>
                      <MenuItem value="Academic">Academic</MenuItem>
                    </Select>
                  )}
                />
              </FormControl>
            </Grid>

            {/* Status */}
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth size="small" error={!!errors.status}>
                <InputLabel id="status-label">Status</InputLabel>
                <Controller
                  name="status"
                  control={control}
                  render={({ field }) => (
                    <Select
                      {...field}
                      labelId="status-label"
                      label="Status"
                    >
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

            {/* Description */}
            <Grid size={12}>
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Description"
                    fullWidth
                    multiline
                    rows={3}
                    error={!!errors.description}
                    helperText={errors.description?.message ? String(errors.description.message) : undefined}
                    size="small"
                  />
                )}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={onClose} color="inherit" disabled={submitting}>
            Cancel
          </Button>
          <Button type="submit" variant="contained" disabled={submitting}>
            {submitting ? 'Saving...' : 'Save'}
          </Button>
        </DialogActions>
      </form>
    </Dialog>
  );
};
