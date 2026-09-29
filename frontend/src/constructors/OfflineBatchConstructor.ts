import type { OfflineBatch } from "../types/OfflineBatch";

export const createDefaultOfflineBatch = (overrides: Partial<OfflineBatch> = {}): OfflineBatch => ({
  id: 1 as never,
  batch_no: "BATCH-2026-001" as never,
  plan_id: 1 as never,
  base_revision: 1 as never,
  status: "PENDING" as never,
  payload: { steps: [], images: [] },
  created_by: 1 as never,
  created_at: "2026-09-20T09:00:00Z" as never,
  merged_at: null,
  result: null,
  conflict_details: null,
  retry_count: 0,
  ...overrides
});

export const createOfflineBatchForm = createDefaultOfflineBatch;
export const createOfflineBatchResponse = createDefaultOfflineBatch;
