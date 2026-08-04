export type WidgetType = string;

export interface WidgetConfig {
  id: string;
  title: string;
  type: WidgetType;
  deviceId: string;
  sensorCode: string;
  timeRange: '15m' | '1h' | '6h' | '24h' | '7d';
  refresh: 'live' | 'static';
  color?: string;
  aggregation?: string;
  [key: string]: any;
}
