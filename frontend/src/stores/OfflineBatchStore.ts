import { create } from "zustand";
import { listOfflineBatches, listMergeResults } from "../api/OfflineBatch";
import type { OfflineBatch, OfflineBatchSubmitPayload } from "../types/OfflineBatch";
import type { BatchSubmitOutcome, MergeResult } from "../types/MergeConflict";
import { submitOfflineBatch } from "../api/OfflineBatch";

type State = {
  batches: OfflineBatch[];
  results: MergeResult[];
  loading: boolean;
  message: string;
  load: () => Promise<void>;
  submit: (payload: OfflineBatchSubmitPayload) => Promise<BatchSubmitOutcome>;
  clear: () => void;
};

export const useOfflineBatchStore = create<State>((set) => ({
  batches: [],
  results: [],
  loading: false,
  message: "",
  async load() {
    set({ loading: true });
    try {
      const [batches, results] = await Promise.all([listOfflineBatches(), listMergeResults()]);
      set({ batches, results, loading: false, message: "" });
    } catch (error) {
      set({ loading: false, message: error instanceof Error ? error.message : String(error) });
    }
  },
  async submit(payload) {
    const outcome = await submitOfflineBatch(payload);
    set((state) => ({
      message: outcome.result.retransmit ? "重传批次：沿用首次归并结果" : "归并完成"
    }));
    const [batches, results] = await Promise.all([listOfflineBatches(), listMergeResults()]);
    set({ batches, results });
    return outcome;
  },
  clear() {
    set({ message: "" });
  }
}));
