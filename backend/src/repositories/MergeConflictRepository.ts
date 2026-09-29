import { centralStore } from "./centralStore";
import type { MergeConflict } from "../models/MergeConflict";
import { MERGE_CONFLICT_STATUS } from "../constants/MergeConflictStatus";
import type { MergeConflictTypeValue } from "../constants/MergeConflictType";

let conflictSeq = 200;

export interface NewConflictInput {
  batch_no: string;
  plan_id: number;
  conflict_type: MergeConflictTypeValue;
  field_name: string;
  target_id?: number;
  base_value: unknown;
  central_value: unknown;
  offline_value: unknown;
}

export const mergeConflictRepository = {
  findAll: (): MergeConflict[] => centralStore.mergeConflict,
  findById: (id: number): MergeConflict | undefined =>
    centralStore.mergeConflict.find((row) => row.id === id),
  findByBatch: (batchNo: string): MergeConflict[] =>
    centralStore.mergeConflict.filter((row) => row.batch_no === batchNo),
  findOpenByPlan: (planId: number): MergeConflict[] =>
    centralStore.mergeConflict.filter(
      (row) => row.plan_id === planId && row.status === MERGE_CONFLICT_STATUS.OPEN
    ),
  create: (input: NewConflictInput): MergeConflict => {
    const row: MergeConflict = {
      id: (conflictSeq += 1),
      ...input,
      status: MERGE_CONFLICT_STATUS.OPEN,
      created_at: new Date().toISOString()
    };
    centralStore.mergeConflict.push(row);
    return row;
  },
  update: (id: number, patch: Partial<MergeConflict>): MergeConflict | undefined => {
    const row = centralStore.mergeConflict.find((item) => item.id === id);
    if (!row) return undefined;
    Object.assign(row, patch);
    return row;
  }
};
