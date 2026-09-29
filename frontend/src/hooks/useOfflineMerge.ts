import { useCallback, useEffect, useState } from "react";
import { useOfflineBatchStore } from "../stores/OfflineBatchStore";
import { useMergeConflictStore } from "../stores/MergeConflictStore";
import type { OfflineBatchSubmitPayload } from "../types/OfflineBatch";

// 离线批次归并：回馆上报、重传提示、失败重试与冲突清单一站式管理。
export function useOfflineMerge() {
  const { batches, results, loading, message, load, submit } = useOfflineBatchStore();
  const { conflicts, load: loadConflicts } = useMergeConflictStore();
  const [error, setError] = useState("");

  useEffect(() => {
    void load();
    void loadConflicts();
  }, [load, loadConflicts]);

  const sync = useCallback(
    async (payload: OfflineBatchSubmitPayload) => {
      setError("");
      try {
        const outcome = await submit(payload);
        await loadConflicts();
        return outcome;
      } catch (requestError) {
        const text = requestError instanceof Error ? requestError.message : String(requestError);
        setError(text);
        await load();
        return undefined;
      }
    },
    [submit, load, loadConflicts]
  );

  return { batches, results, conflicts, loading, message, error, refresh: load, sync };
}
