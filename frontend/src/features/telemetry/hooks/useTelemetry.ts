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

    // The callback merges the incoming point into both latest and history query caches
    const handleIncomingTelemetry = (newPoint: any) => {
      // 1. Update latest telemetry cache for KPI / Gauge cards
      queryClient.setQueryData<TelemetryLatest[]>(
        telemetryKeys.latest(deviceId),
        (oldData) => {
          if (!oldData) return [newPoint];
          const existingIndex = oldData.findIndex((p) => p.sensor_code === newPoint.sensor_code);
          if (existingIndex > -1) {
            const updated = [...oldData];
            updated[existingIndex] = newPoint;
            return updated;
          } else {
            return [...oldData, newPoint];
          }
        }
      );

      // 2. Update history telemetry cache for Line, Area, and Bar Chart streaming
      queryClient.setQueriesData<any>(
        { queryKey: telemetryKeys.all },
        (oldData: any, query: any) => {
          const key = query?.queryKey;
          if (key && key[1] === 'history' && key[2] === deviceId && oldData && Array.isArray(oldData.items)) {
            const sensorCodes = key[3]?.sensor_codes;
            if (!sensorCodes || sensorCodes.includes(newPoint.sensor_code)) {
              const formattedPoint = {
                sensor_code: newPoint.sensor_code,
                sensor_type: newPoint.sensor_type || 'sensor',
                value: typeof newPoint.value === 'number' ? newPoint.value : Number(newPoint.value),
                raw_value: newPoint.raw_value ?? newPoint.value,
                timestamp: newPoint.timestamp || new Date().toISOString(),
              };

              // Append incoming point and keep up to 100 live time-series points
              const updatedItems = [...oldData.items, formattedPoint].slice(-100);
              return {
                ...oldData,
                total_points: updatedItems.length,
                items: updatedItems,
              };
            }
          }
          return oldData;
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
