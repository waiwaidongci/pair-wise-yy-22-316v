import type { MergeConflictStatus } from "../constants/MergeConflictStatus";
import type { OfflineBatch } from "./OfflineBatch";

export type MergeConflictType = "PLAN_FIELD" | "STEP" | "IMAGE";

export interface MergeConflict {
  id: number;
  batch_no: string;
  plan_id: number;
  conflict_type: MergeConflictType;
  field_name: string;
  target_id?: number;
  base_value: unknown;
  central_value: unknown;
  offline_value: unknown;
  status: MergeConflictStatus;
  resolution?: "KEEP_CENTRAL" | "KEEP_OFFLINE";
  resolved_by?: number;
  resolved_at?: string;
  created_at: string;
  plan_revision_no?: number;
}

export interface MergeResult {
  id: number;
  batch_no: string;
  plan_id: number;
  base_revision_no: number;
  merged_revision_no: number;
  status: string;
  applied_fields: string[];
  applied_step_ids: number[];
  applied_image_versions: string[];
  held_step_count: number;
  held_image_count: number;
  conflicts: MergeConflict[];
  plan_archivable: boolean;
  retransmit: boolean;
  created_at: string;
}

export interface BatchSubmitOutcome {
  batch: OfflineBatch;
  result: MergeResult;
}
