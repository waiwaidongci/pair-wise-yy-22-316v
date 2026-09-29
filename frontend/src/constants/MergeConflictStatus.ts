export const MERGE_CONFLICT_STATUS = {
  OPEN: "OPEN",
  RESOLVED: "RESOLVED",
  DISCARDED: "DISCARDED"
} as const;

export type MergeConflictStatus = (typeof MERGE_CONFLICT_STATUS)[keyof typeof MERGE_CONFLICT_STATUS];
