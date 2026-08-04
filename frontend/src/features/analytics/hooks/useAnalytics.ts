import { useQuery } from '@tanstack/react-query';
import { analyticsApi } from '../api/analytics';

const REFRESH_INTERVAL = 30000; // 30 seconds

export const usePlatformOverview = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['analytics', 'overview'],
    queryFn: analyticsApi.getOverview,
    refetchInterval: REFRESH_INTERVAL,
    enabled,
  });
};

export const useLiveStatus = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['analytics', 'live-status'],
    queryFn: analyticsApi.getLiveStatus,
    refetchInterval: REFRESH_INTERVAL,
    enabled,
  });
};

export const useAlertAnalytics = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['analytics', 'alerts'],
    queryFn: analyticsApi.getAlerts,
    refetchInterval: REFRESH_INTERVAL,
    enabled,
  });
};

export const useRuleAnalytics = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['analytics', 'rules'],
    queryFn: analyticsApi.getRules,
    refetchInterval: REFRESH_INTERVAL,
    enabled,
  });
};

export const useSensorActivity = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['analytics', 'sensors'],
    queryFn: analyticsApi.getSensors,
    refetchInterval: REFRESH_INTERVAL,
    enabled,
  });
};

export const useTelemetryTrends = (enabled: boolean = true) => {
  return useQuery({
    queryKey: ['analytics', 'trends'],
    queryFn: analyticsApi.getTrends,
    refetchInterval: REFRESH_INTERVAL,
    enabled,
  });
};
