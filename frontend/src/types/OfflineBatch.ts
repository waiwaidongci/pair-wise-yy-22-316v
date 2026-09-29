import type { OfflineBatchStatus } from "../constants/OfflineBatchStatus";

export interface OfflineStep {
  step_id?: number;
  step_order: string;
  technique: string;
  material_used: string;
  operator_id: number;
  step_status: string;
  finished_at?: string;
  base_material_used?: string;
}

export interface OfflineImage {
  version_no: string;
  image_type: string;
  file_path: string;
  capture_at: string;
  note?: string;
}

export interface OfflineBatch {
  id: number;
  batch_no: string;
  plan_id: number;
  device_id: string;
  operator_id: number;
  base_revision_no: number;
  base_plan: Record<string, string>;
  plan_patch: Record<string, string>;
  steps: OfflineStep[];
  images: OfflineImage[];
  status: OfflineBatchStatus;
  attempts: number;
  result_id?: number;
  last_error?: string;
  received_at: string;
  captured_at?: string;
}

export interface OfflineBatchSubmitPayload {
  batch_no: string;
  plan_id: number;
  device_id: string;
  operator_id: number;
  base_revision_no: number;
  base_plan?: Record<string, string>;
  plan_patch?: Record<string, string>;
  steps?: OfflineStep[];
  images?: OfflineImage[];
}
