import api from '../../../services/api/axios';
import type {
  Project,
  ProjectCreate,
  ProjectUpdate,
  ProjectFilter,
  ProjectListResponse,
} from '../types';

// Trailing slashes on list/create to avoid FastAPI 307 redirect CORS issue.

export const getProjects = async (
  tenantId: string,
  page = 1,
  pageSize = 10,
  filters: ProjectFilter = {}
): Promise<ProjectListResponse> => {
  const response = await api.get<ProjectListResponse>(
    `/tenants/${tenantId}/projects/`,
    {
      params: {
        page,
        page_size: pageSize,
        search: filters.search || undefined,
        status: filters.status || undefined,
      },
    }
  );
  return response.data;
};

export const getProjectById = async (projectId: string): Promise<Project> => {
  const response = await api.get<Project>(`/projects/${projectId}`);
  return response.data;
};

export const createProject = async (
  tenantId: string,
  data: ProjectCreate
): Promise<Project> => {
  const response = await api.post<Project>(
    `/tenants/${tenantId}/projects/`,
    data
  );
  return response.data;
};

export const updateProject = async (
  projectId: string,
  data: ProjectUpdate
): Promise<Project> => {
  const response = await api.patch<Project>(`/projects/${projectId}`, data);
  return response.data;
};

export const deleteProject = async (projectId: string): Promise<void> => {
  await api.delete(`/projects/${projectId}`);
};
