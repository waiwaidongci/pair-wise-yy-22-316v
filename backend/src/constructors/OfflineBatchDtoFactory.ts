export const createOfflineBatchDto = (overrides: Record<string, unknown> = {}) => ({
  id: 1,
  batch_no: "BATCH-2026-001",
  plan_id: 1,
  base_revision: 1,
  status: "PENDING",
  payload: { steps: [], images: [] },
  created_by: 1,
  created_at: "2026-09-20T09:00:00Z",
  merged_at: null,
  result: null,
  conflict_details: null,
  retry_count: 0,
  ...overrides
});
