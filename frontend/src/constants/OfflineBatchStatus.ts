export const OfflineBatchStatus = ["PENDING", "MERGED", "CONFLICT", "FAILED"] as const;
export type OfflineBatchStatus = (typeof OfflineBatchStatus)[number];
export const OfflineBatchStatusText: Record<OfflineBatchStatus, string> = {
  PENDING: "待归并",
  MERGED: "已归并",
  CONFLICT: "冲突",
  FAILED: "归并失败"
};
