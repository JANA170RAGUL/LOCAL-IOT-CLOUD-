export interface DeviceConnection {
  id: string;
  device_id: string;
  connection_type: string;
  host: string;
  port: number;
  username: string;
  authentication_type: string;
  credential_ref?: string;
  host_key_verified: boolean;
  is_active: boolean;
  last_tested_at?: string;
  last_test_status?: string;
  last_test_message?: string;
  created_at: string;
  updated_at: string;
}

export interface DeviceConnectionCreate {
  connection_type?: string;
  host: string;
  port?: number;
  username: string;
  authentication_type?: string;
  credential_ref?: string;
  host_key_verified?: boolean;
}

export interface DeviceConnectionUpdate {
  connection_type?: string;
  host?: string;
  port?: number;
  username?: string;
  authentication_type?: string;
  credential_ref?: string;
  host_key_verified?: boolean;
  is_active?: boolean;
}

export interface ConnectionTestResponse {
  success: boolean;
  message: string;
  connected_at?: string;
  latency_ms?: number;
}

export interface DeviceAgent {
  id?: string;
  device_id: string;
  agent_name?: string;
  agent_version?: string;
  status?: string;
  service_status?: string;
  platform?: string;
  architecture?: string;
  installed?: boolean;
  last_seen?: string;
  last_seen_at?: string;
  installed_at?: string;
}

export interface HardwareComponent {
  id?: string;
  device_id?: string;
  interface_type?: string;
  component_type?: string;
  name?: string;
  component_name?: string;
  address?: string;
  address_or_pin?: string;
  manufacturer?: string;
  model?: string;
  status?: string;
  discovery_status?: string;
  details?: Record<string, any>;
  metadata_json?: Record<string, any>;
  discovered_at?: string;
}

export interface HardwareDiscoveryResponse {
  device_id: string;
  discovered_count: number;
  components: HardwareComponent[];
  timestamp: string;
}

export interface ProvisioningStep {
  step_name: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | string;
  message?: string;
  started_at?: string;
  completed_at?: string;
}

export interface ProvisioningJob {
  id: string;
  device_id: string;
  job_type: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | string;
  progress_percent: number;
  steps: ProvisioningStep[];
  error_message?: string;
  created_at: string;
  updated_at: string;
}
