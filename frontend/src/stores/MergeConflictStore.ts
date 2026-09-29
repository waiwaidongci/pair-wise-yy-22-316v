import { create } from "zustand";
import { listMergeConflicts } from "../api/OfflineBatch";
import { resolveMergeConflict } from "../api/MergeConflict";
import type { MergeConflict } from "../types/MergeConflict";
import type { MergeConflictResolution } from "../constants/MergeConflictResolution";

type State = {
  conflicts: MergeConflict[];
  loading: boolean;
  load: (batchNo?: string, planId?: number) => Promise<void>;
  resolve: (
    conflictId: number,
    resolution: MergeConflictResolution,
    operatorId: number
  ) => Promise<void>;
};

export const useMergeConflictStore = create<State>((set, get) => ({
  conflicts: [],
  loading: false,
  async load(batchNo, planId) {
    set({ loading: true });
    set({ conflicts: await listMergeConflicts(batchNo, planId), loading: false });
  },
  async resolve(conflictId, resolution, operatorId) {
    await resolveMergeConflict(conflictId, resolution, operatorId);
    set({
      conflicts: get().conflicts.map((row) =>
        row.id === conflictId
          ? {
              ...row,
              status: resolution === "KEEP_OFFLINE" ? "RESOLVED" : "DISCARDED",
              resolution
            }
          : row
      )
    });
  }
}));
