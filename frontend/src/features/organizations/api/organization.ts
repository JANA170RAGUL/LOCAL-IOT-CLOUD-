import api from '../../../services/api/axios';
import type {
  Organization,
  OrganizationCreate,
  OrganizationUpdate,
  OrganizationFilter,
  OrganizationListResponse,
} from '../types';

// NOTE: FastAPI mounts these routes with trailing slashes.
// Sending requests without a trailing slash causes a 307 redirect which
// browsers block under CORS. All paths below include the trailing slash.

export const getOrganizations = async (
  page = 1,
  pageSize = 10,
  filters: OrganizationFilter = {}
): Promise<OrganizationListResponse> => {
  const params = {
    page,
    page_size: pageSize,
    search: filters.search || undefined,
    status: filters.status || undefined,
    license_type: filters.license_type || undefined,
  };
  const response = await api.get<OrganizationListResponse>('/organizations/', { params });
  return response.data;
};

export const getOrganizationById = async (id: string): Promise<Organization> => {
  const response = await api.get<Organization>(`/organizations/${id}`);
  return response.data;
};

export const createOrganization = async (data: OrganizationCreate): Promise<Organization> => {
  const response = await api.post<Organization>('/organizations/', data);
  return response.data;
};

export const updateOrganization = async (
  id: string,
  data: OrganizationUpdate
): Promise<Organization> => {
  const response = await api.put<Organization>(`/organizations/${id}`, data);
  return response.data;
};

export const deleteOrganization = async (id: string): Promise<void> => {
  await api.delete(`/organizations/${id}`);
};
