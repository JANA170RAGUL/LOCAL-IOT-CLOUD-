import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listAlerts, getAlert, acknowledgeAlert, resolveAlert } from '../api/alert';
import type { BackendAlert, AlertFilterParams } from '../types';
import { wsManager } from '../../../services/websocket/websocket';

export const alertKeys = {
  all: ['alerts'] as const,
  lists: () => [...alertKeys.all, 'list'] as const,
  list: (projectId: string, filters: AlertFilterParams) => [...alertKeys.lists(), projectId, filters] as const,
  details: () => [...alertKeys.all, 'detail'] as const,
  detail: (id: string) => [...alertKeys.details(), id] as const,
};

export const useAlertsQuery = (projectId: string, filters: AlertFilterParams) => {
  return useQuery({
    queryKey: alertKeys.list(projectId, filters),
    queryFn: () => listAlerts(projectId, filters),
    enabled: !!projectId,
  });
};

export const useAlertQuery = (alertId: string) => {
  return useQuery({
    queryKey: alertKeys.detail(alertId),
    queryFn: () => getAlert(alertId),
    enabled: !!alertId,
  });
};

export const useAcknowledgeAlertMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ alertId, acknowledgedBy }: { alertId: string; acknowledgedBy: string }) =>
      acknowledgeAlert(alertId, acknowledgedBy),
    onSuccess: (updatedAlert) => {
      // Optimistically update the detail view
      queryClient.setQueryData(alertKeys.detail(updatedAlert.id), updatedAlert);
      // Invalidate list queries to refresh the tables
      queryClient.invalidateQueries({ queryKey: alertKeys.lists() });
    },
  });
};

export const useResolveAlertMutation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (alertId: string) => resolveAlert(alertId),
    onSuccess: (updatedAlert) => {
      queryClient.setQueryData(alertKeys.detail(updatedAlert.id), updatedAlert);
      queryClient.invalidateQueries({ queryKey: alertKeys.lists() });
    },
  });
};

/**
 * Subscribes to the live alerts stream for a given project
 * and dynamically updates any active alert query caches.
 */
export const useAlertsStream = (projectId: string) => {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!projectId) return;

    const handleIncomingAlert = (newAlert: BackendAlert) => {
      // Update the exact detail cache if it exists
      queryClient.setQueryData(alertKeys.detail(newAlert.id), newAlert);

      // We should ideally update the paginated list, but it's easier to just
      // invalidate the list queries so they refetch immediately to keep pagination consistent.
      // Alternatively, we could prepend to the first page if it fits the filters.
      queryClient.invalidateQueries({ queryKey: alertKeys.lists() });
    };

    const unsubscribe = wsManager.subscribeAlerts(projectId, handleIncomingAlert);

    return () => {
      unsubscribe();
    };
  }, [projectId, queryClient]);
};
