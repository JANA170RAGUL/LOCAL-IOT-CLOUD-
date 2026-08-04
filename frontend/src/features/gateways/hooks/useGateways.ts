import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getGateways,
  getGatewayById,
  createGateway,
  updateGateway,
  deleteGateway,
} from '../api/gateway';
import type { GatewayCreate, GatewayUpdate, GatewayFilter } from '../types';

// Query Keys
export const gatewayKeys = {
  all: ['gateways'] as const,
  lists: () => [...gatewayKeys.all, 'list'] as const,
  list: (projectId: string, page: number, pageSize: number, filters: GatewayFilter) =>
    [...gatewayKeys.lists(), { projectId, page, pageSize, ...filters }] as const,
  details: () => [...gatewayKeys.all, 'detail'] as const,
  detail: (id: string) => [...gatewayKeys.details(), id] as const,
};

// Hooks
export const useGatewaysQuery = (
  projectId: string,
  page: number,
  pageSize: number,
  filters: GatewayFilter = {}
) => {
  return useQuery({
    queryKey: gatewayKeys.list(projectId, page, pageSize, filters),
    queryFn: () => getGateways(projectId, page, pageSize, filters),
    enabled: !!projectId,
    placeholderData: (previousData) => previousData,
  });
};

export const useGatewayDetailsQuery = (id: string) => {
  return useQuery({
    queryKey: gatewayKeys.detail(id),
    queryFn: () => getGatewayById(id),
    enabled: !!id,
  });
};

export const useCreateGatewayMutation = (projectId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: GatewayCreate) => createGateway(projectId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gatewayKeys.lists() });
    },
  });
};

export const useUpdateGatewayMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: GatewayUpdate }) => updateGateway(id, data),
    onSuccess: (updatedGateway) => {
      queryClient.invalidateQueries({ queryKey: gatewayKeys.lists() });
      queryClient.setQueryData(gatewayKeys.detail(updatedGateway.id), updatedGateway);
    },
  });
};

export const useDeleteGatewayMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteGateway(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: gatewayKeys.lists() });
    },
  });
};
