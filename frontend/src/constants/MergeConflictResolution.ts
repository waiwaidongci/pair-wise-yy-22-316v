export const MERGE_CONFLICT_RESOLUTION = {
  KEEP_CENTRAL: "KEEP_CENTRAL",
  KEEP_OFFLINE: "KEEP_OFFLINE"
} as const;

export type MergeConflictResolution =
  (typeof MERGE_CONFLICT_RESOLUTION)[keyof typeof MERGE_CONFLICT_RESOLUTION];
