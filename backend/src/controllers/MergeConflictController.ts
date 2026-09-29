import type { Request, Response, NextFunction } from "express";
import { mergeConflictService } from "../services/MergeConflictService";
import { ERROR_CODES } from "../constants/errorCodes";
import { ERROR_MESSAGES } from "../constants/errorMessages";
import { BusinessError } from "../utils/BusinessError";

export const mergeConflictController = {
  list: (req: Request, res: Response, next: NextFunction) => {
    try {
      const planId = req.query.planId ? Number(req.query.planId) : undefined;
      res.json(
        mergeConflictService.list(req.query.batchNo as string | undefined, planId)
      );
    } catch (error) {
      next(
        error instanceof BusinessError
          ? error
          : new BusinessError(ERROR_CODES.VALIDATION_FAILED, ERROR_MESSAGES.VALIDATION_FAILED)
      );
    }
  },

  // 档案员裁决一条冲突：KEEP_CENTRAL / KEEP_OFFLINE。
  resolve: (req: Request, res: Response, next: NextFunction) => {
    try {
      const conflictId = Number(req.params.id);
      if (!Number.isFinite(conflictId)) {
        throw new BusinessError(ERROR_CODES.VALIDATION_FAILED, ERROR_MESSAGES.VALIDATION_FAILED);
      }
      res.json(
        mergeConflictService.resolve(conflictId, {
          resolution: req.body.resolution,
          operator_id: Number(req.body.operator_id ?? (req as { user?: { id: number } }).user?.id ?? 0)
        })
      );
    } catch (error) {
      next(
        error instanceof BusinessError
          ? error
          : new BusinessError(ERROR_CODES.VALIDATION_FAILED, ERROR_MESSAGES.VALIDATION_FAILED)
      );
    }
  }
};
