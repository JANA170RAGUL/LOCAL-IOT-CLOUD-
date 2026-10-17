import api from '../api/axios';
import { getWebSocketBaseUrl } from '../../config/api';
import { ReconnectionManager } from './reconnect';
import { SubscriptionManager } from './subscriptions';

const WS_BASE_URL = getWebSocketBaseUrl();

class WebSocketManager {
  private sockets: Map<string, WebSocket> = new Map();
  private reconnectManagers: Map<string, ReconnectionManager> = new Map();
  public subscriptions: SubscriptionManager = new SubscriptionManager();

  /**
   * Connects to a specific telemetry stream endpoint with a fresh WebSocket ticket.
   */
  public connectTelemetry(deviceId: string) {
    const topic = `telemetry:stream:${deviceId}`;
    const getUrl = async () => {
      try {
        const res = await api.post('/telemetry/ws-ticket', { sensor_id: deviceId });
        const ticket = res.data.ticket;
        return `${WS_BASE_URL}/devices/${deviceId}/telemetry/stream?ticket=${encodeURIComponent(ticket)}`;
      } catch (err) {
        console.error(`[WS] Failed to obtain WS ticket for telemetry stream ${deviceId}`, err);
        return `${WS_BASE_URL}/devices/${deviceId}/telemetry/stream`;
      }
    };
    this._ensureConnection(topic, getUrl);
  }

  /**
   * Connects to a specific alerts stream endpoint.
   */
  public connectAlerts(projectId: string) {
    const topic = `alerts:stream:${projectId}`;
    const getUrl = async () => `${WS_BASE_URL}/projects/${projectId}/alerts/stream`;
    this._ensureConnection(topic, getUrl);
  }

  private _ensureConnection(topic: string, getUrl: () => Promise<string>) {
    if (this.sockets.has(topic)) {
      return;
    }

    if (!this.reconnectManagers.has(topic)) {
      this.reconnectManagers.set(topic, new ReconnectionManager());
    }

    this._connectInternal(topic, getUrl);
  }

  private async _connectInternal(topic: string, getUrl: () => Promise<string>) {
    console.log(`[WS] Obtaining ticket and connecting to ${topic}...`);
    const url = await getUrl();
    const ws = new WebSocket(url);
    this.sockets.set(topic, ws);

    ws.onopen = () => {
      console.log(`[WS] Connected to ${topic}`);
      const rm = this.reconnectManagers.get(topic);
      if (rm) rm.reset();
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        this.subscriptions.publish(topic, data);
      } catch (e) {
        console.error(`[WS] Failed to parse message on ${topic}`, event.data);
      }
    };

    ws.onclose = (event) => {
      console.warn(`[WS] Disconnected from ${topic}`, event.code, event.reason);
      this.sockets.delete(topic);

      if (this.subscriptions.hasTopic(topic)) {
        const rm = this.reconnectManagers.get(topic);
        if (rm) {
          rm.schedule(() => this._connectInternal(topic, getUrl));
        }
      }
    };

    ws.onerror = (error) => {
      console.error(`[WS] Error on ${topic}`, error);
    };
  }

  /**
   * Disconnects a specific topic entirely, preventing reconnects.
   */
  public disconnectTopic(topic: string) {
    if (this.sockets.has(topic)) {
      const ws = this.sockets.get(topic)!;
      ws.close();
      this.sockets.delete(topic);
    }
    
    if (this.reconnectManagers.has(topic)) {
      this.reconnectManagers.get(topic)!.reset();
      this.reconnectManagers.delete(topic);
    }
  }

  public disconnectTelemetry(deviceId: string) {
    this.disconnectTopic(`telemetry:stream:${deviceId}`);
  }

  public disconnectAlerts(projectId: string) {
    this.disconnectTopic(`alerts:stream:${projectId}`);
  }

  /**
   * Helper to subscribe to a device's telemetry stream.
   * Auto-connects if not already connected.
   */
  public subscribeTelemetry(deviceId: string, callback: (data: any) => void) {
    const topic = `telemetry:stream:${deviceId}`;
    this.subscriptions.subscribe(topic, callback);
    this.connectTelemetry(deviceId);

    return () => {
      this.subscriptions.unsubscribe(topic, callback);
      if (!this.subscriptions.hasTopic(topic)) {
        this.disconnectTelemetry(deviceId);
      }
    };
  }

  /**
   * Helper to subscribe to a project's alerts stream.
   * Auto-connects if not already connected.
   */
  public subscribeAlerts(projectId: string, callback: (data: any) => void) {
    const topic = `alerts:stream:${projectId}`;
    this.subscriptions.subscribe(topic, callback);
    this.connectAlerts(projectId);

    return () => {
      this.subscriptions.unsubscribe(topic, callback);
      if (!this.subscriptions.hasTopic(topic)) {
        this.disconnectAlerts(projectId);
      }
    };
  }
}

// Export singleton instance
export const wsManager = new WebSocketManager();
