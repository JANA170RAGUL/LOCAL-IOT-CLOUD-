/**
 * Manages topics and callbacks for WebSocket messages.
 */
type Listener = (data: any) => void;

export class SubscriptionManager {
  // A map of topic -> array of callbacks
  // e.g. "telemetry:device_123" -> [cb1, cb2]
  private listeners: Map<string, Listener[]> = new Map();

  public subscribe(topic: string, callback: Listener) {
    if (!this.listeners.has(topic)) {
      this.listeners.set(topic, []);
    }
    this.listeners.get(topic)!.push(callback);
  }

  public unsubscribe(topic: string, callback: Listener) {
    if (!this.listeners.has(topic)) return;

    const currentListeners = this.listeners.get(topic)!;
    const filtered = currentListeners.filter((cb) => cb !== callback);
    
    if (filtered.length === 0) {
      this.listeners.delete(topic);
    } else {
      this.listeners.set(topic, filtered);
    }
  }

  public publish(topic: string, data: any) {
    if (!this.listeners.has(topic)) return;
    const currentListeners = this.listeners.get(topic)!;
    currentListeners.forEach((cb) => {
      try {
        cb(data);
      } catch (err) {
        console.error('Error in WebSocket listener callback', err);
      }
    });
  }

  public getTopics(): string[] {
    return Array.from(this.listeners.keys());
  }

  public hasTopic(topic: string): boolean {
    return this.listeners.has(topic);
  }
}
