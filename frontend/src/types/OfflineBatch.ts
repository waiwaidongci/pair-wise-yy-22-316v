export interface OfflineBatch {
  id: number;
  batch_no: string;
  plan_id: number;
  base_revision: number;
  status: string;
  payload: { steps: unknown[]; images: unknown[] };
  created_by: number;
  created_at: string;
  merged_at: string | null;
  result: Record<string, unknown> | null;
  conflict_details: Record<string, unknown> | null;
  retry_count: number;
}
