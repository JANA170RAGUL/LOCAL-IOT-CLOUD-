import axios from 'axios';
import type { BackendAlert, AlertFilterParams, AlertListResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const listAlerts = async (projectId: string, params: AlertFilterParams): Promise<AlertListResponse> => {
  const response = await axios.get(`${API_BASE_URL}/projects/${projectId}/alerts`, { params });
  return response.data;
};

export const getAlert = async (alertId: string): Promise<BackendAlert> => {
  const response = await axios.get(`${API_BASE_URL}/alerts/${alertId}`);
  return response.data;
};

export const acknowledgeAlert = async (alertId: string, acknowledgedBy: string): Promise<BackendAlert> => {
  const response = await axios.post(`${API_BASE_URL}/alerts/${alertId}/acknowledge`, {
    acknowledged_by: acknowledgedBy,
  });
  return response.data;
};

export const resolveAlert = async (alertId: string): Promise<BackendAlert> => {
  const response = await axios.post(`${API_BASE_URL}/alerts/${alertId}/resolve`);
  return response.data;
};
