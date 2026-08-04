export interface Setting {
  id: string;
  category: string;
  key: string;
  value: Record<string, any>;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CategoryUpdateRequest {
  settings: Record<string, any>;
}

export interface AuditLog {
  id: string;
  user_id?: string;
  user_name?: string;
  action: string;
  resource_type?: string;
  resource_id?: string;
  details?: Record<string, any>;
  ip_address?: string;
  created_at: string;
}

export interface AuditLogListResponse {
  total: number;
  items: AuditLog[];
}

export interface ServiceHealth {
  name: string;
  status: 'up' | 'down' | 'degraded';
  details: Record<string, any>;
}

export interface SystemMetrics {
  cpu_percent: number;
  memory_percent: number;
  disk_percent: number;
}

export interface HealthStatusResponse {
  overall_status: string;
  system: SystemMetrics;
  services: ServiceHealth[];
}
