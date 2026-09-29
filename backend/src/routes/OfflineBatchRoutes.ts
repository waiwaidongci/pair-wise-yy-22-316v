import { Router } from "express";
import { offlineBatchController } from "../controllers/OfflineBatchController";

const router = Router();
router.get("/", offlineBatchController.list);
router.post("/", offlineBatchController.submit);
router.get("/:batchNo", offlineBatchController.getByBatchNo);
router.post("/:batchNo/merge", offlineBatchController.merge);
router.post("/:batchNo/retry", offlineBatchController.retry);
router.post("/:batchNo/resolve-conflict", offlineBatchController.resolveConflict);

export default router;
