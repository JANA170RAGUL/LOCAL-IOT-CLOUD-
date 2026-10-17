import axios from 'axios';
import { useAuthStore } from '../store/useAuthStore';

import { API_BASE_PATH } from '../../../config/api';

export const authApi = axios.create({
  baseURL: API_BASE_PATH,
});

authApi.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const login = async (data: any) => {
  const response = await authApi.post('/auth/login', data);
  return response.data;
};

export const getMe = async () => {
  const response = await authApi.get('/auth/me');
  return response.data;
};

export const logout = async () => {
  await authApi.post('/auth/logout');
};
