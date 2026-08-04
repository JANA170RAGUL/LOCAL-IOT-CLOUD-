import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
} from '../api/project';
import type { ProjectCreate, ProjectUpdate, ProjectFilter } from '../types';

// Query Keys
export const projectKeys = {
  all: ['projects'] as const,
  lists: () => [...projectKeys.all, 'list'] as const,
  list: (tenantId: string, page: number, pageSize: number, filters: ProjectFilter) =>
    [...projectKeys.lists(), { tenantId, page, pageSize, ...filters }] as const,
  details: () => [...projectKeys.all, 'detail'] as const,
  detail: (id: string) => [...projectKeys.details(), id] as const,
};

// Hooks
export const useProjectsQuery = (
  tenantId: string,
  page: number,
  pageSize: number,
  filters: ProjectFilter = {}
) => {
  return useQuery({
    queryKey: projectKeys.list(tenantId, page, pageSize, filters),
    queryFn: () => getProjects(tenantId, page, pageSize, filters),
    enabled: !!tenantId,
    placeholderData: (previousData) => previousData,
  });
};

export const useProjectDetailsQuery = (id: string) => {
  return useQuery({
    queryKey: projectKeys.detail(id),
    queryFn: () => getProjectById(id),
    enabled: !!id,
  });
};

export const useCreateProjectMutation = (tenantId: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: ProjectCreate) => createProject(tenantId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
    },
  });
};

export const useUpdateProjectMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ProjectUpdate }) => updateProject(id, data),
    onSuccess: (updatedProject) => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      queryClient.setQueryData(projectKeys.detail(updatedProject.id), updatedProject);
    },
  });
};

export const useDeleteProjectMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteProject(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: projectKeys.lists() });
      // We could also invalidate the specific project detail, but typically lists update is enough
    },
  });
};
