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
import type { GatewayBase } from '../types';

const schema = z.object({
  code: z.string().min(2).max(20),
  name: z.string().min(3).max(150),
  description: z.string().max(500).optional(),
  protocol: z.enum(['MQTT', 'HTTP', 'COAP', 'WEBSOCKET', 'MODBUS', 'OPC_UA']).default('MQTT'),
  ip_address: z.string().max(45).optional(),
  mac_address: z.string().max(17).optional(),
  firmware_version: z.string().max(50).optional(),
  mqtt_topic: z.string().max(255).optional(),
  status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED', 'TRIAL', 'EXPIRED']).default('ACTIVE'),
});

interface GatewayFormProps {
  open: boolean;
  gateway?: Partial<GatewayBase> | null;
  submitting?: boolean;
  onClose: () => void;
  onSubmit: (values: any) => void;
}

export const GatewayForm: React.FC<GatewayFormProps> = ({
  open,
  gateway,
  submitting = false,
  onClose,
  onSubmit,
}) => {
  const isEdit = !!(gateway && gateway.code);

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
      protocol: 'MQTT',
      ip_address: '',
      mac_address: '',
      firmware_version: '',
      mqtt_topic: '',
      status: 'ACTIVE',
    },
  });

  useEffect(() => {
    if (!open) return;
    reset(
      gateway
        ? {
            code: gateway.code ?? '',
            name: gateway.name ?? '',
            description: gateway.description ?? '',
            protocol: gateway.protocol ?? 'MQTT',
            ip_address: gateway.ip_address ?? '',
            mac_address: gateway.mac_address ?? '',
            firmware_version: gateway.firmware_version ?? '',
            mqtt_topic: gateway.mqtt_topic ?? '',
            status: (gateway as any).status ?? 'ACTIVE',
          }
        : {
            code: '',
            name: '',
            description: '',
            protocol: 'MQTT',
            ip_address: '',
            mac_address: '',
            firmware_version: '',
            mqtt_topic: '',
            status: 'ACTIVE',
          }
    );
  }, [open, gateway, reset]);

  return (
    <FormDialog
      open={open}
      title={isEdit ? 'Edit Gateway' : 'Create Gateway'}
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
                label="Gateway Code"
                fullWidth
                size="small"
                disabled={isEdit}
                error={!!errors.code}
                helperText={errors.code?.message ? String(errors.code.message) : undefined}
                placeholder="e.g. GTW_MAIN_01"
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
                label="Gateway Name"
                fullWidth
                size="small"
                error={!!errors.name}
                helperText={errors.name?.message ? String(errors.name.message) : undefined}
              />
            )}
          />
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth size="small">
            <InputLabel id="gateway-protocol-label">Protocol</InputLabel>
            <Controller
              name="protocol"
              control={control}
              render={({ field }) => (
                <Select {...field} labelId="gateway-protocol-label" label="Protocol">
                  <MenuItem value="MQTT">MQTT</MenuItem>
                  <MenuItem value="HTTP">HTTP</MenuItem>
                  <MenuItem value="COAP">CoAP</MenuItem>
                  <MenuItem value="WEBSOCKET">WebSocket</MenuItem>
                  <MenuItem value="MODBUS">Modbus</MenuItem>
                  <MenuItem value="OPC_UA">OPC UA</MenuItem>
                </Select>
              )}
            />
          </FormControl>
        </Grid>

        <Grid size={{ xs: 12, sm: 6 }}>
          <FormControl fullWidth size="small">
            <InputLabel id="gateway-status-label">Status</InputLabel>
            <Controller
              name="status"
              control={control}
              render={({ field }) => (
                <Select {...field} labelId="gateway-status-label" label="Status">
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
            name="mqtt_topic"
            control={control}
            render={({ field }) => (
              <TextField
                {...field}
                label="MQTT Topic"
                fullWidth
                size="small"
                error={!!errors.mqtt_topic}
                helperText={errors.mqtt_topic?.message ? String(errors.mqtt_topic.message) : undefined}
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
