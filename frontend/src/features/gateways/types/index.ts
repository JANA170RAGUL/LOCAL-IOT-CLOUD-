export type GatewayStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'TRIAL' | 'EXPIRED';
export type GatewayProtocol = 'MQTT' | 'HTTP' | 'COAP' | 'WEBSOCKET' | 'MODBUS' | 'OPC_UA';

export interface GatewayBase {
  code: string;
  name: string;
  description?: string;
  location?: string;
  ip_address?: string;
  mac_address?: string;
  firmware_version?: string;
  protocol: GatewayProtocol;
  mqtt_topic?: string;
}

export interface GatewayCreate extends GatewayBase {
  status: GatewayStatus;
}

export interface GatewayUpdate {
  name?: string;
  description?: string;
  location?: string;
  ip_address?: string;
  mac_address?: string;
  firmware_version?: string;
  status?: GatewayStatus;
  protocol?: GatewayProtocol;
  mqtt_topic?: string;
}

export interface GatewayResponse extends GatewayBase {
  id: string;
  project_id: string;
  status: GatewayStatus;
  last_seen?: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export type Gateway = GatewayResponse;

export interface GatewaySummary {
  id: string;
  project_id: string;
  code: string;
  name: string;
  status: GatewayStatus;
  protocol: GatewayProtocol;
  is_active: boolean;
}

export interface GatewayFilter {
  search?: string;
  status?: string;
  protocol?: string;
  page?: number;
  page_size?: number;
}

export interface GatewayListResponse {
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
  items: GatewaySummary[];
}
