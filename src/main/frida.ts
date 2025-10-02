import type { Session, Script, Device } from 'frida';
import { EventEmitter } from 'events';
import fs from 'fs';
import path from 'path';
import { app } from 'electron';
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
  private masterScript: Script | null = null;
  public readonly events = new EventEmitter();
  private currentTarget: { pid?: number; name?: string; deviceId?: string } | null = null;
  private attachedAt: number | null = null;

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

    this.currentTarget = { ...target, deviceId };
    this.attachedAt = Date.now();

    this.session.detached.connect((reason: any) => {
      // release references to avoid leaks on remote detach
      this.masterScript = null;
      this.session = null;
      this.currentTarget = null;
      this.attachedAt = null;
      try {
        this.events.emit('detached', serializeReason(reason));
      } catch {}
    });

    // Load master agent script on attach
    try {
      await this.loadMasterAgent();
    } catch (e) {
      // Non-fatal: features that rely on master may add their own scripts later
      // eslint-disable-next-line no-console
      console.warn('[frida] master agent load failed:', e);
    }

    return { attached: true };
  }

  async rpc<T = unknown>(method: string, ...args: any[]): Promise<T> {
    if (!this.masterScript) throw new Error('No active script');
    const sc: any = this.masterScript as any;
    const fn = sc.exports[method];
    if (typeof fn === 'function') return await fn(...args);
    throw new Error(`RPC method not found: ${method}`);
  }

  async detach() {
    if (this.masterScript) {
      try { await this.masterScript.unload(); } catch {}
      this.masterScript = null;
    }
    if (this.session) {
      try { await this.session.detach(); } catch {}
      this.session = null;
    }
    try { this.events.emit('detached', 'manual'); } catch {}
    return { detached: true };
  }

  status() {
    return {
      attached: !!this.session,
      target: this.currentTarget,
      attachedAt: this.attachedAt,
      masterLoaded: !!this.masterScript,
      addonCount: 0,
    };
  }

  async pingAgent(): Promise<{ ok: boolean; version?: string }> {
    try {
      const res = await this.rpc<string>('version');
      return { ok: true, version: res };
    } catch {
      return { ok: false };
    }
  }

  private resolveMasterAgentPath(): string | null {
    const rel = path.join('agents', 'master.js');
    // packaged
    try {
      if (app && app.isPackaged) {
        const p = path.join(process.resourcesPath, rel);
        if (fs.existsSync(p)) return p;
      }
    } catch {}
    // dev: look relative to project root/dist
    const devCandidates = [
      path.join(__dirname, '..', '..', rel), // dist/main -> project/agents/master.js
      path.join(process.cwd(), rel),
      path.join(process.cwd(), 'resources', rel),
    ];
    for (const p of devCandidates) {
      try { if (fs.existsSync(p)) return p; } catch {}
    }
    return null;
  }

  private async loadMasterAgent() {
    if (!this.session) throw new Error('No active session');
    const p = this.resolveMasterAgentPath();
    if (!p) throw new Error('Master agent not found');
    const source = fs.readFileSync(p, 'utf8');
    const sc = await this.session.createScript(source);
    sc.message.connect((message: any, data: any) => {
      try { this.events.emit('message', { message, data }); } catch {}
    });
    await sc.load();
    this.masterScript = sc;
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
