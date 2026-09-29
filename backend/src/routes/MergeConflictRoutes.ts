import { Router } from "express";
import { mergeConflictController } from "../controllers/MergeConflictController";

const router = Router();

router.get("/", mergeConflictController.list);
router.post("/:id/resolve", mergeConflictController.resolve);

export default router;
