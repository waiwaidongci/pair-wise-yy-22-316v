import { centralStore } from "./centralStore";
import type { MergeResult } from "../models/MergeResult";
import type { MergeConflict } from "../models/MergeConflict";
import type { OfflineBatchStatusValue } from "../constants/OfflineBatchStatus";

let resultSeq = 300;

export interface NewMergeResultInput {
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
  conflicts: MergeConflict[];
  plan_archivable: boolean;
  retransmit: boolean;
}

export const mergeResultRepository = {
  findAll: (): MergeResult[] => centralStore.mergeResult,
  findByBatchNo: (batchNo: string): MergeResult | undefined =>
    centralStore.mergeResult.find((row) => row.batch_no === batchNo),
  create: (input: NewMergeResultInput): MergeResult => {
    const row: MergeResult = { id: (resultSeq += 1), created_at: new Date().toISOString(), ...input };
    centralStore.mergeResult.push(row);
    return row;
  }
};
