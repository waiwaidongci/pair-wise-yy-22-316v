// 冲突裁决状态：OPEN 未处理，RESOLVED 已按裁决并入，DISCARDED 已放弃该侧内容。
export const MERGE_CONFLICT_STATUS = {
  OPEN: "OPEN",
  RESOLVED: "RESOLVED",
  DISCARDED: "DISCARDED"
} as const;

export type MergeConflictStatusValue = (typeof MERGE_CONFLICT_STATUS)[keyof typeof MERGE_CONFLICT_STATUS];
