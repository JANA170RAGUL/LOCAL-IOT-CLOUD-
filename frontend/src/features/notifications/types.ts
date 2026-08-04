export interface NotificationResponse {
  id: string;
  user_id: string;
  recipient: string;
  channel: string;
  subject: string;
  body: string;
  status: string;
  retry_count: number;
  error_message?: string;
  sent_at?: string;
  created_at: string;
  updated_at: string;
}

export interface NotificationListResponse {
  total: number;
  items: NotificationResponse[];
}

export interface UserNotificationPreferenceResponse {
  id: string;
  user_id: string;
  channel: string;
  is_enabled: boolean;
  created_at: string;
  updated_at: string;
}

export interface UserNotificationPreferenceUpdate {
  channel: string;
  is_enabled: boolean;
}
