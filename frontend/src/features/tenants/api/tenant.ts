import api from '../../../services/api/axios';
import type {
  Tenant,
  TenantCreate,
  TenantUpdate,
  TenantFilter,
  TenantListResponse,
} from '../types';

// All list/create paths use trailing slashes to match FastAPI's router
// and avoid the 307 redirect CORS issue.

export const getTenants = async (
  organizationId: string,
  page = 1,
  pageSize = 10,
  filters: TenantFilter = {}
): Promise<TenantListResponse> => {
  const params = {
    page,
    page_size: pageSize,
    search: filters.search || undefined,
    status: filters.status || undefined,
  };
  const response = await api.get<TenantListResponse>(
    `/organizations/${organizationId}/tenants/`,
    { params }
  );
  return response.data;
};

export const getTenantById = async (tenantId: string): Promise<Tenant> => {
  const response = await api.get<Tenant>(`/tenants/${tenantId}`);
  return response.data;
};

export const createTenant = async (
  organizationId: string,
  data: TenantCreate
): Promise<Tenant> => {
  const response = await api.post<Tenant>(
    `/organizations/${organizationId}/tenants/`,
    data
  );
  return response.data;
};

export const updateTenant = async (
  tenantId: string,
  data: TenantUpdate
): Promise<Tenant> => {
  // Backend supports both PATCH and PUT — using PATCH (partial update)
  const response = await api.patch<Tenant>(`/tenants/${tenantId}`, data);
  return response.data;
};

export const deleteTenant = async (tenantId: string): Promise<void> => {
  await api.delete(`/tenants/${tenantId}`);
};
