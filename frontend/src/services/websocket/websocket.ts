import { ReconnectionManager } from './reconnect';
import { SubscriptionManager } from './subscriptions';

const WS_BASE_URL = import.meta.env.VITE_WS_API_URL || 'ws://localhost:8000';

class WebSocketManager {
  private sockets: Map<string, WebSocket> = new Map();
  private reconnectManagers: Map<string, ReconnectionManager> = new Map();
  public subscriptions: SubscriptionManager = new SubscriptionManager();

  /**
   * Connects to a specific telemetry stream endpoint.
   */
  public connectTelemetry(deviceId: string) {
    const url = `${WS_BASE_URL}/devices/${deviceId}/telemetry/stream`;
    const topic = `telemetry:stream:${deviceId}`;
    this._ensureConnection(topic, url);
  }

  /**
   * Connects to a specific alerts stream endpoint.
   */
  public connectAlerts(projectId: string) {
    const url = `${WS_BASE_URL}/projects/${projectId}/alerts/stream`;
    const topic = `alerts:stream:${projectId}`;
    this._ensureConnection(topic, url);
  }

  private _ensureConnection(topic: string, url: string) {
    if (this.sockets.has(topic)) {
      return;
    }

    if (!this.reconnectManagers.has(topic)) {
      this.reconnectManagers.set(topic, new ReconnectionManager());
    }

    this._connectInternal(topic, url);
  }

  private _connectInternal(topic: string, url: string) {
    console.log(`[WS] Connecting to ${topic}...`);
    const ws = new WebSocket(url);
    this.sockets.set(topic, ws);

    ws.onopen = () => {
      console.log(`[WS] Connected to ${topic}`);
      const rm = this.reconnectManagers.get(topic);
      if (rm) rm.reset();
    };

    ws.onmessage = (event) => {
      try {
        // Backend currently sends raw JSON text from Redis
        const data = JSON.parse(event.data);
        this.subscriptions.publish(topic, data);
      } catch (e) {
        console.error(`[WS] Failed to parse message on ${topic}`, event.data);
      }
    };

    ws.onclose = (event) => {
      console.warn(`[WS] Disconnected from ${topic}`, event.code, event.reason);
      this.sockets.delete(topic);

      // Attempt reconnection if we still have listeners for this topic
      if (this.subscriptions.hasTopic(topic)) {
        const rm = this.reconnectManagers.get(topic);
        if (rm) {
          rm.schedule(() => this._connectInternal(topic, url));
        }
      }
    };

    ws.onerror = (error) => {
      console.error(`[WS] Error on ${topic}`, error);
      // onclose will trigger right after and handle reconnect
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
