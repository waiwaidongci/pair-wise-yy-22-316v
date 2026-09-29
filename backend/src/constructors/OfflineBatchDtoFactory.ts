import type { OfflineBatch } from "../models/OfflineBatch";
import type { OfflineBatchPayload } from "../types/OfflineBatchPayload";

// 平板默认离线批次表单：按批次号与方案基线修订号上报。
export const createDefaultOfflineBatchPayload = (
  overrides: Partial<OfflineBatchPayload> = {}
): OfflineBatchPayload => ({
  batch_no: "",
  plan_id: 1,
  device_id: "tablet-01",
  operator_id: 1,
  base_revision_no: 1,
  plan_patch: {},
  steps: [],
  images: [],
  captured_at: new Date().toISOString(),
  ...overrides
});

export const createOfflineBatchResponse = (row: OfflineBatch) => ({
  id: row.id,
  batch_no: row.batch_no,
  plan_id: row.plan_id,
  device_id: row.device_id,
  operator_id: row.operator_id,
  base_revision_no: row.base_revision_no,
  plan_patch: row.plan_patch,
  steps: row.steps,
  images: row.images,
  status: row.status,
  attempts: row.attempts,
  result_id: row.result_id,
  last_error: row.last_error,
  received_at: row.received_at,
  captured_at: row.captured_at
});
