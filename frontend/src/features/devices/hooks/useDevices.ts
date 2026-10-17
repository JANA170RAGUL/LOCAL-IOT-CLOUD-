import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDevices,
  getDeviceById,
  createDevice,
  updateDevice,
  deleteDevice,
  getDeviceCredentials,
  createDeviceCredential,
  rotateDeviceCredential,
  revokeDeviceCredential,
  getAllDevices,
} from '../api/device';
import type { DeviceCreate, DeviceUpdate, DeviceFilter } from '../types';

export const deviceKeys = {
  all: ['devices'] as const,
  lists: () => [...deviceKeys.all, 'list'] as const,
  list: (gatewayId: string, page: number, pageSize: number, filters: DeviceFilter) =>
    [...deviceKeys.lists(), { gatewayId, page, pageSize, ...filters }] as const,
  details: () => [...deviceKeys.all, 'detail'] as const,
  detail: (id: string) => [...deviceKeys.details(), id] as const,
  credentials: (id: string) => [...deviceKeys.detail(id), 'credentials'] as const,
};

export const useDevicesQuery = (
  gatewayId: string,
  page: number,
  pageSize: number,
  filters: DeviceFilter = {}
) => {
  return useQuery({
    queryKey: deviceKeys.list(gatewayId, page, pageSize, filters),
    queryFn: () => getDevices(gatewayId, page, pageSize, filters),
    enabled: !!gatewayId,
    placeholderData: (previousData) => previousData,
  });
};

export const useDeviceDetailsQuery = (id: string) => {
  return useQuery({
    queryKey: deviceKeys.detail(id),
    queryFn: () => getDeviceById(id),
    enabled: !!id,
  });
};

export const useCreateDeviceMutation = (gatewayId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: DeviceCreate) => createDevice(gatewayId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() });
    },
  });
};

export const useUpdateDeviceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: DeviceUpdate }) => updateDevice(id, data),
    onSuccess: (updatedDevice) => {
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() });
      queryClient.setQueryData(deviceKeys.detail(updatedDevice.id), updatedDevice);
    },
  });
};

export const useDeleteDeviceMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteDevice(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceKeys.lists() });
    },
  });
};

export const useDeviceCredentialsQuery = (deviceId: string) => {
  return useQuery({
    queryKey: deviceKeys.credentials(deviceId),
    queryFn: () => getDeviceCredentials(deviceId),
    enabled: !!deviceId,
  });
};

export const useCreateDeviceCredentialMutation = (deviceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (name?: string) => createDeviceCredential(deviceId, name),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceKeys.credentials(deviceId) });
    },
  });
};

export const useRotateDeviceCredentialMutation = (deviceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (credentialId: string) => rotateDeviceCredential(deviceId, credentialId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceKeys.credentials(deviceId) });
    },
  });
};

export const useRevokeDeviceCredentialMutation = (deviceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (credentialId: string) => revokeDeviceCredential(deviceId, credentialId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: deviceKeys.credentials(deviceId) });
    },
  });
};

export const useAllDevicesQuery = (search?: string) => {
  return useQuery({
    queryKey: ['devices', 'all', search],
    queryFn: () => getAllDevices(search),
  });
};
