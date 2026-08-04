import api from '@/services/api/axios';
import type { CategoryUpdateRequest, AuditLogListResponse, HealthStatusResponse } from '../types';

export const settingsApi = {
  getCategorySettings: async (category: string): Promise<Record<string, any>> => {
    const { data } = await api.get(`/settings/${category}`);
    return data;
  },

  updateCategorySettings: async (category: string, request: CategoryUpdateRequest): Promise<Record<string, any>> => {
    const { data } = await api.put(`/settings/${category}`, request);
    return data;
  },

  getAuditLogs: async (skip: number = 0, limit: number = 100): Promise<AuditLogListResponse> => {
    const { data } = await api.get('/settings/audit', { params: { skip, limit } });
    return data;
  },

  getHealthStatus: async (): Promise<HealthStatusResponse> => {
    const { data } = await api.get('/settings/health');
    return data;
  },

  sendTestEmail: async (config: any): Promise<{ detail: string }> => {
    const { data } = await api.post('/settings/email/test', config);
    return data;
  }
};
