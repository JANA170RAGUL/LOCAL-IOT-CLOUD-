import api from '../../../services/api/axios';
import type {
  DeviceConnection,
  DeviceConnectionCreate,
  DeviceConnectionUpdate,
  ConnectionTestResponse,
  DeviceAgent,
  HardwareComponent,
  HardwareDiscoveryResponse,
  ProvisioningJob,
} from '../types';

// Connection APIs
export const getDeviceConnection = async (deviceId: string): Promise<DeviceConnection | null> => {
  try {
    const response = await api.get<DeviceConnection>(`/devices/${deviceId}/connection`);
    return response.data;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

export const createDeviceConnection = async (
  deviceId: string,
  data: DeviceConnectionCreate
): Promise<DeviceConnection> => {
  const response = await api.post<DeviceConnection>(`/devices/${deviceId}/connection`, data);
  return response.data;
};

export const updateDeviceConnection = async (
  deviceId: string,
  data: DeviceConnectionUpdate
): Promise<DeviceConnection> => {
  const response = await api.patch<DeviceConnection>(`/devices/${deviceId}/connection`, data);
  return response.data;
};

export const deleteDeviceConnection = async (deviceId: string): Promise<void> => {
  await api.delete(`/devices/${deviceId}/connection`);
};

export const testDeviceConnection = async (deviceId: string): Promise<ConnectionTestResponse> => {
  const response = await api.post<ConnectionTestResponse>(`/devices/${deviceId}/connection/test`);
  return response.data;
};

// Agent APIs
export const getDeviceAgent = async (deviceId: string): Promise<DeviceAgent | null> => {
  try {
    const response = await api.get<DeviceAgent>(`/devices/${deviceId}/agent`);
    return response.data;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return null;
    }
    throw error;
  }
};

export const detectDeviceAgent = async (deviceId: string): Promise<DeviceAgent> => {
  const response = await api.post<DeviceAgent>(`/devices/${deviceId}/agent/detect`);
  return response.data;
};

// Hardware Discovery APIs
export const getDeviceHardware = async (deviceId: string): Promise<HardwareComponent[]> => {
  try {
    const response = await api.get<HardwareComponent[]>(`/devices/${deviceId}/hardware`);
    return response.data;
  } catch (error: any) {
    if (error?.response?.status === 404) {
      return [];
    }
    throw error;
  }
};

export const discoverDeviceHardware = async (deviceId: string): Promise<HardwareComponent[]> => {
  const response = await api.post<HardwareComponent[]>(`/devices/${deviceId}/discover`);
  return response.data;
};

export const identifyDeviceHardware = async (deviceId: string): Promise<HardwareComponent[]> => {
  const response = await api.post<HardwareComponent[]>(`/devices/${deviceId}/identify`);
  return response.data;
};

// Provisioning Job APIs
export const startDeviceProvisioning = async (deviceId: string): Promise<ProvisioningJob> => {
  const response = await api.post<ProvisioningJob>(`/devices/${deviceId}/provision`);
  return response.data;
};

export const getProvisioningJob = async (deviceId: string, jobId: string): Promise<ProvisioningJob> => {
  const response = await api.get<ProvisioningJob>(`/devices/${deviceId}/provisioning/${jobId}`);
  return response.data;
};
