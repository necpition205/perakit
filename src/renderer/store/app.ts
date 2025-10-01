import { create } from 'zustand';

export type TabKey = 'attach' | 'memory' | 'modules' | 'threads' | 'java' | 'objc' | 'code' | 'extension' | 'console';

type Device = { id: string; name: string; type: string };
type Process = { pid: number; name: string };

type State = {
  activeTab: TabKey;
  devices: Device[];
  processes: Process[];
  selectedDeviceId?: string;
  attached?: { pid?: number; name?: string } | null;
  loading: boolean;
  error?: string | null;
};

type Actions = {
  setTab: (tab: TabKey) => void;
  refreshDevices: () => Promise<void>;
  refreshProcesses: (deviceId?: string) => Promise<void>;
  attachTo: (payload: { pid?: number; name?: string }) => Promise<void>;
  detach: () => Promise<void>;
  setSelectedDevice: (id?: string) => void;
};

export const useAppStore = create<State & Actions>((set, get) => ({
  activeTab: 'attach',
  devices: [],
  processes: [],
  attached: null,
  loading: false,
  error: null,

  setTab: (tab) => set({ activeTab: tab }),

  setSelectedDevice: (id) => set({ selectedDeviceId: id }),

  refreshDevices: async () => {
    set({ loading: true, error: null });
    try {
      const list = await window.api.frida.listDevices();
      set({ devices: list, loading: false });
    } catch (e: any) {
      set({ error: e?.message || String(e), loading: false });
    }
  },

  refreshProcesses: async (deviceId) => {
    const id = deviceId ?? get().selectedDeviceId;
    set({ loading: true, error: null });
    try {
      const list = await window.api.frida.listProcesses(id);
      set({ processes: list, loading: false });
    } catch (e: any) {
      set({ error: e?.message || String(e), loading: false });
    }
  },

  attachTo: async (payload) => {
    set({ loading: true, error: null });
    try {
      await window.api.frida.attach({ ...payload, deviceId: get().selectedDeviceId });
      set({ attached: payload, loading: false });
    } catch (e: any) {
      set({ error: e?.message || String(e), loading: false });
    }
  },

  detach: async () => {
    set({ loading: true, error: null });
    try {
      await window.api.frida.detach();
      set({ attached: null, loading: false });
    } catch (e: any) {
      set({ error: e?.message || String(e), loading: false });
    }
  },
}));

