export type CommandStatus = 'Queued' | 'Sent' | 'Executed' | 'Failed';

export interface DeviceCommand {
  id: string;
  device_id: string;
  command_type: string;
  payload?: any;
  status: CommandStatus;
  sent_time?: string;
  response_time?: string;
  created_at: string;
  updated_at: string;
}

export interface CommandCreate {
  command_type: string;
  payload?: any;
}
