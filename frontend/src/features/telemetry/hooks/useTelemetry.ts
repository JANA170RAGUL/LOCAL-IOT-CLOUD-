import { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getLatestTelemetry, getTelemetryHistory } from '../api/telemetry';
import type { TelemetryHistoryParams, TelemetryLatest } from '../types';
import { wsManager } from '../../../services/websocket/websocket';

export const telemetryKeys = {
  all: ['telemetry'] as const,
  latest: (deviceId: string) => [...telemetryKeys.all, 'latest', deviceId] as const,
  history: (deviceId: string, params: TelemetryHistoryParams) =>
    [...telemetryKeys.all, 'history', deviceId, params] as const,
};

export const useLatestTelemetryQuery = (deviceId: string) => {
  return useQuery({
    queryKey: telemetryKeys.latest(deviceId),
    queryFn: () => getLatestTelemetry(deviceId),
    enabled: !!deviceId,
    refetchOnWindowFocus: false, // Let WebSockets handle updates
  });
};

export const useTelemetryHistoryQuery = (deviceId: string, params: TelemetryHistoryParams) => {
  return useQuery({
    queryKey: telemetryKeys.history(deviceId, params),
    queryFn: () => getTelemetryHistory(deviceId, params),
    enabled: !!deviceId,
  });
};

/**
 * Custom hook that subscribes to live telemetry stream and updates React Query cache.
 */
export const useTelemetryStream = (deviceId: string) => {
  const queryClient = useQueryClient();
  const [isConnected, setIsConnected] = useState(false); // Can be enhanced later to read WS state

  useEffect(() => {
    if (!deviceId) return;

    // The callback merges the incoming point into the query cache
    const handleIncomingTelemetry = (newPoint: TelemetryLatest) => {
      queryClient.setQueryData<TelemetryLatest[]>(
        telemetryKeys.latest(deviceId),
        (oldData) => {
          if (!oldData) return [newPoint];

          // Check if sensor exists in cache
          const existingIndex = oldData.findIndex((p) => p.sensor_code === newPoint.sensor_code);
          
          if (existingIndex > -1) {
            // Replace the old point with the new one
            const updated = [...oldData];
            updated[existingIndex] = newPoint;
            return updated;
          } else {
            // Append new sensor
            return [...oldData, newPoint];
          }
        }
      );
    };

    setIsConnected(true);
    const unsubscribe = wsManager.subscribeTelemetry(deviceId, handleIncomingTelemetry);

    return () => {
      setIsConnected(false);
      unsubscribe();
    };
  }, [deviceId, queryClient]);

  return { isConnected };
};
