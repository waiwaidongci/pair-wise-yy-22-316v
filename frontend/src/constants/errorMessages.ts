export const ERROR_MESSAGES = {
  AUTH_REQUIRED: "请先登录后再继续操作",
  RBAC_DENIED: "当前角色没有执行该动作的权限",
  VALIDATION_FAILED: "表单字段缺失或格式错误",
  RATE_LIMITED: "请求过于频繁，请稍后再试",
  BATCH_NOT_FOUND: "离线批次不存在",
  BATCH_ALREADY_MERGED: "批次已归并，重传沿用首次结果",
  CONFLICT_UNRESOLVED: "存在未解决的归并冲突，不能归档",
  NO_CONFLICT_TO_RESOLVE: "该批次没有需要解决的冲突",
  BASELINE_CHANGED: "方案基线已变更，离线内容另存为冲突副本",
  MERGE_FAILED: "归并失败，原批次已保留，可重试",
  PLAN_NOT_FOUND: "修复方案不存在"
};
