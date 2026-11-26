import { EmergencyScenarioId, Esp32TelemetryPayload } from '../types/telemetry';

export type Esp32ConnectionState = 'disconnected' | 'connecting' | 'connected' | 'error';
export type { Esp32TelemetryPayload };

export const SCENARIO_ID_TO_ESP32: Record<EmergencyScenarioId, number> = {
  normal: 1,
  primary_empty: 2,
  auto_switch: 3,
  low_spo2: 4,
  backup_empty: 5,
  both_unavailable: 6,
  reserve_active: 7,
  restoration: 8
};

export const ESP32_TO_SCENARIO_ID: Record<number, EmergencyScenarioId> = {
  1: 'normal',
  2: 'primary_empty',
  3: 'auto_switch',
  4: 'low_spo2',
  5: 'backup_empty',
  6: 'both_unavailable',
  7: 'reserve_active',
  8: 'restoration'
};

interface SyncCallbacks {
  onTelemetry: (payload: Esp32TelemetryPayload) => void;
  onStateChange: (state: Esp32ConnectionState, error?: string) => void;
}

/**
 * Bidirectional ESP32 WebSocket + HTTP REST synchronization client.
 * Matches the ESP32 firmware NetworkServer (Port 80 REST, Port 81 WebSocket)
 * and the Android OxySyncRepository protocol.
 */
class Esp32SyncClient {
  private ws: WebSocket | null = null;
  private host: string = '192.168.4.1';
  private intentionalDisconnect = false;
  private reconnectTimer: number | null = null;
  private callbacks: SyncCallbacks | null = null;

  public connect(host: string, callbacks: SyncCallbacks) {
    this.disconnect();
    this.host = host.trim() || '192.168.4.1';
    this.callbacks = callbacks;
    this.intentionalDisconnect = false;
    this.openSocket();
  }

  private openSocket() {
    if (this.intentionalDisconnect) return;
    this.callbacks?.onStateChange('connecting');

    try {
      const ws = new WebSocket(`ws://${this.host}:81/`);
      this.ws = ws;

      ws.onopen = () => {
        if (this.ws !== ws) return;
        this.callbacks?.onStateChange('connected');
      };

      ws.onmessage = (event) => {
        if (this.ws !== ws) return;
        try {
          const parsed = JSON.parse(event.data) as Esp32TelemetryPayload;
          if (parsed && parsed.primary && parsed.vitals) {
            this.callbacks?.onTelemetry(parsed);
          }
        } catch {
          // Ignore malformed frame
        }
      };

      ws.onerror = () => {
        if (this.ws !== ws) return;
        this.callbacks?.onStateChange('error', `Unable to reach ESP32 at ${this.host}:81`);
      };

      ws.onclose = () => {
        if (this.ws !== ws) return;
        this.ws = null;
        if (!this.intentionalDisconnect) {
          this.callbacks?.onStateChange('error', `Disconnected from ${this.host}; retrying...`);
          this.reconnectTimer = window.setTimeout(() => this.openSocket(), 3000);
        } else {
          this.callbacks?.onStateChange('disconnected');
        }
      };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'WebSocket connection blocked (check HTTP vs HTTPS)';
      this.callbacks?.onStateChange('error', msg);
    }
  }

  public disconnect() {
    this.intentionalDisconnect = true;
    if (this.reconnectTimer !== null) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    if (this.ws) {
      const old = this.ws;
      this.ws = null;
      old.close();
    }
    this.callbacks?.onStateChange('disconnected');
  }

  public async sendCommand(
    endpoint: string,
    body: Record<string, unknown>,
    wsPayload: Record<string, unknown>
  ): Promise<void> {
    try {
      const response = await fetch(`http://${this.host}:80${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      if (response.ok) {
        const data = (await response.json()) as Esp32TelemetryPayload;
        if (data && data.primary) {
          this.callbacks?.onTelemetry(data);
        }
        return;
      }
    } catch {
      // Fallback to active WebSocket command channel
    }

    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(wsPayload));
    }
  }
}

export const esp32Sync = new Esp32SyncClient();
