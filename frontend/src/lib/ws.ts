import { LiveStreamPacket } from './types';

type PacketListener = (packet: LiveStreamPacket) => void;
type StatusListener = (connected: boolean) => void;

class LiveWebSocketClient {
  private socket: WebSocket | null = null;
  private url: string;
  private packetListeners: Set<PacketListener> = new Set();
  private statusListeners: Set<StatusListener> = new StatusListenerSet();
  private reconnectTimeout: any = null;
  private reconnectDelay: number = 1000;
  private shouldReconnect: boolean = true;

  constructor(url: string = 'ws://localhost:8000/ws/live') {
    this.url = url;
  }

  public connect() {
    this.shouldReconnect = true;
    if (this.socket && (this.socket.readyState === WebSocket.OPEN || this.socket.readyState === WebSocket.CONNECTING)) {
      return;
    }

    try {
      this.socket = new WebSocket(this.url);

      this.socket.onopen = () => {
        this.reconnectDelay = 1000;
        this.notifyStatus(true);
      };

      this.socket.onmessage = (event) => {
        try {
          const packet: LiveStreamPacket = JSON.parse(event.data);
          this.packetListeners.forEach((listener) => listener(packet));
        } catch (e) {
          console.error('Failed to parse WebSocket packet', e);
        }
      };

      this.socket.onclose = () => {
        this.notifyStatus(false);
        if (this.shouldReconnect) {
          this.scheduleReconnect();
        }
      };

      this.socket.onerror = (err) => {
        console.warn('WebSocket encountered error:', err);
        this.socket?.close();
      };
    } catch (e) {
      this.scheduleReconnect();
    }
  }

  private scheduleReconnect() {
    clearTimeout(this.reconnectTimeout);
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectDelay = Math.min(this.reconnectDelay * 1.5, 8000);
      this.connect();
    }, this.reconnectDelay);
  }

  public disconnect() {
    this.shouldReconnect = false;
    clearTimeout(this.reconnectTimeout);
    if (this.socket) {
      this.socket.close();
      this.socket = null;
    }
    this.notifyStatus(false);
  }

  public onPacket(listener: PacketListener) {
    this.packetListeners.add(listener);
    return () => this.packetListeners.delete(listener);
  }

  public onStatusChange(listener: StatusListener) {
    this.statusListeners.add(listener);
    return () => this.statusListeners.delete(listener);
  }

  private notifyStatus(connected: boolean) {
    this.statusListeners.forEach((listener) => listener(connected));
  }
}

class StatusListenerSet extends Set<StatusListener> {}

export const liveWs = new LiveWebSocketClient();
