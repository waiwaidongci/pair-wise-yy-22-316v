import { restorationPlanRepository } from "../repositories/RestorationPlanRepository";
import { offlineBatchService } from "./OfflineBatchService";
import { ERROR_CODES } from "../constants/errorCodes";
import { ERROR_MESSAGES } from "../constants/errorMessages";
import type { RestorationPlan } from "../models/RestorationPlan";

export const restorationPlanService = {
  list: () => restorationPlanRepository.findAll(),
  create: (row: RestorationPlan) => restorationPlanRepository.save(row),

  // 归档：存在未解决归并冲突时禁止归档，其他进度照常可用
  archive: (id: number) => {
    const plan = restorationPlanRepository.findById(id);
    if (!plan) {
      const err = new Error(ERROR_MESSAGES.PLAN_NOT_FOUND) as Error & { code: string; status: number };
      err.code = ERROR_CODES.PLAN_NOT_FOUND;
      err.status = 404;
      throw err;
    }
    if (offlineBatchService.hasUnresolvedConflict(id)) {
      const err = new Error(ERROR_MESSAGES.CONFLICT_UNRESOLVED) as Error & { code: string; status: number };
      err.code = ERROR_CODES.CONFLICT_UNRESOLVED;
      err.status = 409;
      throw err;
    }
    plan.approval_status = "ARCHIVED";
    restorationPlanRepository.save(plan);
    return plan;
  }
};
