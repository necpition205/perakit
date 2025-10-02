import { create } from 'zustand';
import MEMORY_AGENT_SOURCE from '../agents/memory';
import { useAppStore } from './app';
import { alert } from '../components/Alerts';

export type MemType = 'ubyte' | 'byte' | 'ushort' | 'short' | 'uint' | 'int' | 'ulong' | 'long' | 'float' | 'double' | 'string' | 'pointer';
export type Protection = 'r--' | 'rw-' | 'r-x' | 'rwx';

export type MemResult = { addr: string };
export type MemBookmark = { addr: string; type: MemType; label?: string };

type State = {
  loaded: boolean; // agent loaded
  scanning: boolean;
  stage: 'idle' | 'first' | 'refined';
  startedAt?: number;
  finishedAt?: number;
  protections: Protection[];
  type: MemType;
  cmp: 'eq' | 'gt' | 'lt' | 'ge' | 'le' | 'between' | 'approx';
  value?: number | string;
  value2?: number;
  decimals: number; // for approx rounding
  tolerance: number; // for approx tolerance
  limit: number;
  results: MemResult[];
  bookmarks: MemBookmark[];
  logs: { ts: number; level: 'info' | 'warn' | 'error'; text: string }[];
};

type Actions = {
  ensureLoaded: () => Promise<void>;
  setProtections: (ps: Protection[]) => void;
  setType: (t: MemType) => void;
  setCmp: (c: State['cmp']) => void;
  setValue: (v?: number | string) => void;
  setValue2: (v?: number) => void;
  setDecimals: (d: number) => void;
  setTolerance: (t: number) => void;
  setLimit: (n: number) => void;
  newScan: () => void;
  firstScan: () => Promise<void>;
  nextScan: () => Promise<void>;
  clearResults: () => void;
  log: (level: 'info' | 'warn' | 'error', text: string) => void;
  clearLogs: () => void;
  read: (addr: string, size: number) => Promise<number[]>;
  readTyped: (addr: string, type: MemType) => Promise<any>;
  write: (addr: string, bytes: number[]) => Promise<boolean>;
  writeTyped: (addr: string, type: MemType, value: any) => Promise<boolean>;
  addBookmark: (b: MemBookmark) => void;
  removeBookmark: (addr: string) => void;
  setBookmarkLabel: (addr: string, label?: string) => void;
  dispose: () => void;
};

export const useMemoryStore = create<State & Actions>((set, get) => ({
  loaded: false,
  scanning: false,
  stage: 'idle',
  startedAt: undefined,
  finishedAt: undefined,
  protections: ['rw-', 'rwx'],
  type: 'int',
  cmp: 'eq',
  value: undefined,
  value2: undefined,
  decimals: 1,
  tolerance: 0,
  limit: 5000,
  results: [],
  bookmarks: [],
  logs: [],

  ensureLoaded: async () => {
    const attached = useAppStore.getState().attached;
    if (!attached) {
      const msg = 'No attached process. Attach before using Memory tools.';
      alert({ title: 'Memory', description: msg, variant: 'warning' });
      throw new Error(msg);
    }
    if (get().loaded) return;
    await window.api.frida.createScript(MEMORY_AGENT_SOURCE);
    set({ loaded: true });
  },
  setProtections: (ps) => set({ protections: ps }),
  setType: (t) => set({ type: t }),
  setCmp: (c) => set({ cmp: c }),
  setValue: (v) => set({ value: v }),
  setValue2: (v) => set({ value2: v }),
  setDecimals: (d) => set({ decimals: d }),
  setTolerance: (t) => set({ tolerance: t }),
  setLimit: (n) => set({ limit: n }),

  newScan: () => set({ results: [], stage: 'idle', logs: [], startedAt: undefined, finishedAt: undefined }),
  firstScan: async () => {
    try {
      await get().ensureLoaded();
    } catch {
      return;
    }
    // Validate input value
    const { type, value } = get();
    const needsValue = true; // all current compares require a value
    const invalid = type === 'string' ? (!value || String(value).length === 0) : (value === undefined || value === null || Number.isNaN(Number(value)));
    if (needsValue && invalid) {
      alert({ title: 'Memory', description: 'Please input a valid value before scanning.', variant: 'warning' });
      get().log('warn', 'Scan aborted: missing or invalid value');
      return;
    }
    // Log ranges summary
    try {
      const protections = get().protections;
      const ranges: { base: string; size: number }[] = await window.api.frida.rpc('mem_ranges', { protections });
      const total = ranges.reduce((acc, r) => acc + (r.size >>> 0), 0);
      get().log('info', `Scanning ${ranges.length} ranges (~${(total / (1024*1024)).toFixed(2)} MB)`);
    } catch (e: any) {
      get().log('warn', `Range enumeration failed: ${e?.message || String(e)}`);
    }
    set({ scanning: true, startedAt: Date.now(), finishedAt: undefined });
    try {
      const { protections, type, cmp, value, value2, decimals, tolerance, limit } = get();
      const res: string[] = await window.api.frida.rpc('mem_scan', { protections, type, cmp, value, value2, decimals, tolerance, limit });
      set({ results: res.map(addr => ({ addr })), scanning: false, stage: 'first', finishedAt: Date.now() });
      get().log('info', `First Scan hits: ${res.length}`);
    } catch (e) {
      set({ scanning: false, finishedAt: Date.now() });
      get().log('error', `First Scan error: ${ (e as any)?.message || String(e) }`);
      throw e;
    }
  },
  nextScan: async () => {
    try { await get().ensureLoaded(); } catch { return; }
    const cur = get().results.map(r => r.addr);
    if (cur.length === 0) return;
    set({ scanning: true, startedAt: Date.now(), finishedAt: undefined });
    try {
      const { type, cmp, value, value2, decimals, tolerance } = get();
      const res: string[] = await window.api.frida.rpc('mem_refine', cur, { type, cmp, value, value2, decimals, tolerance });
      set({ results: res.map(addr => ({ addr })), scanning: false, stage: 'refined', finishedAt: Date.now() });
      get().log('info', `Next Scan hits: ${res.length}`);
    } catch (e) {
      set({ scanning: false, finishedAt: Date.now() });
      get().log('error', `Next Scan error: ${ (e as any)?.message || String(e) }`);
      throw e;
    }
  },
  clearResults: () => set({ results: [], stage: 'idle', startedAt: undefined, finishedAt: undefined }),

  read: async (addr, size) => {
    try { await get().ensureLoaded(); } catch { return []; }
    const bytes: number[] = await window.api.frida.rpc('mem_read', addr, size);
    return bytes;
  },
  readTyped: async (addr, type) => {
    try { await get().ensureLoaded(); } catch { return null as any; }
    return await window.api.frida.rpc('mem_readtyped', addr, type);
  },
  write: async (addr, bytes) => {
    try { await get().ensureLoaded(); } catch { return false; }
    return await window.api.frida.rpc('mem_write', addr, bytes);
  },
  writeTyped: async (addr, type, value) => {
    try { await get().ensureLoaded(); } catch { return false; }
    return await window.api.frida.rpc('mem_writetyped', addr, type, value);
  },
  addBookmark: (b) => set({ bookmarks: [...get().bookmarks, b] }),
  removeBookmark: (addr) => set({ bookmarks: get().bookmarks.filter(b => b.addr !== addr) }),
  setBookmarkLabel: (addr, label) => set({ bookmarks: get().bookmarks.map(b => b.addr === addr ? { ...b, label } : b) }),
  dispose: () => set({ loaded: false, scanning: false, results: [], bookmarks: [], stage: 'idle', startedAt: undefined, finishedAt: undefined, logs: [] }),
  log: (level, text) => set({ logs: [...get().logs, { ts: Date.now(), level, text }] }),
  clearLogs: () => set({ logs: [] })
}));
