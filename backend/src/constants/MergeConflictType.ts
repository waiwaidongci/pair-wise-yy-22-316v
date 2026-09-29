// 冲突对象类型：PLAN_FIELD 方案字段三方冲突，STEP 步骤/材料用量，IMAGE 影像版本。
export const MERGE_CONFLICT_TYPE = {
  PLAN_FIELD: "PLAN_FIELD",
  STEP: "STEP",
  IMAGE: "IMAGE"
} as const;

export type MergeConflictTypeValue = (typeof MERGE_CONFLICT_TYPE)[keyof typeof MERGE_CONFLICT_TYPE];
