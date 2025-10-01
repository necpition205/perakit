import type { Session, Script, Device } from 'frida';
import { EventEmitter } from 'events';
let frida: typeof import('frida') | null = null;

function ensureFrida() {
  if (!frida) {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    frida = require('frida');
  }
  return frida!;
}

export type AttachTarget = { pid?: number; name?: string };

export class FridaService {
  private session: Session | null = null;
  private script: Script | null = null;
  public readonly events = new EventEmitter();

  async listDevices() {
    const devices = await ensureFrida().getDeviceManager().enumerateDevices();
    return devices.map(d => ({ id: d.id, name: d.name, type: d.type }));
  }

  async listProcesses(deviceId?: string) {
    const F = ensureFrida();
    const device: Device = deviceId
      ? await F.getDevice(deviceId)
      : await F.getLocalDevice();
    const processes = await device.enumerateProcesses();
    return processes.map(p => ({ pid: p.pid, name: p.name }));
  }

  async attach(target: AttachTarget, deviceId?: string) {
    const F = ensureFrida();
    const device: Device = deviceId
      ? await F.getDevice(deviceId)
      : await F.getLocalDevice();

    if (this.session) await this.detach();

    if (target.pid != null) this.session = await device.attach(target.pid);
    else if (target.name) this.session = await device.attach(target.name);
    else throw new Error('attach requires pid or name');

    this.session.detached.connect((reason: any) => {
      // release references to avoid leaks on remote detach
      this.script = null;
      this.session = null;
      try {
        this.events.emit('detached', serializeReason(reason));
      } catch {}
    });

    return { attached: true };
  }

  async createScript(source: string) {
    if (!this.session) throw new Error('No active session');
    if (this.script) await this.script.unload();
    this.script = await this.session.createScript(source);
    await this.script.load();
    return { loaded: true };
  }

  async rpc<T = unknown>(method: string, ...args: any[]): Promise<T> {
    if (!this.script) throw new Error('No active script');
    return await (this.script as any).exports[method](...args);
  }

  async detach() {
    if (this.script) {
      try { await this.script.unload(); } catch {}
      this.script = null;
    }
    if (this.session) {
      try { await this.session.detach(); } catch {}
      this.session = null;
    }
    try { this.events.emit('detached', 'manual'); } catch {}
    return { detached: true };
  }
}

export const fridaService = new FridaService();

function serializeReason(reason: any): string {
  if (!reason) return 'unknown';
  try {
    if (typeof reason === 'string') return reason;
    if (typeof reason === 'object') {
      const msg = (reason as any).message || (reason as any).reason || JSON.stringify(reason);
      return msg || 'unknown';
    }
    return String(reason);
  } catch {
    return 'unknown';
  }
}
