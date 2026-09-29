import type { OfflineBatchStatusValue } from "../constants/OfflineBatchStatus";
import type { MergeConflictModel } from "./MergeConflictPayload";

// 一次归并尝试的结果：冲突未处理完时 plan_archivable 为 false，其他进度照常可用。
export interface MergeResultModel {
  id: number;
  batch_no: string;
  plan_id: number;
  base_revision_no: number;
  merged_revision_no: number;
  status: OfflineBatchStatusValue;
  applied_fields: string[];
  applied_step_ids: number[];
  applied_image_versions: string[];
  held_step_count: number;
  held_image_count: number;
  conflicts: MergeConflictModel[];
  plan_archivable: boolean;
  retransmit: boolean;
  created_at: string;
}
