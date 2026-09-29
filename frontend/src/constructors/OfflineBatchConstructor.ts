import type { OfflineBatch, OfflineBatchSubmitPayload } from "../types/OfflineBatch";

// 平板离线批次默认表单：修复师在现场先记录，回馆再上报。
export const createDefaultOfflineBatch = (
  overrides: Partial<OfflineBatchSubmitPayload> = {}
): OfflineBatchSubmitPayload => ({
  batch_no: "",
  plan_id: 1,
  device_id: "tablet-01",
  operator_id: 1,
  base_revision_no: 1,
  base_plan: {},
  plan_patch: {},
  steps: [],
  images: [],
  ...overrides
});

export const createOfflineBatchForm = createDefaultOfflineBatch;

export const createOfflineBatchResponse = (row: OfflineBatch): OfflineBatch => ({ ...row });
