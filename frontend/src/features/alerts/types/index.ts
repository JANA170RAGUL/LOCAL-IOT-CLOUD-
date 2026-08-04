export type AlertSeverity = 'INFO' | 'WARNING' | 'CRITICAL' | 'EMERGENCY';
export type AlertStatus = 'OPEN' | 'ACKNOWLEDGED' | 'RESOLVED' | 'CLOSED';

export interface BackendAlert {
  id: string;
  rule_id: string | null;
  sensor_id: string | null;
  device_id: string | null;
  severity: AlertSeverity;
  title: string;
  message: string;
  status: AlertStatus;
  acknowledged: boolean;
  acknowledged_by: string | null;
  acknowledged_at: string | null;
  resolved: boolean;
  resolved_at: string | null;
  metadata: Record<string, any> | null;
  created_at: string;
  updated_at: string;
}

export interface AlertFilterParams {
  status?: AlertStatus;
  severity?: AlertSeverity;
  acknowledged?: boolean;
  resolved?: boolean;
  search?: string;
  page?: number;
  page_size?: number;
}

export interface AlertListResponse {
  total: number;
  page: number;
  page_size: number;
  items: BackendAlert[];
}
