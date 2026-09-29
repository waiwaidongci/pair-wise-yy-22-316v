import { offlineBatchRepository } from "../repositories/OfflineBatchRepository";
import { restorationPlanRepository } from "../repositories/RestorationPlanRepository";
import { restorationStepRepository } from "../repositories/RestorationStepRepository";
import { imageVersionRepository } from "../repositories/ImageVersionRepository";
import { createOfflineBatchDto } from "../constructors/OfflineBatchDtoFactory";
import { ERROR_CODES } from "../constants/errorCodes";
import { ERROR_MESSAGES } from "../constants/errorMessages";
import type { OfflineBatch } from "../models/OfflineBatch";

function nowIso() {
  return new Date().toISOString();
}

function buildError(code: keyof typeof ERROR_CODES, status: number): Error {
  const err = new Error(ERROR_MESSAGES[code]) as Error & { code: string; status: number };
  err.code = ERROR_CODES[code];
  err.status = status;
  return err;
}

export const offlineBatchService = {
  list: () => offlineBatchRepository.findAll(),

  getByBatchNo: (batchNo: string) => {
    const batch = offlineBatchRepository.findByBatchNo(batchNo);
    if (!batch) throw buildError("BATCH_NOT_FOUND", 404);
    return batch;
  },

  // 提交离线批次：同一批次号重传时沿用首次结果
  submit: (payload: Partial<OfflineBatch> & { batch_no: string; plan_id: number; base_revision: number }) => {
    const existing = offlineBatchRepository.findByBatchNo(payload.batch_no);
    if (existing) {
      return { batch: existing, idempotent: true, result: existing.result };
    }
    const batch = createOfflineBatchDto({
      id: offlineBatchRepository.nextId(),
      batch_no: payload.batch_no,
      plan_id: payload.plan_id,
      base_revision: payload.base_revision,
      status: "PENDING",
      payload: { steps: payload.payload?.steps ?? [], images: payload.payload?.images ?? [] },
      created_by: payload.created_by ?? 1,
      created_at: nowIso()
    }) as OfflineBatch;
    offlineBatchRepository.save(batch);
    return { batch, idempotent: false, result: null };
  },

  // 归并：按批次号和方案修订号归并，重传沿用首次结果
  merge: (batchNo: string) => {
    const batch = offlineBatchRepository.findByBatchNo(batchNo);
    if (!batch) throw buildError("BATCH_NOT_FOUND", 404);
    if (batch.status === "MERGED") {
      return { batch, idempotent: true, conflict: false, result: batch.result };
    }
    try {
      const plan = restorationPlanRepository.findById(batch.plan_id);
      if (!plan) throw buildError("PLAN_NOT_FOUND", 404);

      // 步骤和影像只在基线未变时并入
      if (plan.revision !== batch.base_revision) {
        const conflictingSteps = batch.payload.steps.map((_, idx) => idx + 1);
        const conflictingImages = batch.payload.images.map((_, idx) => idx + 1);
        batch.status = "CONFLICT";
        batch.conflict_details = {
          base_revision: batch.base_revision,
          current_revision: plan.revision,
          conflicting_steps: conflictingSteps,
          conflicting_images: conflictingImages,
          offline_steps: batch.payload.steps,
          offline_images: batch.payload.images,
          message: ERROR_MESSAGES.BASELINE_CHANGED
        };
        offlineBatchRepository.save(batch);
        return { batch, idempotent: false, conflict: true, result: null };
      }

      // 基线未变：并入步骤和影像
      let mergedSteps = 0;
      let mergedImages = 0;
      for (const step of batch.payload.steps) {
        restorationStepRepository.save({
          ...(step as Record<string, unknown>),
          id: restorationStepRepository.nextId(),
          plan_id: plan.id
        } as never);
        mergedSteps += 1;
      }
      for (const image of batch.payload.images) {
        imageVersionRepository.save({
          ...(image as Record<string, unknown>),
          id: imageVersionRepository.nextId(),
          plan_id: plan.id,
          relic_id: plan.relic_id
        } as never);
        mergedImages += 1;
      }

      plan.revision += 1;
      restorationPlanRepository.save(plan);

      batch.status = "MERGED";
      batch.merged_at = nowIso();
      batch.result = { merged_steps: mergedSteps, merged_images: mergedImages, revision: plan.revision };
      batch.conflict_details = null;
      offlineBatchRepository.save(batch);
      return { batch, idempotent: false, conflict: false, result: batch.result };
    } catch (err) {
      // 归并失败：原批次保留，标记 FAILED，可重试
      batch.status = "FAILED";
      batch.retry_count += 1;
      batch.conflict_details = { error: (err as Error).message };
      offlineBatchRepository.save(batch);
      throw buildError("MERGE_FAILED", 500);
    }
  },

  // 重试失败的归并
  retry: (batchNo: string) => {
    const batch = offlineBatchRepository.findByBatchNo(batchNo);
    if (!batch) throw buildError("BATCH_NOT_FOUND", 404);
    if (batch.status === "MERGED") {
      return { batch, idempotent: true, conflict: false, result: batch.result };
    }
    return offlineBatchService.merge(batchNo);
  },

  // 解决冲突：将离线内容并入，提升方案修订号
  resolveConflict: (batchNo: string, resolution: Record<string, unknown> = {}) => {
    const batch = offlineBatchRepository.findByBatchNo(batchNo);
    if (!batch) throw buildError("BATCH_NOT_FOUND", 404);
    if (batch.status !== "CONFLICT") throw buildError("NO_CONFLICT_TO_RESOLVE", 409);

    const plan = restorationPlanRepository.findById(batch.plan_id);
    if (!plan) throw buildError("PLAN_NOT_FOUND", 404);

    let mergedSteps = 0;
    let mergedImages = 0;
    for (const step of batch.payload.steps) {
      restorationStepRepository.save({ ...(step as Record<string, unknown>), id: restorationStepRepository.nextId(), plan_id: plan.id } as never);
      mergedSteps += 1;
    }
    for (const image of batch.payload.images) {
      imageVersionRepository.save({ ...(image as Record<string, unknown>), id: imageVersionRepository.nextId(), plan_id: plan.id, relic_id: plan.relic_id } as never);
      mergedImages += 1;
    }

    plan.revision += 1;
    restorationPlanRepository.save(plan);

    batch.status = "MERGED";
    batch.merged_at = nowIso();
    batch.result = { merged_steps: mergedSteps, merged_images: mergedImages, revision: plan.revision, resolved: true, resolution };
    batch.conflict_details = null;
    offlineBatchRepository.save(batch);
    return { batch, result: batch.result };
  },

  // 归档守卫：方案存在未解决冲突时禁止归档
  hasUnresolvedConflict: (planId: number) =>
    offlineBatchRepository.findAll().some((batch) => batch.plan_id === planId && batch.status === "CONFLICT")
};
