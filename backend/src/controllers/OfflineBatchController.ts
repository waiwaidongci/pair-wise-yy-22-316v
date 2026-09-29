import type { Request, Response, NextFunction } from "express";
import { offlineBatchService } from "../services/OfflineBatchService";
import { ERROR_CODES } from "../constants/errorCodes";
import { ERROR_MESSAGES } from "../constants/errorMessages";
import { BusinessError } from "../utils/BusinessError";

// controller 层再包一层异常，禁止只在全局错误中间件里吞掉。
function handleError(error: unknown, next: NextFunction): void {
  if (error instanceof BusinessError) {
    next(error);
    return;
  }
  next(new BusinessError(ERROR_CODES.MERGE_FAILED, ERROR_MESSAGES.MERGE_FAILED, 500));
}

export const offlineBatchController = {
  list: (_req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(offlineBatchService.list());
    } catch (error) {
      handleError(error, next);
    }
  },

  get: (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(offlineBatchService.getByBatchNo(req.params.batchNo));
    } catch (error) {
      handleError(error, next);
    }
  },

  // 平板回馆上报离线批次；同一批次号重传沿用首次归并结果（响应 retransmit=true）。
  submit: (req: Request, res: Response, next: NextFunction) => {
    try {
      const outcome = offlineBatchService.submit(req.body);
      res.status(201).json(outcome);
    } catch (error) {
      handleError(error, next);
    }
  },

  listResults: (req: Request, res: Response, next: NextFunction) => {
    try {
      res.json(offlineBatchService.listResults(req.query.batchNo as string | undefined));
    } catch (error) {
      handleError(error, next);
    }
  },

  listConflicts: (req: Request, res: Response, next: NextFunction) => {
    try {
      const planId = req.query.planId ? Number(req.query.planId) : undefined;
      res.json(
        offlineBatchService.listConflicts(req.query.batchNo as string | undefined, planId)
      );
    } catch (error) {
      handleError(error, next);
    }
  }
};
