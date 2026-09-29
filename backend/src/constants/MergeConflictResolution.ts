// 冲突裁决选项：KEEP_CENTRAL 采用中央档案侧，KEEP_OFFLINE 采用离线批次侧。
export const MERGE_CONFLICT_RESOLUTION = {
  KEEP_CENTRAL: "KEEP_CENTRAL",
  KEEP_OFFLINE: "KEEP_OFFLINE"
} as const;

export type MergeConflictResolutionValue =
  (typeof MERGE_CONFLICT_RESOLUTION)[keyof typeof MERGE_CONFLICT_RESOLUTION];
