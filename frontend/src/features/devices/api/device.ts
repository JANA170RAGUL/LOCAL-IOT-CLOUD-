import api from '../../../services/api/axios';
import type {
  Device,
  DeviceCreate,
  DeviceUpdate,
  DeviceFilter,
  DeviceListResponse,
} from '../types';

export const getDevices = async (
  gatewayId: string,
  page = 1,
  pageSize = 10,
  filters: DeviceFilter = {}
): Promise<DeviceListResponse> => {
  const response = await api.get<DeviceListResponse>(
    `/gateways/${gatewayId}/devices/`,
    {
      params: {
        page,
        page_size: pageSize,
        search: filters.search || undefined,
        status: filters.status || undefined,
        device_type: filters.device_type || undefined,
      },
    }
  );
  return response.data;
};

export const getDeviceById = async (deviceId: string): Promise<Device> => {
  const response = await api.get<Device>(`/devices/${deviceId}`);
  return response.data;
};

export const createDevice = async (
  gatewayId: string,
  data: DeviceCreate
): Promise<Device> => {
  const response = await api.post<Device>(
    `/gateways/${gatewayId}/devices/`,
    data
  );
  return response.data;
};

export const updateDevice = async (
  deviceId: string,
  data: DeviceUpdate
): Promise<Device> => {
  const response = await api.patch<Device>(`/devices/${deviceId}`, data);
  return response.data;
};

export const deleteDevice = async (deviceId: string): Promise<void> => {
  await api.delete(`/devices/${deviceId}`);
};

export const getDeviceCredentials = async (deviceId: string) => {
  const response = await api.get(`/devices/${deviceId}/credentials`);
  return response.data;
};

export const createDeviceCredential = async (deviceId: string, name = 'Primary Key') => {
  const response = await api.post(`/devices/${deviceId}/credentials`, { name });
  return response.data;
};

export const rotateDeviceCredential = async (deviceId: string, credentialId: string) => {
  const response = await api.post(`/devices/${deviceId}/credentials/${credentialId}/rotate`);
  return response.data;
};

export const revokeDeviceCredential = async (deviceId: string, credentialId: string) => {
  await api.delete(`/devices/${deviceId}/credentials/${credentialId}`);
};

export const getAllDevices = async (search?: string): Promise<Device[]> => {
  const response = await api.get<Device[]>('/devices/', {
    params: { search: search || undefined },
  });
  return response.data;
};
