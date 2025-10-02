/// <reference types="vite/client" />

type FridaDeviceInfo = { id: string; name: string; type: string };
type FridaProcessInfo = { pid: number; name: string };
type FridaStatus = {
  attached: boolean;
  target: { pid?: number; name?: string; deviceId?: string } | null;
  attachedAt: number | null;
  masterLoaded: boolean;
  addonCount: number;
};

type FridaAgentPing = { ok: boolean; version?: string };

type FridaMemApi = {
  scan: (opts: any) => Promise<string[]>;
  refine: (addrs: string[], opts: any) => Promise<string[]>;
  read: (addr: string, size: number) => Promise<number[]>;
  readTyped: (addr: string, type: string) => Promise<any>;
  write: (addr: string, bytes: ArrayBuffer | number[]) => Promise<boolean>;
  writeTyped: (addr: string, type: string, value: any) => Promise<boolean>;
};

type FridaBridge = {
  listDevices: () => Promise<FridaDeviceInfo[]>;
  listProcesses: (deviceId?: string) => Promise<FridaProcessInfo[]>;
  attach: (payload: { pid?: number; name?: string;deviceId?: string }) => Promise<{ attached: boolean }>;
  detach: () => Promise<{ detached: boolean }>;
  rpc: <T = unknown>(method: string, ...args: any[]) => Promise<T>;
  version: () => Promise<string>;
  status: () => Promise<FridaStatus>;
  agentPing: () => Promise<FridaAgentPing>;
  mem: FridaMemApi;
};

declare global {
  interface Window {
    api: {
      platform: string;
      versions: Record<string, string>;
      frida: FridaBridge;
      onGoTab: (cb: (index: number) => void) => () => void;
      onFridaDetached: (cb: (payload: { reason: string }) => void) => () => void;
      onFridaMessage: (cb: (payload: any) => void) => () => void;
    };
  }
}

export {};
