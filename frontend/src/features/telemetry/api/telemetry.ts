import api from '../../../services/api/axios';
import type { TelemetryLatest, TelemetryHistory, TelemetryHistoryParams } from '../types';

export const getLatestTelemetry = async (deviceId: string): Promise<TelemetryLatest[]> => {
  const response = await api.get<TelemetryLatest[]>(`/devices/${deviceId}/telemetry/latest`);
  return response.data;
};

export const getTelemetryHistory = async (
  deviceId: string,
  params: TelemetryHistoryParams = {}
): Promise<TelemetryHistory> => {
  const response = await api.get<TelemetryHistory>(`/devices/${deviceId}/telemetry/history`, {
    params: {
      start_time: params.start_time,
      end_time: params.end_time,
      sensor_codes: params.sensor_codes,
      aggregation: params.aggregation,
      window: params.window,
    },
  });
  return response.data;
};
