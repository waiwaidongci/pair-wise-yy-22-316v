import type { Request, Response, NextFunction } from "express";
import { restorationPlanService } from "../services/RestorationPlanService";
import { BusinessError } from "../utils/BusinessError";
import { ERROR_CODES } from "../constants/errorCodes";
import { ERROR_MESSAGES } from "../constants/errorMessages";

export const restorationPlanController = {
  list: (_req: Request, res: Response) => res.json(restorationPlanService.list()),

  create: (req: Request, res: Response, next: NextFunction) => {
    try {
      res.status(201).json(restorationPlanService.create(req.body));
    } catch (error) {
      next(
        error instanceof BusinessError
          ? error
          : new BusinessError(ERROR_CODES.VALIDATION_FAILED, ERROR_MESSAGES.VALIDATION_FAILED)
      );
    }
  },

  // 归档：冲突未处理完返回 409 UNRESOLVED_CONFLICT。
  archive: (req: Request, res: Response, next: NextFunction) => {
    try {
      const planId = Number(req.params.id);
      const operatorId = Number(req.body.operator_id ?? (req as { user?: { id: number } }).user?.id ?? 0);
      res.json(restorationPlanService.archive(planId, operatorId));
    } catch (error) {
      next(
        error instanceof BusinessError
          ? error
          : new BusinessError(ERROR_CODES.VALIDATION_FAILED, ERROR_MESSAGES.VALIDATION_FAILED)
      );
    }
  }
};
