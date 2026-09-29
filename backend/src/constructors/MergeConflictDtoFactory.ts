import type { MergeConflict } from "../models/MergeConflict";

export const createMergeConflictResponse = (row: MergeConflict) => ({
  id: row.id,
  batch_no: row.batch_no,
  plan_id: row.plan_id,
  conflict_type: row.conflict_type,
  field_name: row.field_name,
  target_id: row.target_id,
  base_value: row.base_value,
  central_value: row.central_value,
  offline_value: row.offline_value,
  status: row.status,
  resolution: row.resolution,
  resolved_by: row.resolved_by,
  resolved_at: row.resolved_at,
  created_at: row.created_at
});
