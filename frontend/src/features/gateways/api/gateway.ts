import api from '../../../services/api/axios';
import type {
  Gateway,
  GatewayCreate,
  GatewayUpdate,
  GatewayFilter,
  GatewayListResponse,
} from '../types';

export const getGateways = async (
  projectId: string,
  page = 1,
  pageSize = 10,
  filters: GatewayFilter = {}
): Promise<GatewayListResponse> => {
  const response = await api.get<GatewayListResponse>(
    `/projects/${projectId}/gateways/`,
    {
      params: {
        page,
        page_size: pageSize,
        search: filters.search || undefined,
        status: filters.status || undefined,
        protocol: filters.protocol || undefined,
      },
    }
  );
  return response.data;
};

export const getGatewayById = async (gatewayId: string): Promise<Gateway> => {
  const response = await api.get<Gateway>(`/gateways/${gatewayId}`);
  return response.data;
};

export const createGateway = async (
  projectId: string,
  data: GatewayCreate
): Promise<Gateway> => {
  const response = await api.post<Gateway>(
    `/projects/${projectId}/gateways/`,
    data
  );
  return response.data;
};

export const updateGateway = async (
  gatewayId: string,
  data: GatewayUpdate
): Promise<Gateway> => {
  const response = await api.patch<Gateway>(`/gateways/${gatewayId}`, data);
  return response.data;
};

export const deleteGateway = async (gatewayId: string): Promise<void> => {
  await api.delete(`/gateways/${gatewayId}`);
};
