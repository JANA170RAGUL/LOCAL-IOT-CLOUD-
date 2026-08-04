import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getTenants,
  getTenantById,
  createTenant,
  updateTenant,
  deleteTenant,
} from '../api/tenant';
import type { TenantFilter, TenantCreate, TenantUpdate } from '../types';

// ── List ─────────────────────────────────────────────────────────────────────

export const useTenantsQuery = (
  organizationId: string,
  page: number,
  pageSize: number,
  filters: TenantFilter
) =>
  useQuery({
    queryKey: ['tenants', organizationId, page, pageSize, filters],
    queryFn: () => getTenants(organizationId, page, pageSize, filters),
    enabled: !!organizationId,
  });

// ── Single ────────────────────────────────────────────────────────────────────

export const useTenantQuery = (tenantId: string, enabled = true) =>
  useQuery({
    queryKey: ['tenants', tenantId],
    queryFn: () => getTenantById(tenantId),
    enabled: !!tenantId && enabled,
  });

// ── Create ────────────────────────────────────────────────────────────────────

export const useCreateTenantMutation = (organizationId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (data: TenantCreate) => createTenant(organizationId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants', organizationId] });
    },
  });
};

// ── Update ────────────────────────────────────────────────────────────────────

export const useUpdateTenantMutation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TenantUpdate }) =>
      updateTenant(id, data),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['tenants'] });
      queryClient.invalidateQueries({ queryKey: ['tenants', data.id] });
    },
  });
};

// ── Delete ────────────────────────────────────────────────────────────────────

export const useDeleteTenantMutation = (organizationId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: deleteTenant,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tenants', organizationId] });
    },
  });
};
