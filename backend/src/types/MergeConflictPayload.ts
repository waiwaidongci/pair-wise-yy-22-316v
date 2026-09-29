import type { MergeConflictStatusValue } from "../constants/MergeConflictStatus";
import type { MergeConflictTypeValue } from "../constants/MergeConflictType";
import type { MergeConflictResolutionValue } from "../constants/MergeConflictResolution";

// 一次三方归并产生的冲突条目，双方内容各留一份（central_value / offline_value）。
export interface MergeConflictModel {
  id: number;
  batch_no: string;
  plan_id: number;
  conflict_type: MergeConflictTypeValue;
  field_name: string;
  target_id?: number;
  base_value: unknown;
  central_value: unknown;
  offline_value: unknown;
  status: MergeConflictStatusValue;
  resolution?: MergeConflictResolutionValue;
  resolved_by?: number;
  resolved_at?: string;
  created_at: string;
}

export interface ConflictResolvePayload {
  resolution: MergeConflictResolutionValue;
  operator_id: number;
}
