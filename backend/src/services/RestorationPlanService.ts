import { restorationPlanRepository } from "../repositories/RestorationPlanRepository";
import { mergeConflictRepository } from "../repositories/MergeConflictRepository";
import { appendAuditLog } from "../repositories/centralStore";
import { MERGE_CONFLICT_STATUS } from "../constants/MergeConflictStatus";
import { ERROR_CODES } from "../constants/errorCodes";
import { ERROR_MESSAGES } from "../constants/errorMessages";
import { LOG_TEMPLATES } from "../constants/logTemplates";
import { BusinessError } from "../utils/BusinessError";
import { createRestorationPlanDto } from "../constructors/RestorationPlanDtoFactory";

export const restorationPlanService = {
  list: () => restorationPlanRepository.findAll(),

  create: (row: Record<string, unknown>) =>
    restorationPlanRepository.save(createRestorationPlanDto(row) as never),

  // 归档闸门：该方案只要还有 OPEN 冲突就拒绝归档（409），其他进度（查询、修复执行等）照常可用。
  archive: (planId: number, operatorId: number) => {
    const plan = restorationPlanRepository.findById(planId);
    if (!plan) {
      throw new BusinessError(ERROR_CODES.PLAN_NOT_FOUND, ERROR_MESSAGES.PLAN_NOT_FOUND, 404);
    }

    const openConflicts = mergeConflictRepository.findOpenByPlan(planId);
    if (openConflicts.length > 0) {
      appendAuditLog({
        actor: `operator:${operatorId}`,
        action: LOG_TEMPLATES.MergeConflict[3],
        target_type: "RestorationPlan",
        target_id: String(planId)
      });
      throw new BusinessError(
        ERROR_CODES.UNRESOLVED_CONFLICT,
        `${ERROR_MESSAGES.UNRESOLVED_CONFLICT}: ${openConflicts.length} open`,
        409
      );
    }

    const updated = restorationPlanRepository.update(planId, { approval_status: "ARCHIVED" })!;
    appendAuditLog({
      actor: `operator:${operatorId}`,
      action: LOG_TEMPLATES.RestorationPlan[2],
      target_type: "RestorationPlan",
      target_id: String(planId)
    });
    return updated;
  }
};
