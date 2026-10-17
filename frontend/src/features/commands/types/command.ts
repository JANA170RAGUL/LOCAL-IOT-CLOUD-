export type CommandStatus =
  | 'QUEUED'
  | 'SENT'
  | 'ACKNOWLEDGED'
  | 'EXECUTED'
  | 'FAILED'
  | 'TIMED_OUT'
  | 'CANCELLED'
  | 'Queued'
  | 'Sent'
  | 'Acknowledged'
  | 'Executed'
  | 'Failed'
  | 'Timed_Out'
  | 'Cancelled';

export interface DeviceCommand {
  id: string;
  device_id: string;
  command_type: string;
  command?: string;
  payload?: any;
  status: CommandStatus;
  attempt_count?: number;
  max_attempts?: number;
  published_at?: string;
  acknowledged_at?: string;
  completed_at?: string;
  expires_at?: string;
  next_retry_at?: string;
  last_error?: string;
  response_message?: string;
  sent_time?: string;
  response_time?: string;
  created_at: string;
  updated_at: string;
}

export interface CommandCreate {
  command_type: string;
  payload?: any;
  expires_in_seconds?: number;
}
