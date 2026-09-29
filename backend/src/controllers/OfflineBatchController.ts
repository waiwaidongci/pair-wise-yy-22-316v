import type { Request, Response } from "express";
import { offlineBatchService } from "../services/OfflineBatchService";

export const offlineBatchController = {
  list: (_req: Request, res: Response) => res.json(offlineBatchService.list()),
  getByBatchNo: (req: Request, res: Response) => res.json(offlineBatchService.getByBatchNo(req.params.batchNo)),
  submit: (req: Request, res: Response) => res.status(201).json(offlineBatchService.submit(req.body)),
  merge: (req: Request, res: Response) => res.json(offlineBatchService.merge(req.params.batchNo)),
  retry: (req: Request, res: Response) => res.json(offlineBatchService.retry(req.params.batchNo)),
  resolveConflict: (req: Request, res: Response) => res.json(offlineBatchService.resolveConflict(req.params.batchNo, req.body))
};
