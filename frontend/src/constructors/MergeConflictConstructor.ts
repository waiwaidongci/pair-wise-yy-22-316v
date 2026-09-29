import type { MergeConflict, MergeResult } from "../types/MergeConflict";

export const createDefaultMergeConflict = (
  overrides: Partial<MergeConflict> = {}
): Partial<MergeConflict> => ({
  batch_no: "",
  plan_id: 1,
  conflict_type: "PLAN_FIELD",
  field_name: "",
  base_value: null,
  central_value: null,
  offline_value: null,
  status: "OPEN",
  ...overrides
});

export const createMergeResultResponse = (row: MergeResult): MergeResult => ({ ...row });
