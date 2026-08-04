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
