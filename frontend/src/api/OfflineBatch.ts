import type { OfflineBatch, OfflineBatchSubmitPayload } from "../types/OfflineBatch";
import type { BatchSubmitOutcome, MergeConflict, MergeResult } from "../types/MergeConflict";
import { ERROR_MESSAGES } from "../constants/errorMessages";

const endpoint = "/api/offline-batch";

async function parseError(res: Response): Promise<Error> {
  try {
    const body = (await res.json()) as { code?: keyof typeof ERROR_MESSAGES; message?: string };
    return new Error(
      (body.code && ERROR_MESSAGES[body.code]) || body.message || ERROR_MESSAGES.MERGE_FAILED
    );
  } catch {
    return new Error(ERROR_MESSAGES.MERGE_FAILED);
  }
}

// 回馆上报离线批次；同批次号重传时后端沿用首次结果（retransmit=true）。
export async function submitOfflineBatch(payload: OfflineBatchSubmitPayload): Promise<BatchSubmitOutcome> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function listOfflineBatches(): Promise<OfflineBatch[]> {
  const res = await fetch(endpoint);
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function listMergeResults(batchNo?: string): Promise<MergeResult[]> {
  const url = batchNo ? `${endpoint}/results?batchNo=${encodeURIComponent(batchNo)}` : `${endpoint}/results`;
  const res = await fetch(url);
  if (!res.ok) throw await parseError(res);
  return res.json();
}

export async function listMergeConflicts(batchNo?: string, planId?: number): Promise<MergeConflict[]> {
  const params = new URLSearchParams();
  if (batchNo) params.set("batchNo", batchNo);
  if (typeof planId === "number") params.set("planId", String(planId));
  const res = await fetch(`/api/merge-conflict?${params.toString()}`);
  if (!res.ok) throw await parseError(res);
  return res.json();
}
