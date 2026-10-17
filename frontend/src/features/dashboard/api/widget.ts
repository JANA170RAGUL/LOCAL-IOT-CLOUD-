import api from '../../../services/api/axios';

export interface BackendWidget {
  id: string;
  dashboard_id: string;
  code: string;
  name: string;
  title?: string;
  description?: string;
  widget_type: string;
  data_source: string;
  query_config: Record<string, any>;
  display_config?: Record<string, any>;
  refresh_interval?: number;
  position_x: number;
  position_y: number;
  width: number;
  height: number;
  status: string;
}

export type WidgetCreatePayload = Omit<BackendWidget, 'id' | 'dashboard_id' | 'status'>;
export type WidgetUpdatePayload = Partial<WidgetCreatePayload>;

export const getWidgets = async (dashboardId: string): Promise<BackendWidget[]> => {
  if (!dashboardId) return [];
  const response = await api.get(`dashboards/${dashboardId}/widgets`);
  return response.data.items;
};

export const createWidget = async (dashboardId: string, payload: WidgetCreatePayload): Promise<BackendWidget> => {
  if (!dashboardId) {
    throw new Error('Dashboard ID is required to create a widget. Please select or create a dashboard first.');
  }
  const response = await api.post(`dashboards/${dashboardId}/widgets`, payload);
  return response.data;
};

export const updateWidget = async (widgetId: string, payload: WidgetUpdatePayload): Promise<BackendWidget> => {
  if (!widgetId) {
    throw new Error('Widget ID is required to update a widget.');
  }
  const response = await api.patch(`widgets/${widgetId}`, payload);
  return response.data;
};

export const deleteWidget = async (widgetId: string): Promise<void> => {
  if (!widgetId) return;
  await api.delete(`widgets/${widgetId}`);
};
