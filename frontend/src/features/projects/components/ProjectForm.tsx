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
import type { Project } from '../types';

const schema = z.object({
  code: z.string().min(2).max(20),
  name: z.string().min(3).max(150),
  description: z.string().max(500).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'TRIAL', 'EXPIRED']).default('ACTIVE'),
});

interface ProjectFormProps {
  open: boolean;
  project?: Project | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (values: any) => void;
}

export const ProjectForm: React.FC<ProjectFormProps> = ({
  open,
  project,
  submitting = false,
  onClose,
  onSubmit,
}) => {
  const isEdit = !!project;

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
      status: 'ACTIVE',
    },
  });

  useEffect(() => {
    if (!open) return;
    reset(
      project
        ? {
            code: project.code,
            name: project.name,
            description: project.description ?? '',
            status: project.status,
          }
        : { code: '', name: '', description: '', status: 'ACTIVE' }
    );
  }, [open, project, reset]);

  return (
    <FormDialog
      open={open}
      title={isEdit ? 'Edit Project' : 'Create Project'}
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
                label="Project Code"
                fullWidth
                size="small"
                disabled={isEdit}
                error={!!errors.code}
                helperText={errors.code?.message ? String(errors.code.message) : undefined}
                placeholder="e.g. PRJ_01"
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
                label="Project Name"
                fullWidth
                size="small"
                error={!!errors.name}
                helperText={errors.name?.message ? String(errors.name.message) : undefined}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 12 }}>
          <FormControl fullWidth size="small">
            <InputLabel id="project-status-label">Status</InputLabel>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select {...field} labelId="project-status-label" label="Status">
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
