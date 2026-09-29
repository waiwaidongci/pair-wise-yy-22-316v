import { OFFLINE_BATCH_STATUS } from "./OfflineBatchStatus";
import { MERGE_CONFLICT_STATUS } from "./MergeConflictStatus";
import { MERGE_CONFLICT_RESOLUTION } from "./MergeConflictResolution";

export const OfflineBatchStatusText: Record<(typeof OFFLINE_BATCH_STATUS)[keyof typeof OFFLINE_BATCH_STATUS], string> = {
  PENDING: "待归并",
  MERGED: "已归并",
  MERGED_WITH_CONFLICTS: "有冲突待裁决",
  FAILED: "归并失败可重试"
};

export const MergeConflictStatusText: Record<(typeof MERGE_CONFLICT_STATUS)[keyof typeof MERGE_CONFLICT_STATUS], string> = {
  OPEN: "待处理",
  RESOLVED: "已采用并入",
  DISCARDED: "已放弃"
};

export const MergeConflictResolutionText: Record<
  (typeof MERGE_CONFLICT_RESOLUTION)[keyof typeof MERGE_CONFLICT_RESOLUTION],
  string
> = {
  KEEP_CENTRAL: "采用中央档案侧",
  KEEP_OFFLINE: "采用离线批次侧"
};

export const MergeConflictTypeText = {
  PLAN_FIELD: "方案字段",
  STEP: "步骤/材料",
  IMAGE: "影像版本"
} as const;
