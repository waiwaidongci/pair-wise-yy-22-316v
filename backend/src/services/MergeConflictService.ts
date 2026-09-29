import { mergeConflictRepository } from "../repositories/MergeConflictRepository";
import { offlineBatchRepository } from "../repositories/OfflineBatchRepository";
import { mergeResultRepository } from "../repositories/MergeResultRepository";
import { restorationPlanRepository } from "../repositories/RestorationPlanRepository";
import { restorationStepRepository } from "../repositories/RestorationStepRepository";
import { imageVersionRepository } from "../repositories/ImageVersionRepository";
import { appendAuditLog } from "../repositories/centralStore";
import { MERGE_CONFLICT_STATUS } from "../constants/MergeConflictStatus";
import { MERGE_CONFLICT_TYPE } from "../constants/MergeConflictType";
import { MERGE_CONFLICT_RESOLUTION, type MergeConflictResolutionValue } from "../constants/MergeConflictResolution";
import { OFFLINE_BATCH_STATUS } from "../constants/OfflineBatchStatus";
import { ERROR_CODES } from "../constants/errorCodes";
import { ERROR_MESSAGES } from "../constants/errorMessages";
import { LOG_TEMPLATES } from "../constants/logTemplates";
import { BusinessError } from "../utils/BusinessError";
import { createMergeConflictResponse } from "../constructors/MergeConflictDtoFactory";
import type { RestorationStep } from "../models/RestorationStep";
import type { ImageVersion } from "../models/ImageVersion";
import type { ConflictResolvePayload } from "../types/MergeConflictPayload";
import { offlineBatchService } from "./OfflineBatchService";

const nextStepId = (): number =>
  restorationStepRepository.findAll().reduce((max, row) => Math.max(max, row.id), 0) + 1;

const nextImageId = (): number =>
  imageVersionRepository.findAll().reduce((max, row) => Math.max(max, row.id), 0) + 1;

// 裁决后回写批次结果：全部冲突处理完后，批次才转为 MERGED 且方案允许归档。
function refreshBatchAfterResolve(conflict: { batch_no: string; plan_id: number }): void {
  const remaining = mergeConflictRepository
    .findByBatch(conflict.batch_no)
    .filter((row) => row.status === MERGE_CONFLICT_STATUS.OPEN);

  if (remaining.length === 0) {
    offlineBatchRepository.update(conflict.batch_no, {
      status: OFFLINE_BATCH_STATUS.MERGED
    });
  }

  const result = mergeResultRepository.findByBatchNo(conflict.batch_no);
  if (result) {
    const batchConflicts = mergeConflictRepository.findByBatch(conflict.batch_no);
    result.conflicts = batchConflicts;
    result.status = remaining.length === 0 ? OFFLINE_BATCH_STATUS.MERGED : result.status;
    result.plan_archivable =
      mergeConflictRepository.findOpenByPlan(conflict.plan_id).length === 0;
  }
}

export const mergeConflictService = {
  list(batchNo?: string, planId?: number) {
    return offlineBatchService.listConflicts(batchNo, planId);
  },

  resolve(conflictId: number, payload: ConflictResolvePayload) {
    if (
      !payload ||
      !Object.values(MERGE_CONFLICT_RESOLUTION).includes(
        payload.resolution as MergeConflictResolutionValue
      )
    ) {
      throw new BusinessError(ERROR_CODES.VALIDATION_FAILED, ERROR_MESSAGES.VALIDATION_FAILED);
    }

    const conflict = mergeConflictRepository.findById(conflictId);
    if (!conflict) {
      throw new BusinessError(
        ERROR_CODES.CONFLICT_NOT_FOUND,
        ERROR_MESSAGES.CONFLICT_NOT_FOUND,
        404
      );
    }
    if (conflict.status !== MERGE_CONFLICT_STATUS.OPEN) {
      throw new BusinessError(
        ERROR_CODES.CONFLICT_ALREADY_RESOLVED,
        ERROR_MESSAGES.CONFLICT_ALREADY_RESOLVED,
        409
      );
    }

    const plan = restorationPlanRepository.findById(conflict.plan_id);
    if (!plan) {
      throw new BusinessError(ERROR_CODES.PLAN_NOT_FOUND, ERROR_MESSAGES.PLAN_NOT_FOUND, 404);
    }

    let applied = false;

    if (payload.resolution === MERGE_CONFLICT_RESOLUTION.KEEP_OFFLINE) {
      if (conflict.conflict_type === MERGE_CONFLICT_TYPE.PLAN_FIELD) {
        plan[conflict.field_name as keyof typeof plan] = conflict.offline_value as never;
        plan.revision_no += 1;
        applied = true;
      } else if (conflict.conflict_type === MERGE_CONFLICT_TYPE.STEP) {
        const offline = conflict.offline_value as {
          step_id?: number;
          step_order: string;
          technique: string;
          material_used: string;
          operator_id: number;
          step_status: string;
          finished_at?: string;
        };
        if (offline.step_id && restorationStepRepository.findById(offline.step_id)) {
          restorationStepRepository.update(offline.step_id, {
            step_order: offline.step_order,
            technique: offline.technique,
            material_used: offline.material_used,
            operator_id: offline.operator_id,
            step_status: offline.step_status,
            finished_at: offline.finished_at ?? ""
          });
        } else {
          const row: RestorationStep = {
            id: nextStepId(),
            plan_id: plan.id,
            step_order: offline.step_order,
            technique: offline.technique,
            material_used: offline.material_used,
            operator_id: offline.operator_id,
            step_status: offline.step_status,
            finished_at: offline.finished_at ?? ""
          };
          restorationStepRepository.save(row);
        }
        plan.revision_no += 1;
        applied = true;
      } else if (conflict.conflict_type === MERGE_CONFLICT_TYPE.IMAGE) {
        const offline = conflict.offline_value as {
          version_no: string;
          image_type: string;
          file_path: string;
          capture_at: string;
          note?: string;
        };
        if (!imageVersionRepository.findByVersionNo(plan.id, offline.version_no)) {
          const row: ImageVersion = {
            id: nextImageId(),
            relic_id: plan.relic_id,
            plan_id: plan.id,
            version_no: offline.version_no,
            image_type: offline.image_type,
            file_path: offline.file_path,
            capture_at: offline.capture_at,
            note: offline.note ?? ""
          };
          imageVersionRepository.save(row);
        }
        plan.revision_no += 1;
        applied = true;
      }
    }

    const updated = mergeConflictRepository.update(conflictId, {
      status: applied
        ? MERGE_CONFLICT_STATUS.RESOLVED
        : MERGE_CONFLICT_STATUS.DISCARDED,
      resolution: payload.resolution,
      resolved_by: payload.operator_id,
      resolved_at: new Date().toISOString()
    })!;

    refreshBatchAfterResolve(conflict);

    appendAuditLog({
      actor: `operator:${payload.operator_id}`,
      action: applied ? LOG_TEMPLATES.MergeConflict[1] : LOG_TEMPLATES.MergeConflict[2],
      target_type: "MergeConflict",
      target_id: String(conflictId)
    });

    return createMergeConflictResponse(updated);
  }
};
