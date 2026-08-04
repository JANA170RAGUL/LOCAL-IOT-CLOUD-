import api from '@/services/api/axios';
import type { 
  User, 
  UserCreate, 
  UserUpdate, 
  UserFilter, 
  UserListResponse,
  ChangePasswordRequest,
  ResetPasswordRequest
} from '../types';

export const userApi = {
  list: async (filters: UserFilter): Promise<UserListResponse> => {
    const params = new URLSearchParams();
    if (filters.search) params.append('search', filters.search);
    if (filters.role) params.append('role', filters.role);
    if (filters.status) params.append('status', filters.status);
    if (filters.page) params.append('page', filters.page.toString());
    if (filters.page_size) params.append('page_size', filters.page_size.toString());
    
    const response = await api.get<UserListResponse>(`/users/?${params.toString()}`);
    return response.data;
  },

  get: async (id: string): Promise<User> => {
    const response = await api.get<User>(`/users/${id}`);
    return response.data;
  },

  getMe: async (): Promise<User> => {
    const response = await api.get<User>('/users/me');
    return response.data;
  },

  create: async (data: UserCreate): Promise<User> => {
    const response = await api.post<User>('/users/', data);
    return response.data;
  },

  update: async (id: string, data: UserUpdate): Promise<User> => {
    const response = await api.patch<User>(`/users/${id}`, data);
    return response.data;
  },

  delete: async (id: string): Promise<void> => {
    await api.delete(`/users/${id}`);
  },

  changePassword: async (data: ChangePasswordRequest): Promise<void> => {
    await api.post('/users/change-password', data);
  },

  resetPassword: async (id: string, data: ResetPasswordRequest): Promise<{detail: string, temporary_password?: string}> => {
    const response = await api.post(`/users/${id}/reset-password`, data);
    return response.data;
  }
};
