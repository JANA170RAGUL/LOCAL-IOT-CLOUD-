import api from '@/services/api/axios';
import type { 
  NotificationListResponse, 
  UserNotificationPreferenceResponse, 
  UserNotificationPreferenceUpdate 
} from '../types';

export const notificationApi = {
  getHistory: async (skip = 0, limit = 100): Promise<NotificationListResponse> => {
    const response = await api.get('/notifications/history', { params: { skip, limit } });
    return response.data;
  },

  getPreferences: async (): Promise<UserNotificationPreferenceResponse[]> => {
    const response = await api.get('/notifications/preferences');
    return response.data;
  },

  updatePreference: async (data: UserNotificationPreferenceUpdate): Promise<UserNotificationPreferenceResponse> => {
    const response = await api.put('/notifications/preferences', data);
    return response.data;
  }
};
