import { offlineBatchRepository } from "../repositories/OfflineBatchRepository";
import { mergeResultRepository } from "../repositories/MergeResultRepository";
import { mergeConflictRepository } from "../repositories/MergeConflictRepository";
import { restorationPlanRepository } from "../repositories/RestorationPlanRepository";
import { mergeOfflineBatch } from "./offlineMergeEngine";
import { OFFLINE_BATCH_STATUS } from "../constants/OfflineBatchStatus";
import { ERROR_CODES } from "../constants/errorCodes";
import { ERROR_MESSAGES } from "../constants/errorMessages";
import { LOG_TEMPLATES } from "../constants/logTemplates";
import { appendAuditLog } from "../repositories/centralStore";
import { BusinessError } from "../utils/BusinessError";
import { createOfflineBatchResponse } from "../constructors/OfflineBatchDtoFactory";
import { createMergeResultResponse } from "../constructors/MergeResultDtoFactory";
import { createMergeConflictResponse } from "../constructors/MergeConflictDtoFactory";
import type { OfflineBatchPayload } from "../types/OfflineBatchPayload";
import type { MergeResultModel } from "../types/MergeResultPayload";

const REQUIRED_FIELDS: Array<keyof OfflineBatchPayload> = [
  "batch_no",
  "plan_id",
  "device_id",
  "operator_id",
  "base_revision_no"
];

function validatePayload(payload: OfflineBatchPayload): void {
  if (!payload || typeof payload !== "object") {
    throw new BusinessError(ERROR_CODES.VALIDATION_FAILED, ERROR_MESSAGES.VALIDATION_FAILED);
  }
  REQUIRED_FIELDS.forEach((field) => {
    if (payload[field] === undefined || payload[field] === null || payload[field] === "") {
      throw new BusinessError(
        ERROR_CODES.VALIDATION_FAILED,
        `${ERROR_MESSAGES.VALIDATION_FAILED}: ${field} required`
      );
    }
  });
  if (typeof payload.base_revision_no !== "number" || payload.base_revision_no < 0) {
    throw new BusinessError(
      ERROR_CODES.VALIDATION_FAILED,
      `${ERROR_MESSAGES.VALIDATION_FAILED}: base_revision_no invalid`
    );
  }
}

export interface SubmitOutcome {
  batch: ReturnType<typeof createOfflineBatchResponse>;
  result: ReturnType<typeof createMergeResultResponse>;
}

export const offlineBatchService = {
  list() {
    return offlineBatchRepository.findAll().map(createOfflineBatchResponse);
  },

  getByBatchNo(batchNo: string) {
    const batch = offlineBatchRepository.findByBatchNo(batchNo);
    if (!batch) {
      throw new BusinessError(
        ERROR_CODES.BATCH_NOT_FOUND,
        ERROR_MESSAGES.BATCH_NOT_FOUND,
        404
      );
    }
    return createOfflineBatchResponse(batch);
  },

  // 回馆提交：已归并过的批次（含带冲突的）沿用首次结果；失败批次保留原报文并按新报文重试。
  submit(payload: OfflineBatchPayload): SubmitOutcome {
    validatePayload(payload);
    const existing = offlineBatchRepository.findByBatchNo(payload.batch_no);

    if (existing && existing.status !== OFFLINE_BATCH_STATUS.FAILED) {
      const firstResult = existing.result_id
        ? mergeResultRepository.findAll().find((row) => row.id === existing.result_id)
        : undefined;
      appendAuditLog({
        actor: `operator:${payload.operator_id}`,
        action: LOG_TEMPLATES.OfflineBatch[1],
        target_type: "OfflineBatch",
        target_id: payload.batch_no
      });
      if (!firstResult) {
        throw new BusinessError(ERROR_CODES.MERGE_FAILED, ERROR_MESSAGES.MERGE_FAILED, 500);
      }
      return {
        batch: createOfflineBatchResponse(existing),
        result: { ...createMergeResultResponse(firstResult), retransmit: true }
      };
    }

    const batch =
      existing && existing.status === OFFLINE_BATCH_STATUS.FAILED
        ? offlineBatchRepository.update(existing.batch_no, {
            ...payload,
            base_plan: payload.base_plan ?? {},
            plan_patch: payload.plan_patch ?? {},
            steps: payload.steps ?? [],
            images: payload.images ?? [],
            attempts: existing.attempts + 1,
            last_error: undefined
          })!
        : offlineBatchRepository.create(payload);

    appendAuditLog({
      actor: `operator:${payload.operator_id}`,
      action: existing ? LOG_TEMPLATES.OfflineBatch[3] : LOG_TEMPLATES.OfflineBatch[0],
      target_type: "OfflineBatch",
      target_id: batch.batch_no
    });

    return this.runMerge(batch, payload.operator_id);
  },

  // 执行一次归并并落结果；异常时原批次保留为 FAILED，等待同批次号重试。
  runMerge(
    batch: ReturnType<typeof offlineBatchRepository.create>,
    operatorId: number
  ): SubmitOutcome {
    try {
      const outcome = mergeOfflineBatch(batch);
      const result: MergeResultModel = mergeResultRepository.create({
        batch_no: batch.batch_no,
        plan_id: batch.plan_id,
        base_revision_no: outcome.base_revision_no,
        merged_revision_no: outcome.merged_revision_no,
        status: outcome.status,
        applied_fields: outcome.applied_fields,
        applied_step_ids: outcome.applied_step_ids,
        applied_image_versions: outcome.applied_image_versions,
        held_step_count: outcome.held_step_count,
        held_image_count: outcome.held_image_count,
        conflicts: outcome.conflicts,
        plan_archivable: outcome.plan_archivable,
        retransmit: false
      });

      offlineBatchRepository.update(batch.batch_no, { status: outcome.status, result_id: result.id });

      appendAuditLog({
        actor: `operator:${operatorId}`,
        action: LOG_TEMPLATES.OfflineBatch[2],
        target_type: "OfflineBatch",
        target_id: batch.batch_no
      });
      if (outcome.conflicts.length > 0) {
        appendAuditLog({
          actor: `operator:${operatorId}`,
          action: LOG_TEMPLATES.OfflineBatch[4],
          target_type: "RestorationPlan",
          target_id: String(batch.plan_id)
        });
      }

      const stored = offlineBatchRepository.findByBatchNo(batch.batch_no)!;
      return {
        batch: createOfflineBatchResponse(stored),
        result: createMergeResultResponse(result)
      };
    } catch (error) {
      offlineBatchRepository.update(batch.batch_no, {
        status: OFFLINE_BATCH_STATUS.FAILED,
        attempts: batch.attempts + 1,
        last_error: error instanceof Error ? error.message : String(error)
      });
      appendAuditLog({
        actor: `operator:${operatorId}`,
        action: LOG_TEMPLATES.OfflineBatch[2],
        target_type: "OfflineBatch",
        target_id: batch.batch_no
      });
      throw new BusinessError(ERROR_CODES.MERGE_FAILED, ERROR_MESSAGES.MERGE_FAILED, 502);
    }
  },

  listResults(batchNo?: string) {
    const rows = batchNo
      ? mergeResultRepository.findAll().filter((row) => row.batch_no === batchNo)
      : mergeResultRepository.findAll();
    return rows.map(createMergeResultResponse);
  },

  listConflicts(batchNo?: string, planId?: number) {
    let rows = mergeConflictRepository.findAll();
    if (batchNo) rows = rows.filter((row) => row.batch_no === batchNo);
    if (typeof planId === "number") rows = rows.filter((row) => row.plan_id === planId);
    return rows.map((row) => ({
      ...createMergeConflictResponse(row),
      plan_revision_no: restorationPlanRepository.findById(row.plan_id)?.revision_no
    }));
  }
};
