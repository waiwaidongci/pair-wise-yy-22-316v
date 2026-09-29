// 离线批次生命周期：PENDING 已收存待归并，MERGED 干净并入，
// MERGED_WITH_CONFLICTS 有冲突待人工裁决，FAILED 归并失败（原批次保留可重试）。
export const OFFLINE_BATCH_STATUS = {
  PENDING: "PENDING",
  MERGED: "MERGED",
  MERGED_WITH_CONFLICTS: "MERGED_WITH_CONFLICTS",
  FAILED: "FAILED"
} as const;

export type OfflineBatchStatusValue = (typeof OFFLINE_BATCH_STATUS)[keyof typeof OFFLINE_BATCH_STATUS];
