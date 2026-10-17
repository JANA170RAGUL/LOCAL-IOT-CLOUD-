import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getWidgets, createWidget, updateWidget, deleteWidget } from '../api/widget';
import type { WidgetCreatePayload, WidgetUpdatePayload } from '../api/widget';

export const useWidgetsQuery = (dashboardId: string) => {
  return useQuery({
    queryKey: ['widgets', { dashboardId }],
    queryFn: () => getWidgets(dashboardId),
    enabled: !!dashboardId,
  });
};

export const useCreateWidgetMutation = (dashboardId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: WidgetCreatePayload) => {
      if (!dashboardId) {
        return Promise.reject(new Error('No active dashboard selected. Please create or select a dashboard first.'));
      }
      return createWidget(dashboardId, payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['widgets', { dashboardId }] });
    },
  });
};

export const useUpdateWidgetMutation = (dashboardId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ widgetId, payload }: { widgetId: string; payload: WidgetUpdatePayload }) =>
      updateWidget(widgetId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['widgets', { dashboardId }] });
    },
  });
};

export const useDeleteWidgetMutation = (dashboardId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (widgetId: string) => deleteWidget(widgetId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['widgets', { dashboardId }] });
    },
  });
};
