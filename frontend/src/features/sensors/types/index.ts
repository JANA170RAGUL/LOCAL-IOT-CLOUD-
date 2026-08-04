export const SensorType = {
  TEMPERATURE: "TEMPERATURE",
  HUMIDITY: "HUMIDITY",
  PRESSURE: "PRESSURE",
  SOIL_MOISTURE: "SOIL_MOISTURE",
  SOIL_PH: "SOIL_PH",
  NPK: "NPK",
  VOLTAGE: "VOLTAGE",
  CURRENT: "CURRENT",
  POWER: "POWER",
  FLOW: "FLOW",
  LEVEL: "LEVEL",
  GPS: "GPS",
  CUSTOM: "CUSTOM",
} as const;

export type SensorType = typeof SensorType[keyof typeof SensorType];

export const MeasurementUnit = {
  CELSIUS: "°C",
  FAHRENHEIT: "°F",
  PERCENT: "%",
  PH: "pH",
  PPM: "ppm",
  VOLT: "V",
  AMPERE: "A",
  WATT: "W",
  LITERS_PER_MIN: "L/min",
  METERS: "m",
  KILOGRAMS: "kg",
  SECONDS: "s",
  CUSTOM: "custom",
} as const;

export type MeasurementUnit = typeof MeasurementUnit[keyof typeof MeasurementUnit];

export const DataType = {
  NUMBER: "number",
  BOOLEAN: "boolean",
  STRING: "string",
  JSON: "json",
  GEO: "geo",
} as const;

export type DataType = typeof DataType[keyof typeof DataType];

export interface SensorBase {
  code: string;
  name: string;
  description?: string | null;
  sensor_type?: SensorType;
  unit?: MeasurementUnit | null;
  data_type?: DataType;

  min_value?: number | null;
  max_value?: number | null;
  default_value?: string | null;

  sampling_interval?: number;
  calibration_offset?: number;
  calibration_scale?: number;
}

export interface SensorCreate extends SensorBase {
  status: string;
}

export interface SensorUpdate {
  name?: string;
  description?: string | null;
  sensor_type?: SensorType;
  unit?: MeasurementUnit | null;
  data_type?: DataType;

  min_value?: number | null;
  max_value?: number | null;
  default_value?: string | null;

  sampling_interval?: number;
  calibration_offset?: number;
  calibration_scale?: number;

  status?: string;
}

export interface SensorResponse extends SensorBase {
  id: string;
  device_id: string;
  status: string;
  last_reading_at?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export type Sensor = SensorResponse;

export interface SensorSummary {
  id: string;
  device_id: string;
  code: string;
  name: string;
  status: string;
  sensor_type: SensorType;
  unit?: MeasurementUnit | null;
  is_active: boolean;
}

export interface SensorFilter {
  search?: string;
  status?: string;
  sensor_type?: SensorType;
  page?: number;
  page_size?: number;
}

export interface SensorListResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  items: SensorSummary[];
}
