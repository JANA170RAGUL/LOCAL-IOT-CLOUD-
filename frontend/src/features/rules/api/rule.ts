import axios from 'axios';
import type { BackendRule, RuleCreate, RuleUpdate, RuleFilterParams, RuleListResponse } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export const listRules = async (projectId: string, params: RuleFilterParams): Promise<RuleListResponse> => {
  const response = await axios.get(`${API_BASE_URL}/projects/${projectId}/rules`, { params });
  return response.data;
};

export const getRule = async (ruleId: string): Promise<BackendRule> => {
  const response = await axios.get(`${API_BASE_URL}/rules/${ruleId}`);
  return response.data;
};

export const createRule = async (projectId: string, data: RuleCreate): Promise<BackendRule> => {
  const response = await axios.post(`${API_BASE_URL}/projects/${projectId}/rules`, data);
  return response.data;
};

export const updateRule = async (ruleId: string, data: RuleUpdate): Promise<BackendRule> => {
  const response = await axios.patch(`${API_BASE_URL}/rules/${ruleId}`, data);
  return response.data;
};

export const deleteRule = async (ruleId: string): Promise<void> => {
  await axios.delete(`${API_BASE_URL}/rules/${ruleId}`);
};
