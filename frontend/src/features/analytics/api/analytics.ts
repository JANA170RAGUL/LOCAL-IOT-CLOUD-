import apiClient from '@/services/api/axios';
import type { 
  PlatformOverview, 
  LiveStatus, 
  AlertAnalytics, 
  RuleAnalyticsItem, 
  SensorActivityItem, 
  TelemetryTrend 
} from '../types';

export const analyticsApi = {
  getOverview: async (): Promise<PlatformOverview> => {
    const response = await apiClient.get('/analytics/overview');
    return response.data;
  },

  getLiveStatus: async (): Promise<LiveStatus> => {
    const response = await apiClient.get('/analytics/live-status');
    return response.data;
  },

  getAlerts: async (): Promise<AlertAnalytics> => {
    const response = await apiClient.get('/analytics/alerts');
    return response.data;
  },

  getRules: async (): Promise<RuleAnalyticsItem[]> => {
    const response = await apiClient.get('/analytics/rules');
    return response.data;
  },

  getSensors: async (): Promise<SensorActivityItem[]> => {
    const response = await apiClient.get('/analytics/sensors');
    return response.data;
  },

  getTrends: async (): Promise<TelemetryTrend> => {
    const response = await apiClient.get('/analytics/trends');
    return response.data;
  }
};
