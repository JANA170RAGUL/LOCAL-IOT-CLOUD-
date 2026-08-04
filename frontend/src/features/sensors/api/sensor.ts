import api from '../../../services/api/axios';
import type {
  Sensor,
  SensorCreate,
  SensorUpdate,
  SensorFilter,
  SensorListResponse,
} from '../types';

export const getSensors = async (
  deviceId: string,
  page = 1,
  pageSize = 10,
  filters: SensorFilter = {}
): Promise<SensorListResponse> => {
  const response = await api.get<SensorListResponse>(
    `/devices/${deviceId}/sensors/`,
    {
      params: {
        page,
        page_size: pageSize,
        search: filters.search || undefined,
        status: filters.status || undefined,
        sensor_type: filters.sensor_type || undefined,
      },
    }
  );
  return response.data;
};

export const getSensorById = async (sensorId: string): Promise<Sensor> => {
  const response = await api.get<Sensor>(`/sensors/${sensorId}`);
  return response.data;
};

export const createSensor = async (
  deviceId: string,
  data: SensorCreate
): Promise<Sensor> => {
  const response = await api.post<Sensor>(
    `/devices/${deviceId}/sensors/`,
    data
  );
  return response.data;
};

export const updateSensor = async (
  sensorId: string,
  data: SensorUpdate
): Promise<Sensor> => {
  const response = await api.patch<Sensor>(`/sensors/${sensorId}`, data);
  return response.data;
};

export const deleteSensor = async (sensorId: string): Promise<void> => {
  await api.delete(`/sensors/${sensorId}`);
};
