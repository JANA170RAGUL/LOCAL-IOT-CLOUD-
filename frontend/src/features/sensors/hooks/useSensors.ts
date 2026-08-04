import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getSensors,
  getSensorById,
  createSensor,
  updateSensor,
  deleteSensor,
} from '../api/sensor';
import type { SensorCreate, SensorUpdate, SensorFilter } from '../types';

export const sensorKeys = {
  all: ['sensors'] as const,
  lists: () => [...sensorKeys.all, 'list'] as const,
  list: (deviceId: string, page: number, pageSize: number, filters: SensorFilter) =>
    [...sensorKeys.lists(), { deviceId, page, pageSize, ...filters }] as const,
  details: () => [...sensorKeys.all, 'detail'] as const,
  detail: (id: string) => [...sensorKeys.details(), id] as const,
};

export const useSensorsQuery = (
  deviceId: string,
  page: number,
  pageSize: number,
  filters: SensorFilter = {}
) => {
  return useQuery({
    queryKey: sensorKeys.list(deviceId, page, pageSize, filters),
    queryFn: () => getSensors(deviceId, page, pageSize, filters),
    enabled: !!deviceId,
    placeholderData: (previousData) => previousData,
  });
};

export const useSensorDetailsQuery = (id: string) => {
  return useQuery({
    queryKey: sensorKeys.detail(id),
    queryFn: () => getSensorById(id),
    enabled: !!id,
  });
};

export const useCreateSensorMutation = (deviceId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SensorCreate) => createSensor(deviceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sensorKeys.lists() });
    },
  });
};

export const useUpdateSensorMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: SensorUpdate }) => updateSensor(id, data),
    onSuccess: (updatedSensor) => {
      queryClient.invalidateQueries({ queryKey: sensorKeys.lists() });
      queryClient.setQueryData(sensorKeys.detail(updatedSensor.id), updatedSensor);
    },
  });
};

export const useDeleteSensorMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteSensor(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: sensorKeys.lists() });
    },
  });
};
