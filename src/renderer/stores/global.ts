import { create } from "zustand";

type GlobalStore = {
  tab: string;
  setTab: (tab: string) => void;
}

export const useGlobalStore = create<GlobalStore>((set) => ({
  tab: "attach",
  setTab: (tab) => set({ tab }),
}));