import { Router } from "express";
import { offlineBatchController } from "../controllers/OfflineBatchController";

const router = Router();

// 回馆上报与重试入口（按 batch_no 幂等）
router.post("/", offlineBatchController.submit);
router.get("/", offlineBatchController.list);
router.get("/results", offlineBatchController.listResults);
router.get("/conflicts", offlineBatchController.listConflicts);
router.get("/:batchNo", offlineBatchController.get);

export default router;
