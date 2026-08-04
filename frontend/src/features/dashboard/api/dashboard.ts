import api from '../../../services/api/axios';

export interface Dashboard {
  id: string;
  project_id: string;
  code: string;
  name: string;
  description?: string;
  layout?: Record<string, any>;
  theme?: string;
  is_public: boolean;
  refresh_interval?: number;
  status: string;
}

export const getDashboards = async (projectId: string): Promise<Dashboard[]> => {
  const response = await api.get(`projects/${projectId}/dashboards`);
  return response.data.items;
};

export const getDashboard = async (id: string): Promise<Dashboard> => {
  const response = await api.get(`dashboards/${id}`);
  return response.data;
};

export const createDashboard = async (projectId: string, payload: { code: string; name: string }): Promise<Dashboard> => {
  const response = await api.post(`projects/${projectId}/dashboards`, payload);
  return response.data;
};
