export const ERROR_MESSAGES = {
  AUTH_REQUIRED: "请先登录后再继续操作",
  RBAC_DENIED: "当前角色没有执行该动作的权限",
  VALIDATION_FAILED: "表单字段缺失或格式错误",
  RATE_LIMITED: "请求过于频繁，请稍后再试",
  BATCH_NOT_FOUND: "未找到该离线批次",
  CONFLICT_NOT_FOUND: "未找到该条归并冲突",
  CONFLICT_ALREADY_RESOLVED: "该冲突已裁决，请勿重复处理",
  PLAN_NOT_FOUND: "未找到对应修复方案",
  UNRESOLVED_CONFLICT: "方案仍有未处理冲突，暂不能归档",
  MERGE_FAILED: "归并失败，原批次已保留，可按原批次号重试"
};
