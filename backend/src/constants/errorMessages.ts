export const ERROR_MESSAGES = {
  AUTH_REQUIRED: "missing bearer token",
  RBAC_DENIED: "role denied",
  VALIDATION_FAILED: "invalid payload",
  RATE_LIMITED: "too many requests",
  BATCH_NOT_FOUND: "offline batch not found",
  CONFLICT_NOT_FOUND: "merge conflict not found",
  CONFLICT_ALREADY_RESOLVED: "merge conflict already resolved",
  PLAN_NOT_FOUND: "restoration plan not found",
  UNRESOLVED_CONFLICT: "plan has unresolved merge conflicts and cannot be archived",
  MERGE_FAILED: "offline batch merge failed, original batch retained for retry"
};
