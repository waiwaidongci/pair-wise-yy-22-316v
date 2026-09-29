import type { MergeResult } from "../models/MergeResult";
import { createMergeConflictResponse } from "./MergeConflictDtoFactory";

// 重传沿用首次结果：响应里 retransmit=true 表示本次返回的是首次归并结果。
export const createMergeResultResponse = (row: MergeResult) => ({
  id: row.id,
  batch_no: row.batch_no,
  plan_id: row.plan_id,
  base_revision_no: row.base_revision_no,
  merged_revision_no: row.merged_revision_no,
  status: row.status,
  applied_fields: row.applied_fields,
  applied_step_ids: row.applied_step_ids,
  applied_image_versions: row.applied_image_versions,
  held_step_count: row.held_step_count,
  held_image_count: row.held_image_count,
  conflicts: row.conflicts.map(createMergeConflictResponse),
  plan_archivable: row.plan_archivable,
  retransmit: row.retransmit,
  created_at: row.created_at
});
