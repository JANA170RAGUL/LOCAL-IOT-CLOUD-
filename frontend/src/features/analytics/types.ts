export interface PlatformOverview {
  organizations: number;
  tenants: number;
  users: number;
  projects: number;
  gateways: number;
  devices: number;
  sensors: number;
}

export interface LiveStatus {
  online_devices: number;
  offline_devices: number;
  online_gateways: number;
  offline_gateways: number;
}

export interface AlertAnalytics {
  open: number;
  acknowledged: number;
  resolved: number;
  critical: number;
  warning: number;
}

export interface RuleAnalyticsItem {
  rule: string;
  count: number;
}

export interface SensorActivityItem {
  sensor: string;
  readings: number;
}

export interface TrendDataPoint {
  time: string;
  value: number;
}

export interface TelemetryTrend {
  today: number;
  yesterday: number;
  week: number;
  month: number;
  chart_data: TrendDataPoint[];
}
