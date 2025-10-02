import { contextBridge, ipcRenderer } from 'electron';

// Optional: lazily require frida in preload to avoid errors if binding missing during early dev
let fridaVersion: string | null = null;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const frida = require('frida');
  fridaVersion = (frida && frida.version) || null;
} catch (e) {
  fridaVersion = null;
}

const fridaApi = {
  listDevices: () => ipcRenderer.invoke('frida:list-devices'),
  listProcesses: (deviceId?: string) => ipcRenderer.invoke('frida:list-processes', deviceId),
  attach: (payload: { pid?: number; name?: string; deviceId?: string }) => ipcRenderer.invoke('frida:attach', payload),
  detach: () => ipcRenderer.invoke('frida:detach'),
  rpc: (method: string, ...args: any[]) => ipcRenderer.invoke('frida:rpc', method, ...args),
  version: () => ipcRenderer.invoke('frida:version'),
  status: () => ipcRenderer.invoke('frida:status'),
  agentPing: () => ipcRenderer.invoke('frida:agent-ping'),
  mem: {
    scan: (opts: any) => ipcRenderer.invoke('frida:rpc', 'mem_scan', opts),
    refine: (addrs: string[], opts: any) => ipcRenderer.invoke('frida:rpc', 'mem_refine', addrs, opts),
    read: (addr: string, size: number) => ipcRenderer.invoke('frida:rpc', 'mem_read', addr, size),
    readTyped: (addr: string, type: string) => ipcRenderer.invoke('frida:rpc', 'mem_readtyped', addr, type),
    write: (addr: string, bytes: ArrayBuffer | number[]) => ipcRenderer.invoke('frida:rpc', 'mem_write', addr, bytes),
    writeTyped: (addr: string, type: string, value: any) => ipcRenderer.invoke('frida:rpc', 'mem_writetyped', addr, type, value),
  }
};

function onGoTab(cb: (index: number) => void) {
  const listener = (_: any, payload: { index: number }) => cb(payload?.index);
  ipcRenderer.on('app:go-tab', listener);
  return () => ipcRenderer.removeListener('app:go-tab', listener);
}

function onFridaDetached(cb: (payload: { reason: string }) => void) {
  const listener = (_: any, payload: { reason: string }) => cb(payload);
  ipcRenderer.on('frida:detached', listener);
  return () => ipcRenderer.removeListener('frida:detached', listener);
}

function onFridaMessage(cb: (payload: any) => void) {
  const listener = (_: any, payload: any) => cb(payload);
  ipcRenderer.on('frida:message', listener);
  return () => ipcRenderer.removeListener('frida:message', listener);
}

contextBridge.exposeInMainWorld('api', {
  platform: process.platform,
  versions: process.versions,
  frida: fridaApi,
  onGoTab,
  onFridaDetached,
  onFridaMessage,
});

declare global {
  interface Window {
    api: {
      platform: NodeJS.Platform;
      versions: Record<string, string>;
      frida: {
        listDevices: () => Promise<Array<{ id: string; name: string; type: string }>>;
        listProcesses: (deviceId?: string) => Promise<Array<{ pid: number; name: string }>>;
        attach: (payload: { pid?: number; name?: string; deviceId?: string }) => Promise<{ attached: boolean }>;
        detach: () => Promise<{ detached: boolean }>;
        rpc: <T = unknown>(method: string, ...args: any[]) => Promise<T>;
        version: () => Promise<string>;
        status: () => Promise<{ attached: boolean; target: { pid?: number; name?: string; deviceId?: string } | null; attachedAt: number | null; masterLoaded: boolean; addonCount: number }>;
        agentPing: () => Promise<{ ok: boolean; version?: string }>;
        mem: {
          scan: (opts: any) => Promise<string[]>;
          refine: (addrs: string[], opts: any) => Promise<string[]>;
          read: (addr: string, size: number) => Promise<number[]>;
          readTyped: (addr: string, type: string) => Promise<any>;
          write: (addr: string, bytes: ArrayBuffer | number[]) => Promise<boolean>;
          writeTyped: (addr: string, type: string, value: any) => Promise<boolean>;
        };
      };
      onGoTab: (cb: (index: number) => void) => () => void;
      onFridaDetached: (cb: (payload: { reason: string }) => void) => () => void;
      onFridaMessage: (cb: (payload: any) => void) => () => void;
    };
  }
}
