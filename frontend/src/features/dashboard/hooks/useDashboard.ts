import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDashboards, getDashboard, createDashboard } from '../api/dashboard';

export const useDashboardsQuery = (projectId: string) => {
  return useQuery({
    queryKey: ['dashboards', { projectId }],
    queryFn: () => getDashboards(projectId),
    enabled: !!projectId,
  });
};

export const useDashboardQuery = (dashboardId: string) => {
  return useQuery({
    queryKey: ['dashboard', dashboardId],
    queryFn: () => getDashboard(dashboardId),
    enabled: !!dashboardId,
  });
};

export const useCreateDashboardMutation = (projectId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: { code: string; name: string }) => createDashboard(projectId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dashboards', { projectId }] });
    },
  });
};
