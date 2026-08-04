import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDevices,
  getDeviceById,
  createDevice,
  updateDevice,
  deleteDevice,
} from '../api/device';
import type { DeviceCreate, DeviceUpdate, DeviceFilter } from '../types';

export const deviceKeys = {
  all: ['devices'] as const,
  lists: () => [...deviceKeys.all, 'list'] as const,
  list: (gatewayId: string, page: number, pageSize: number, filters: DeviceFilter) =>
    [...deviceKeys.lists(), { gatewayId, page, pageSize, ...filters }] as const,
  details: () => [...deviceKeys.all, 'detail'] as const,
  detail: (id: string) => [...deviceKeys.details(), id] as const,
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
