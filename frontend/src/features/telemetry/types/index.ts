export interface TelemetryPoint {
  sensor_code: string;
  sensor_type: string;
  value: number | boolean | string;
  raw_value: number | boolean | string;
  timestamp: string;
}

export interface TelemetryLatest extends TelemetryPoint {
  data_type: string;
}

export interface TelemetryHistory {
  device_id: string;
  sensor_codes: string[];
  total_points: number;
  items: TelemetryPoint[];
}

export interface TelemetryHistoryParams {
  start_time?: string;
  end_time?: string;
  sensor_codes?: string[];
  aggregation?: string;
  window?: string;
}
