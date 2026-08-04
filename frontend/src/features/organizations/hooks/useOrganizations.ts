import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getOrganizations,
  getOrganizationById,
  createOrganization,
  updateOrganization,
  deleteOrganization,
} from '../api/organization';
import type { OrganizationFilter, OrganizationUpdate } from '../types';
import { useSnackbar } from 'notistack';

export const useOrganizationsQuery = (
  page: number,
  pageSize: number,
  filters: OrganizationFilter
) => {
  return useQuery({
    queryKey: ['organizations', page, pageSize, filters],
    queryFn: () => getOrganizations(page, pageSize, filters),
  });
};

export const useOrganizationQuery = (id: string, enabled = true) => {
  return useQuery({
    queryKey: ['organizations', id],
    queryFn: () => getOrganizationById(id),
    enabled: !!id && enabled,
  });
};

export const useCreateOrganizationMutation = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();
  
  return useMutation({
    mutationFn: createOrganization,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      enqueueSnackbar('Organization created successfully', { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error.response?.data?.message || error.response?.data?.detail || 'Failed to create organization',
        { variant: 'error' }
      );
    }
  });
};

export const useUpdateOrganizationMutation = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: OrganizationUpdate }) =>
      updateOrganization(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      queryClient.invalidateQueries({ queryKey: ['organizations', data.id] });
      enqueueSnackbar('Organization updated successfully', { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error.response?.data?.message || error.response?.data?.detail || 'Failed to update organization',
        { variant: 'error' }
      );
    }
  });
};

export const useDeleteOrganizationMutation = () => {
  const queryClient = useQueryClient();
  const { enqueueSnackbar } = useSnackbar();

  return useMutation({
    mutationFn: deleteOrganization,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['organizations'] });
      enqueueSnackbar('Organization deleted successfully', { variant: 'success' });
    },
    onError: (error: any) => {
      enqueueSnackbar(
        error.response?.data?.message || error.response?.data?.detail || 'Failed to delete organization',
        { variant: 'error' }
      );
    }
  });
};
