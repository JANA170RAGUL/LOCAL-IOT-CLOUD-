export const API_BASE_PATH = import.meta.env.VITE_API_BASE_URL || '/api/v1';

export function getWebSocketBaseUrl(): string {
  const configured = import.meta.env.VITE_WS_API_URL;
  if (configured) {
    return configured.replace(/\/$/, '');
  }

  const protocol = typeof window !== 'undefined' && window.location.protocol === 'https:' ? 'wss:' : 'ws:';
  const host = typeof window !== 'undefined' && window.location.host ? window.location.host : 'localhost:8000';
  return `${protocol}//${host}${API_BASE_PATH}`;
}
