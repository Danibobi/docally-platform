import { create } from "zustand";

type ScanState = {
  url: string;
  prompt: string;
  status: "idle" | "scanning" | "done";
  setScan: (url: string, prompt: string) => void;
  setStatus: (status: ScanState["status"]) => void;
  reset: () => void;
};

export const useScanStore = create<ScanState>((set) => ({
  url: "",
  prompt: "",
  status: "idle",
  setScan: (url, prompt) => set({ url, prompt, status: "scanning" }),
  setStatus: (status) => set({ status }),
  reset: () => set({ url: "", prompt: "", status: "idle" }),
}));
