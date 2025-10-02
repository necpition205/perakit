import { create } from 'zustand';
import { useAppStore } from './app';
import { alert } from '../components/Alert';

export type MemType = 'ubyte' | 'byte' | 'ushort' | 'short' | 'uint' | 'int' | 'ulong' | 'long' | 'float' | 'double' | 'string' | 'pointer';
export type Protection = 'r--' | 'rw-' | 'r-x' | 'rwx';
export type CompareMode = 'eq' | 'gt' | 'lt' | 'ge' | 'le' | 'between' | 'approx';

export type MemResult = { addr: string };
export type MemObj = { addr: string; type: MemType; label: string; lastValue?: string };

type State = {
  loaded: boolean;
  scanning: boolean;
  protections: Protection[];
  type: MemType;
  cmp: CompareMode;
  value?: number | string;
  value2?: number | string;
  results: MemResult[];
  lib: MemObj[];
  interval: number;
  viewerAddr: string;
  viewerType: MemType;
  viewerSize: number;
};

type Actions = {
  ensureLoaded: () => Promise<void>;
  setProtections: (protections: Protection[]) => void;
  setType: (type: MemType) => void;
  setCmp: (cmp: CompareMode) => void;
  setValue: (value?: number | string) => void;
  setValue2: (value?: number | string) => void;
  newScan: () => void;
  firstScan: () => Promise<void>;
  nextScan: () => Promise<void>;
  clearResults: () => void;
  read: (addr: string, size: number) => Promise<number[]>;
  readTyped: (addr: string, type: MemType) => Promise<any>;
  write: (addr: string, bytes: number[]) => Promise<boolean>;
  writeTyped: (addr: string, type: MemType, value: any) => Promise<boolean>;
  setViewerAddr: (addr: string) => void;
  setViewerType: (type: MemType) => void;
  setViewerSize: (size: number) => void;
  addToLibrary: (entry: { addr: string; type: MemType; label: string }) => boolean;
  removeFromLibrary: (addr: string) => void;
  updateLibraryLabel: (addr: string, label: string) => void;
  refreshLibraryValue: (addr: string) => Promise<string | null>;
  clearLibrary: () => void;
  dispose: () => void;
};

const DEFAULT_PROTECTIONS: Protection[] = ['rw-', 'rwx'];
const DEFAULT_VIEWER_SIZE = 256;
const NUMERIC_TYPES: MemType[] = ['ubyte', 'byte', 'ushort', 'short', 'uint', 'int', 'ulong', 'long', 'float', 'double'];

const INITIAL_STATE: State = {
  loaded: false,
  scanning: false,
  protections: [...DEFAULT_PROTECTIONS],
  type: 'ubyte',
  cmp: 'eq',
  value: undefined,
  value2: undefined,
  results: [],
  lib: [],
  interval: 100,
  viewerAddr: '0x0',
  viewerType: 'byte',
  viewerSize: DEFAULT_VIEWER_SIZE,
};

// Ensure caller is attached before firing RPCs.
function ensureAttached() {
  const attached = useAppStore.getState().attached;
  if (!attached) {
    alert({ title: 'Not attached', description: 'Attach to a process first.', variant: 'warning' });
    throw new Error('No attached process');
  }
  return attached;
}

// Convert user input into a scan-friendly primitive.
function normalizeAddress(input: string) {
  const raw = (input || '').trim();
  if (!raw) throw new Error('Address is required');
  const normalized = raw.startsWith('0x') || raw.startsWith('0X') ? raw : `0x${raw}`;
  try {
    BigInt(normalized);
  } catch {
    throw new Error('Invalid address format');
  }
  return normalized;
}

function coerceScanValue(type: MemType, raw: number | string | undefined) {
  if (raw === undefined || raw === null || raw === '') return undefined;
  if (type === 'string') return String(raw);
  if (type === 'pointer') return String(raw);
  const num = typeof raw === 'number' ? raw : Number(raw);
  if (!Number.isFinite(num)) {
    throw new Error('Numeric value required');
  }
  return num;
}

// Assemble payloads for scan/refine calls based on current state.
function buildScanPayload(state: State) {
  const value = coerceScanValue(state.type, state.value);
  const value2 = state.cmp === 'between' ? coerceScanValue(state.type, state.value2 as any) : undefined;
  if (state.cmp === 'between') {
    if (!NUMERIC_TYPES.includes(state.type)) {
      throw new Error('Between comparison requires numeric types');
    }
    if (typeof value !== 'number' || typeof value2 !== 'number') {
      throw new Error('Between comparison requires numeric values');
    }
  }
  return {
    protections: state.protections.length ? state.protections : DEFAULT_PROTECTIONS,
    type: state.type,
    cmp: state.cmp,
    value,
    value2,
  };
}

export const useMemoryStore = create<State & Actions>((set, get) => ({
  ...INITIAL_STATE,

  async ensureLoaded() {
    ensureAttached();
    if (get().loaded) return;
    try {
      const res = await window.api.frida.agentPing();
      if (res?.ok) {
        set({ loaded: true });
        return;
      }
      throw new Error('Agent did not respond');
    } catch (err: any) {
      set({ loaded: false });
      const msg = err?.message || String(err);
      alert({ title: 'Agent unavailable', description: msg, variant: 'error' });
      throw err;
    }
  },

  setProtections(protections) {
    set({ protections: protections.length ? [...protections] : [...DEFAULT_PROTECTIONS] });
  },

  setType(type) {
    set((state) => {
      const nextCmp = state.cmp === 'between' && !NUMERIC_TYPES.includes(type) ? 'eq' : state.cmp;
      return {
        type,
        cmp: nextCmp,
        value2: type === 'string' ? undefined : state.value2,
      };
    });
  },

  setCmp(cmp) {
    const type = get().type;
    if (cmp === 'between' && !NUMERIC_TYPES.includes(type)) {
      alert({ title: 'Invalid comparison', description: 'Between comparison only supports numeric types.', variant: 'warning' });
      return;
    }
    set({ cmp });
  },

  setValue(value) {
    set({ value: value === '' ? undefined : value });
  },

  setValue2(value) {
    set({ value2: value === '' ? undefined : value });
  },

  newScan() {
    set({ results: [], scanning: false });
  },

  async firstScan() {
    ensureAttached();
    await get().ensureLoaded();
    const state = get();
    let payload;
    try {
      payload = buildScanPayload(state);
    } catch (err: any) {
      alert({ title: 'Scan value error', description: err?.message || String(err), variant: 'warning' });
      return;
    }

    set({ scanning: true });
    try {
      const hits = await window.api.frida.mem.scan(payload);
      set({ results: hits.map((addr: string) => ({ addr })), scanning: false });
    } catch (err: any) {
      set({ scanning: false });
      const msg = err?.message || String(err);
      alert({ title: 'Scan failed', description: msg, variant: 'error' });
    }
  },

  async nextScan() {
    ensureAttached();
    await get().ensureLoaded();
    const state = get();
    if (!state.results.length) {
      alert({ title: 'No previous scan', description: 'Run first scan before refine.', variant: 'info' });
      return;
    }

    let payload;
    try {
      payload = buildScanPayload(state);
    } catch (err: any) {
      alert({ title: 'Refine value error', description: err?.message || String(err), variant: 'warning' });
      return;
    }

    set({ scanning: true });
    try {
      const refined = await window.api.frida.mem.refine(state.results.map(r => r.addr), payload);
      set({ results: refined.map((addr: string) => ({ addr })), scanning: false });
    } catch (err: any) {
      set({ scanning: false });
      const msg = err?.message || String(err);
      alert({ title: 'Refine failed', description: msg, variant: 'error' });
    }
  },

  clearResults() {
    set({ results: [] });
  },

  async read(addr, size) {
    await get().ensureLoaded();
    try {
      const normalized = normalizeAddress(addr);
      return await window.api.frida.mem.read(normalized, size >>> 0);
    } catch (err: any) {
      const msg = err?.message || String(err);
      alert({ title: 'Read failed', description: msg, variant: 'error' });
      throw err;
    }
  },

  async readTyped(addr, type) {
    await get().ensureLoaded();
    try {
      const normalized = normalizeAddress(addr);
      return await window.api.frida.mem.readTyped(normalized, type);
    } catch (err: any) {
      const msg = err?.message || String(err);
      alert({ title: 'Typed read failed', description: msg, variant: 'error' });
      throw err;
    }
  },

  async write(addr, bytes) {
    await get().ensureLoaded();
    try {
      const normalized = normalizeAddress(addr);
      return await window.api.frida.mem.write(normalized, bytes);
    } catch (err: any) {
      const msg = err?.message || String(err);
      alert({ title: 'Write failed', description: msg, variant: 'error' });
      throw err;
    }
  },

  async writeTyped(addr, type, value) {
    await get().ensureLoaded();
    try {
      const normalized = normalizeAddress(addr);
      return await window.api.frida.mem.writeTyped(normalized, type, value);
    } catch (err: any) {
      const msg = err?.message || String(err);
      alert({ title: 'Typed write failed', description: msg, variant: 'error' });
      throw err;
    }
  },

  setViewerAddr(addr) {
    set({ viewerAddr: addr });
  },

  setViewerType(type) {
    set({ viewerType: type });
  },

  setViewerSize(size) {
    if (!Number.isFinite(size) || size <= 0) {
      alert({ title: 'Invalid size', description: 'Viewer size must be a positive number.', variant: 'warning' });
      return;
    }
    set({ viewerSize: Math.floor(size) });
  },

  addToLibrary(entry) {
    try {
      const addr = normalizeAddress(entry.addr);
      const label = (entry.label || '').trim();
      if (!label) throw new Error('Label is required');
      let next: MemObj[] = [];
      set((state) => {
        if (state.lib.some(item => item.addr === addr)) {
          throw new Error('Address already exists in library');
        }
        next = [...state.lib, { addr, type: entry.type, label }];
        return { lib: next };
      });
      return true;
    } catch (err: any) {
      const msg = err?.message || String(err);
      alert({ title: 'Save failed', description: msg, variant: 'error' });
      return false;
    }
  },

  removeFromLibrary(addr) {
    try {
      const normalized = normalizeAddress(addr);
      set(state => ({ lib: state.lib.filter(item => item.addr !== normalized) }));
    } catch (err: any) {
      const msg = err?.message || String(err);
      alert({ title: 'Remove failed', description: msg, variant: 'error' });
    }
  },

  updateLibraryLabel(addr, label) {
    try {
      const normalized = normalizeAddress(addr);
      const trimmed = (label || '').trim();
      if (!trimmed) throw new Error('Label cannot be empty');
      set(state => ({
        lib: state.lib.map(item => item.addr === normalized ? { ...item, label: trimmed } : item)
      }));
    } catch (err: any) {
      const msg = err?.message || String(err);
      alert({ title: 'Rename failed', description: msg, variant: 'error' });
    }
  },

  async refreshLibraryValue(addr) {
    try {
      const normalized = normalizeAddress(addr);
      const entry = get().lib.find(item => item.addr === normalized);
      if (!entry) throw new Error('Library entry not found');
      const value = await get().readTyped(normalized, entry.type);
      const pretty = value === null || value === undefined ? '' : typeof value === 'object' ? JSON.stringify(value) : String(value);
      set(state => ({
        lib: state.lib.map(item => item.addr === normalized ? { ...item, lastValue: pretty } : item)
      }));
      return pretty;
    } catch (err) {
      return null;
    }
  },

  clearLibrary() {
    set({ lib: [] });
  },

  dispose() {
    set({ ...INITIAL_STATE });
  },
}));

// Simple helper to restore the store for tests and manual resets.
export function resetMemoryStore() {
  useMemoryStore.setState({
    ...INITIAL_STATE,
    protections: [...DEFAULT_PROTECTIONS],
  });
}
