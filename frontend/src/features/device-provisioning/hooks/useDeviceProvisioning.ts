import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getDeviceConnection,
  createDeviceConnection,
  updateDeviceConnection,
  deleteDeviceConnection,
  testDeviceConnection,
  getDeviceAgent,
  detectDeviceAgent,
  getDeviceHardware,
  discoverDeviceHardware,
  identifyDeviceHardware,
  startDeviceProvisioning,
  getProvisioningJob,
} from '../api/provisioningApi';
import type {
  DeviceConnectionCreate,
  DeviceConnectionUpdate,
} from '../types';

export const provisioningKeys = {
  all: ['device-provisioning'] as const,
  connection: (deviceId: string) => [...provisioningKeys.all, 'connection', deviceId] as const,
  agent: (deviceId: string) => [...provisioningKeys.all, 'agent', deviceId] as const,
  hardware: (deviceId: string) => [...provisioningKeys.all, 'hardware', deviceId] as const,
  job: (deviceId: string, jobId: string) => [...provisioningKeys.all, 'job', deviceId, jobId] as const,
};

// Connection Hooks
export const useDeviceConnectionQuery = (deviceId: string) => {
  return useQuery({
    queryKey: provisioningKeys.connection(deviceId),
    queryFn: () => getDeviceConnection(deviceId),
    enabled: !!deviceId,
  });
};

export const useCreateConnectionMutation = (deviceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DeviceConnectionCreate) => createDeviceConnection(deviceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: provisioningKeys.connection(deviceId) });
    },
  });
};

export const useUpdateConnectionMutation = (deviceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: DeviceConnectionUpdate) => updateDeviceConnection(deviceId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: provisioningKeys.connection(deviceId) });
    },
  });
};

export const useDeleteConnectionMutation = (deviceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => deleteDeviceConnection(deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: provisioningKeys.connection(deviceId) });
    },
  });
};

export const useTestConnectionMutation = (deviceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => testDeviceConnection(deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: provisioningKeys.connection(deviceId) });
    },
  });
};

// Agent Hooks
export const useDeviceAgentQuery = (deviceId: string) => {
  return useQuery({
    queryKey: provisioningKeys.agent(deviceId),
    queryFn: () => getDeviceAgent(deviceId),
    enabled: !!deviceId,
  });
};

export const useDetectAgentMutation = (deviceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => detectDeviceAgent(deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: provisioningKeys.agent(deviceId) });
    },
  });
};

// Hardware Discovery Hooks
export const useDeviceHardwareQuery = (deviceId: string) => {
  return useQuery({
    queryKey: provisioningKeys.hardware(deviceId),
    queryFn: () => getDeviceHardware(deviceId),
    enabled: !!deviceId,
  });
};

export const useDiscoverHardwareMutation = (deviceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => discoverDeviceHardware(deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: provisioningKeys.hardware(deviceId) });
    },
  });
};

export const useIdentifyHardwareMutation = (deviceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => identifyDeviceHardware(deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: provisioningKeys.hardware(deviceId) });
    },
  });
};

// Provisioning Hooks
export const useStartProvisioningMutation = (deviceId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => startDeviceProvisioning(deviceId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: provisioningKeys.connection(deviceId) });
      queryClient.invalidateQueries({ queryKey: provisioningKeys.agent(deviceId) });
      queryClient.invalidateQueries({ queryKey: provisioningKeys.hardware(deviceId) });
    },
  });
};

export const useProvisioningJobQuery = (deviceId: string, jobId: string | null) => {
  return useQuery({
    queryKey: provisioningKeys.job(deviceId, jobId ?? ''),
    queryFn: () => getProvisioningJob(deviceId, jobId!),
    enabled: !!deviceId && !!jobId,
    refetchInterval: (query) => {
      const data = query.state.data;
      if (!data) return 1000;
      if (data.status === 'RUNNING' || data.status === 'PENDING') {
        return 1000; // Poll every 1s while job is running
      }
      return false; // Stop polling when finished
    },
  });
};
