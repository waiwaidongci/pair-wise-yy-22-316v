import type { OfflineBatchStatusValue } from "../constants/OfflineBatchStatus";

// 离线批次中携带的单条步骤（含材料用量），base_* 字段为平板记录时的基线快照。
export interface OfflineStepPayload {
  step_id?: number;
  step_order: string;
  technique: string;
  material_used: string;
  operator_id: number;
  step_status: string;
  finished_at?: string;
  base_step_order?: string;
  base_technique?: string;
  base_material_used?: string;
  base_step_status?: string;
}

// 离线批次中携带的单条影像版本。
export interface OfflineImagePayload {
  version_no: string;
  image_type: string;
  file_path: string;
  capture_at: string;
  note?: string;
}

// 平板带回的方案字段改动，仅保留被改过的字段。
export type OfflinePlanPatch = Partial<{
  plan_title: string;
  method: string;
  risk_assessment: string;
  approval_status: string;
}>;

// 平板记录方案改动时读到的方案字段基线，用于 PLAN_FIELD 三方比对。
export interface OfflinePlanBase {
  plan_title?: string;
  method?: string;
  risk_assessment?: string;
  approval_status?: string;
}

// 回馆后上报的一个离线批次：按 batch_no + base_revision_no 归并。
export interface OfflineBatchPayload {
  batch_no: string;
  plan_id: number;
  device_id: string;
  operator_id: number;
  base_revision_no: number;
  base_plan?: OfflinePlanBase;
  plan_patch?: OfflinePlanPatch;
  steps?: OfflineStepPayload[];
  images?: OfflineImagePayload[];
  captured_at?: string;
}

export interface OfflineBatchModel extends OfflineBatchPayload {
  id: number;
  status: OfflineBatchStatusValue;
  attempts: number;
  result_id?: number;
  last_error?: string;
  received_at: string;
}

export type OfflineBatchCreatePayload = OfflineBatchPayload;
