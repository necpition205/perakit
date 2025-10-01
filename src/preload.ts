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
  createScript: (source: string) => ipcRenderer.invoke('frida:create-script', source),
  rpc: (method: string, ...args: any[]) => ipcRenderer.invoke('frida:rpc', method, ...args),
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

contextBridge.exposeInMainWorld('api', {
  platform: process.platform,
  versions: process.versions,
  fridaVersion,
  frida: fridaApi,
  onGoTab,
  onFridaDetached,
});

declare global {
  interface Window {
    api: {
      platform: NodeJS.Platform;
      versions: Record<string, string>;
      fridaVersion: string | null;
      frida: {
        listDevices: () => Promise<Array<{ id: string; name: string; type: string }>>;
        listProcesses: (deviceId?: string) => Promise<Array<{ pid: number; name: string }>>;
        attach: (payload: { pid?: number; name?: string; deviceId?: string }) => Promise<{ attached: boolean }>;
        detach: () => Promise<{ detached: boolean }>;
        createScript: (source: string) => Promise<{ loaded: boolean }>;
        rpc: <T = unknown>(method: string, ...args: any[]) => Promise<T>;
      };
      onGoTab: (cb: (index: number) => void) => () => void;
      onFridaDetached: (cb: (payload: { reason: string }) => void) => () => void;
    };
  }
}
