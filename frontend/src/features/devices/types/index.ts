export interface DeviceBase {
  code: string;
  name: string;
  description?: string;
  device_type?: string;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  firmware_version?: string;
  hardware_version?: string;
  mac_address?: string;
  ip_address?: string;
}

export interface DeviceCreate extends DeviceBase {
  status: string;
}

export interface DeviceUpdate {
  name?: string;
  description?: string;
  device_type?: string;
  manufacturer?: string;
  model?: string;
  serial_number?: string;
  firmware_version?: string;
  hardware_version?: string;
  mac_address?: string;
  ip_address?: string;
  status?: string;
}

export interface DeviceResponse extends DeviceBase {
  id: string;
  gateway_id: string;
  status: string;
  last_seen?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export type Device = DeviceResponse;

export interface DeviceSummary {
  id: string;
  gateway_id: string;
  code: string;
  name: string;
  status: string;
  device_type?: string;
  is_active: boolean;
}

export interface DeviceFilter {
  search?: string;
  status?: string;
  device_type?: string;
  page?: number;
  page_size?: number;
}

export interface DeviceListResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  items: DeviceSummary[];
}
