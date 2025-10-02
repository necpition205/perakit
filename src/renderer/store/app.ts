import { create } from 'zustand';
import { alert } from '../components/Alert';

export type TabKey = 'attach' | 'memory' | 'modules' | 'threads' | 'java' | 'objc' | 'code' | 'extension' | 'console';

type Device = { id: string; name: string; type: string };
type Process = { pid: number; name: string };

type State = {
  activeTab: TabKey;
  devices: Device[];
  processes: Process[];
  selectedDeviceId?: string;
  selectedPid?: number;
  selectedProcessName?: string;
  attached?: { pid?: number; name?: string } | null;
  loading: boolean;
};

type Actions = {
  setTab: (tab: TabKey) => void;
  refreshDevices: () => Promise<void>;
  refreshProcesses: (deviceId?: string) => Promise<void>;
  attachTo: (payload: { pid?: number; name?: string }) => Promise<boolean>;
  detach: () => Promise<void>;
  setSelectedDevice: (id?: string) => void;
  setSelectedProcess: (payload?: { pid?: number; name?: string }) => void;
  handleRemoteDetached: (reason?: string) => void;
};

export const useAppStore = create<State & Actions>((set, get) => ({
  activeTab: 'attach',
  devices: [],
  processes: [],
  attached: null,
  loading: false,

  setTab: (tab) => set({ activeTab: tab }),

  setSelectedDevice: (id) => set({ selectedDeviceId: id, selectedPid: undefined, selectedProcessName: undefined }),
  setSelectedProcess: (payload) => set({ selectedPid: payload?.pid, selectedProcessName: payload?.name }),

  refreshDevices: async () => {
    set({ loading: true });
    try {
      const list = await window.api.frida.listDevices();
      set({ devices: list, loading: false });
    } catch (e: any) {
      const msg = e?.message || String(e);
      set({ loading: false });
      alert({ title: 'Frida API error', description: msg, variant: 'error' });
    }
  },

  refreshProcesses: async (deviceId) => {
    const id = deviceId ?? get().selectedDeviceId;
    set({ loading: true });
    try {
      const list = await window.api.frida.listProcesses(id);
      set({ processes: list, loading: false });
    } catch (e: any) {
      const msg = e?.message || String(e);
      set({ loading: false });
      alert({ title: 'Frida API error', description: msg, variant: 'error' });
    }
  },

  attachTo: async (payload) => {
    // basic validation before hitting IPC
    const pidRaw = payload.pid ?? get().selectedPid;
    const nameRaw = payload.name ?? get().selectedProcessName;
    const pidValid = typeof pidRaw === 'number' && Number.isFinite(pidRaw) && pidRaw > 0;
    const nameValid = typeof nameRaw === 'string' && nameRaw.trim().length > 0;
    const pid = pidValid ? pidRaw : undefined;
    const name = nameValid ? nameRaw.trim() : undefined;
    if (pid == null && !name) {
      const msg = 'Select a process or enter PID/Name.';
      set({ loading: false });
      alert({ title: 'Attach validation', description: msg, variant: 'warning' });
      return false;
    }

    set({ loading: true });
    try {
      await window.api.frida.attach({ pid, name, deviceId: get().selectedDeviceId });
      set({ attached: { pid, name }, loading: false });
      return true;
    } catch (e: any) {
      const msg = e?.message || String(e);
      set({ loading: false });
      alert({ title: 'Attach failed', description: msg, variant: 'error' });
      return false;
    }
  },

  detach: async () => {
    set({ loading: true });
    try {
      await window.api.frida.detach();
      set({ attached: null, loading: false });
      alert({ title: 'Detached', variant: 'info', duration: 2400 });
    } catch (e: any) {
      const msg = e?.message || String(e);
      set({ loading: false });
      alert({ title: 'Detach failed', description: msg, variant: 'error' });
    }
  },
  handleRemoteDetached: (reason) => {
    set({ attached: null });
    alert({ title: 'Session detached', description: reason || 'unknown', variant: 'warning' });
  },
}));
