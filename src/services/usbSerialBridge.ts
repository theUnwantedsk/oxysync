import { Esp32TelemetryPayload, UsbConnectionStatus } from '../types/telemetry';

interface WebSerialPort {
  readable: ReadableStream<Uint8Array> | null;
  writable: WritableStream<Uint8Array> | null;
  open(options: { baudRate: number }): Promise<void>;
  close(): Promise<void>;
  addEventListener?(type: string, listener: EventListener): void;
  removeEventListener?(type: string, listener: EventListener): void;
}

interface NavigatorWithSerial extends Navigator {
  serial?: {
    requestPort(): Promise<WebSerialPort>;
  };
}

export interface UsbSerialCallbacks {
  onStatusChange: (status: UsbConnectionStatus, errorMessage?: string | null) => void;
  onTelemetry: (payload: Esp32TelemetryPayload) => void;
  onLogLine: (direction: 'rx' | 'tx' | 'sys', raw: string) => void;
}

function isTelemetryPayload(data: unknown): data is Esp32TelemetryPayload {
  if (!data || typeof data !== 'object') return false;
  const obj = data as Record<string, unknown>;
  return Boolean(obj.primary && obj.backup && obj.reserve && obj.vitals && typeof obj.activeSource === 'string');
}

class UsbSerialBridgeService {
  private port: WebSerialPort | null = null;
  private reader: ReadableStreamDefaultReader<string> | null = null;
  private readableStreamClosed: Promise<void> | null = null;
  private abortController: AbortController | null = null;
  private writeQueue: Promise<void> = Promise.resolve();
  private isDisconnecting = false;
  private callbacks: UsbSerialCallbacks | null = null;

  public isSupported(): boolean {
    return typeof navigator !== 'undefined' && 'serial' in navigator;
  }

  public async connect(callbacks: UsbSerialCallbacks, baudRate = 115200): Promise<boolean> {
    if (!this.isSupported()) {
      callbacks.onStatusChange(
        'error',
        'Web Serial API is not supported in this browser. Open OXYSYNC 2.0 in Chrome or Edge.'
      );
      return false;
    }

    await this.disconnect();
    this.callbacks = callbacks;
    this.isDisconnecting = false;
    callbacks.onStatusChange('connecting', null);

    try {
      const nav = navigator as NavigatorWithSerial;
      const port = await nav.serial!.requestPort();
      await port.open({ baudRate });
      this.port = port;

      port.addEventListener?.('disconnect', this.handlePortDisconnect);

      this.abortController = new AbortController();
      const textDecoder = new TextDecoderStream();
      if (port.readable) {
        this.readableStreamClosed = port.readable.pipeTo(
          textDecoder.writable as unknown as WritableStream<Uint8Array>,
          { signal: this.abortController.signal }
        );
        this.reader = textDecoder.readable.getReader();
        void this.readLoop();
      }

      callbacks.onStatusChange('connected', null);
      callbacks.onLogLine('sys', `Connected to ESP32 USB Serial @ ${baudRate} baud`);
      await this.sendCommand({ action: 'ping' });
      return true;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to open USB Serial port';
      // User cancelling the browser port picker is not a fatal error
      if (msg.toLowerCase().includes('no port selected') || msg.toLowerCase().includes('cancelled')) {
        callbacks.onStatusChange('disconnected', null);
      } else {
        callbacks.onStatusChange('error', msg);
        callbacks.onLogLine('sys', `USB error: ${msg}`);
      }
      await this.cleanupPort();
      return false;
    }
  }

  private handlePortDisconnect = () => {
    if (this.isDisconnecting) return;
    this.callbacks?.onLogLine('sys', 'ESP32 USB cable disconnected');
    this.callbacks?.onStatusChange('error', 'ESP32 USB device disconnected');
    void this.cleanupPort();
  };

  private async readLoop(): Promise<void> {
    if (!this.reader) return;
    let buffer = '';

    try {
      while (true) {
        const { value, done } = await this.reader.read();
        if (done) break;
        if (!value) continue;

        buffer += value;
        const lines = buffer.split(/\r?\n/);
        buffer = lines.pop() ?? '';

        for (const rawLine of lines) {
          this.handleIncomingLine(rawLine);
        }
      }
    } catch (err) {
      if (!this.isDisconnecting) {
        const msg = err instanceof Error ? err.message : 'USB read error';
        this.callbacks?.onLogLine('sys', `Read interrupted: ${msg}`);
        this.callbacks?.onStatusChange('error', msg);
      }
    } finally {
      if (!this.isDisconnecting) {
        await this.cleanupPort();
      }
    }
  }

  private handleIncomingLine(rawLine: string): void {
    const trimmed = rawLine.trim();
    if (!trimmed) return;

    this.callbacks?.onLogLine('rx', trimmed);

    if (!trimmed.startsWith('{')) return;

    try {
      const parsed = JSON.parse(trimmed) as unknown;
      if (isTelemetryPayload(parsed)) {
        this.callbacks?.onTelemetry(parsed);
      }
    } catch {
      // Ignore partial boot log or malformed line cleanly
    }
  }

  public sendCommand(command: Record<string, unknown>): Promise<boolean> {
    const port = this.port;
    if (!port || !port.writable) {
      return Promise.resolve(false);
    }

    const line = `${JSON.stringify(command)}\n`;
    const encoded = new TextEncoder().encode(line);

    const task = this.writeQueue.then(async () => {
      if (!this.port || !this.port.writable) return false;
      const writer = this.port.writable.getWriter();
      try {
        await writer.write(encoded);
        this.callbacks?.onLogLine('tx', line.trim());
        return true;
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'USB write failed';
        this.callbacks?.onLogLine('sys', `TX error: ${msg}`);
        return false;
      } finally {
        writer.releaseLock();
      }
    });

    this.writeQueue = task.then(() => undefined, () => undefined);
    return task;
  }

  public async disconnect(): Promise<void> {
    if (!this.port && !this.reader) {
      this.callbacks?.onStatusChange('disconnected', null);
      return;
    }
    this.isDisconnecting = true;
    await this.cleanupPort();
    this.callbacks?.onLogLine('sys', 'Disconnected from ESP32 USB Serial');
    this.callbacks?.onStatusChange('disconnected', null);
    this.isDisconnecting = false;
  }

  private async cleanupPort(): Promise<void> {
    const port = this.port;
    this.port = null;

    if (port) {
      port.removeEventListener?.('disconnect', this.handlePortDisconnect);
    }

    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }

    if (this.reader) {
      try {
        await this.reader.cancel();
      } catch {
        // Ignore cancel errors during teardown
      }
      this.reader = null;
    }

    if (this.readableStreamClosed) {
      await this.readableStreamClosed.catch(() => undefined);
      this.readableStreamClosed = null;
    }

    if (port) {
      try {
        await port.close();
      } catch {
        // Ignore close errors if port already physically unplugged
      }
    }
  }
}

export const usbSerialBridge = new UsbSerialBridgeService();
