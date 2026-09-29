import { create } from "zustand";
import { listOfflineBatch, mergeOfflineBatch, retryOfflineBatch, resolveOfflineBatchConflict } from "../api/OfflineBatch";
import type { OfflineBatch } from "../types/OfflineBatch";

type State = {
  rows: OfflineBatch[];
  loading: boolean;
  load: () => Promise<void>;
  merge: (batchNo: string) => Promise<void>;
  retry: (batchNo: string) => Promise<void>;
  resolve: (batchNo: string, resolution: Record<string, unknown>) => Promise<void>;
};

export const useOfflineBatchStore = create<State>((set, get) => ({
  rows: [],
  loading: false,
  async load() {
    set({ loading: true });
    set({ rows: await listOfflineBatch(), loading: false });
  },
  async merge(batchNo) {
    await mergeOfflineBatch(batchNo);
    await get().load();
  },
  async retry(batchNo) {
    await retryOfflineBatch(batchNo);
    await get().load();
  },
  async resolve(batchNo, resolution) {
    await resolveOfflineBatchConflict(batchNo, resolution);
    await get().load();
  }
}));
