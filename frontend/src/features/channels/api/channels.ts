import axios from '@/services/api/axios';

export interface ChannelField {
  id?: string;
  field_key: string;
  name: string;
  unit?: string;
  data_type: string;
  description?: string;
}

export interface ChannelApiKey {
  id: string;
  key_type: 'read' | 'write';
  api_key: string;
  created_at: string;
}

export interface Channel {
  id: string;
  name: string;
  description?: string;
  project_id?: string;
  visibility: 'public' | 'private' | 'enterprise';
  metadata_dict?: Record<string, any>;
  owner_id: string;
  created_at: string;
  updated_at: string;
  fields: ChannelField[];
  api_keys: ChannelApiKey[];
}

export interface ChannelCreate {
  name: string;
  description?: string;
  project_id?: string;
  visibility: 'public' | 'private' | 'enterprise';
  metadata_dict?: Record<string, any>;
  fields?: ChannelField[];
}

export interface ChannelFeed {
  created_at: string;
  [key: string]: any;
}

export interface ChannelFeedResponse {
  channel: string;
  feeds: ChannelFeed[];
}

export interface ChannelDashboardMetrics {
  total_messages: number;
  messages_today: number;
  health_status: 'Healthy' | 'Idle' | 'Offline';
  last_write: string | null;
  average_rate_sec: number;
  storage_used_bytes: number;
  api_usage: {
    requests_today: number;
    failed_requests: number;
    invalid_keys: number;
    average_response_time_ms: number;
  };
  data_quality: {
    missing_values: number;
    duplicate_writes: number;
    packet_loss_estimate: string;
  };
}

export interface ImportSummary {
  total: number;
  imported: number;
  skipped: number;
  errors: number;
}

export interface ChannelWebhook {
  id: string;
  name: string;
  target_url: string;
  webhook_type: 'http' | 'slack' | 'discord' | 'teams' | 'email';
  secret_token?: string;
  auth_header?: string;
  is_active: boolean;
  max_retries: number;
  timeout_seconds: number;
  trigger_events: string[];
}

export interface WebhookLog {
  id: string;
  event_type: string;
  http_status: number | null;
  response_time_ms: number | null;
  success: boolean;
  response_body: string | null;
  retry_count: number;
  created_at: string;
}

export const channelsApi = {
  getChannels: async (): Promise<Channel[]> => {
    const response = await axios.get('/channels');
    return response.data;
  },
  getChannel: async (id: string): Promise<Channel> => {
    const response = await axios.get(`/channels/${id}`);
    return response.data;
  },
  createChannel: async (data: ChannelCreate): Promise<Channel> => {
    const response = await axios.post('/channels', data);
    return response.data;
  },
  updateChannel: async (id: string, data: Partial<ChannelCreate>): Promise<Channel> => {
    const response = await axios.put(`/channels/${id}`, data);
    return response.data;
  },
  deleteChannel: async (id: string): Promise<void> => {
    await axios.delete(`/channels/${id}`);
  },
  getChannelFeeds: async (id: string, readKey?: string, results: number = 100): Promise<ChannelFeedResponse> => {
    const response = await axios.get(`/channels/${id}/feeds`, {
      params: { api_key: readKey, results }
    });
    return response.data;
  },
  getChannelDashboard: async (id: string, readKey?: string): Promise<ChannelDashboardMetrics> => {
    const response = await axios.get(`/channels/${id}/dashboard`, {
      params: { api_key: readKey }
    });
    return response.data;
  },
  getLastChannelFeed: async (id: string, readKey?: string): Promise<ChannelFeed> => {
    const response = await axios.get(`/channels/${id}/feeds/last`, {
      params: { api_key: readKey }
    });
    return response.data;
  },
  importChannelData: async (id: string, format: string, file: File, writeKey?: string): Promise<ImportSummary> => {
    const formData = new FormData();
    formData.append('file', file);
    if (writeKey) formData.append('api_key', writeKey);
    const response = await axios.post(`/channels/${id}/import/${format}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
    return response.data;
  },
  exportChannelData: async (id: string, format: string, params: { start?: string, end?: string, fields?: string[], api_key?: string }): Promise<Blob> => {
    const response = await axios.get(`/channels/${id}/export/${format}`, {
      params,
      responseType: 'blob'
    });
    return response.data;
  },
  regenerateApiKey: async (id: string, keyType: 'read' | 'write'): Promise<Channel> => {
    const response = await axios.post(`/channels/${id}/api-keys/${keyType}/regenerate`);
    return response.data;
  },
  getWebhooks: async (channelId: string): Promise<ChannelWebhook[]> => {
    const response = await axios.get(`/channels/${channelId}/webhooks`);
    return response.data;
  },
  createWebhook: async (channelId: string, data: Partial<ChannelWebhook>): Promise<ChannelWebhook> => {
    const response = await axios.post(`/channels/${channelId}/webhooks`, data);
    return response.data;
  },
  updateWebhook: async (channelId: string, webhookId: string, data: Partial<ChannelWebhook>): Promise<ChannelWebhook> => {
    const response = await axios.put(`/channels/${channelId}/webhooks/${webhookId}`, data);
    return response.data;
  },
  deleteWebhook: async (channelId: string, webhookId: string): Promise<void> => {
    await axios.delete(`/channels/${channelId}/webhooks/${webhookId}`);
  },
  testWebhook: async (channelId: string, webhookId: string): Promise<void> => {
    await axios.post(`/channels/${channelId}/webhooks/${webhookId}/test`);
  },
  getWebhookLogs: async (channelId: string, webhookId: string): Promise<WebhookLog[]> => {
    const response = await axios.get(`/channels/${channelId}/webhooks/${webhookId}/logs`);
    return response.data;
  },
  getPublicChannel: async (id: string): Promise<any> => {
    const response = await axios.get(`/channels/public/${id}`);
    return response.data;
  },
  getPublicChannelFeeds: async (id: string, results: number = 100): Promise<{ channel: string, feeds: ChannelFeed[] }> => {
    const response = await axios.get(`/channels/public/${id}/feeds`, {
      params: { results }
    });
    return response.data;
  }
};
