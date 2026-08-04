/**
 * Exponential backoff strategy for WebSocket reconnection.
 */
export class ReconnectionManager {
  private initialDelay: number;
  private maxDelay: number;
  private currentDelay: number;
  private timeoutId: ReturnType<typeof setTimeout> | null = null;
  private isConnecting: boolean = false;

  constructor(initialDelay = 1000, maxDelay = 30000) {
    this.initialDelay = initialDelay;
    this.maxDelay = maxDelay;
    this.currentDelay = initialDelay;
  }

  public schedule(callback: () => void) {
    if (this.isConnecting) return;
    this.isConnecting = true;

    this.timeoutId = setTimeout(() => {
      this.isConnecting = false;
      callback();
      this.increaseDelay();
    }, this.currentDelay);
  }

  public reset() {
    this.currentDelay = this.initialDelay;
    this.isConnecting = false;
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }

  private increaseDelay() {
    this.currentDelay = Math.min(this.currentDelay * 1.5, this.maxDelay);
  }
}
