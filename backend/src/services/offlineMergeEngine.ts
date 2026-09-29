import { restorationPlanRepository } from "../repositories/RestorationPlanRepository";
import { restorationStepRepository } from "../repositories/RestorationStepRepository";
import { imageVersionRepository } from "../repositories/ImageVersionRepository";
import { mergeConflictRepository } from "../repositories/MergeConflictRepository";
import { OFFLINE_BATCH_STATUS, type OfflineBatchStatusValue } from "../constants/OfflineBatchStatus";
import { MERGE_CONFLICT_TYPE } from "../constants/MergeConflictType";
import type { OfflineBatch } from "../models/OfflineBatch";
import type { MergeConflict } from "../models/MergeConflict";
import type { RestorationPlan } from "../models/RestorationPlan";
import type { RestorationStep } from "../models/RestorationStep";
import type { ImageVersion } from "../models/ImageVersion";

const PLAN_FIELDS = ["plan_title", "method", "risk_assessment", "approval_status"] as const;
type PlanField = (typeof PLAN_FIELDS)[number];

export interface MergeOutcome {
  status: OfflineBatchStatusValue;
  base_revision_no: number;
  merged_revision_no: number;
  applied_fields: string[];
  applied_step_ids: number[];
  applied_image_versions: string[];
  held_step_count: number;
  held_image_count: number;
  conflicts: MergeConflict[];
  plan_archivable: boolean;
  bumped: boolean;
}

const nextStepId = (): number =>
  restorationStepRepository.findAll().reduce((max, row) => Math.max(max, row.id), 0) + 1;

const nextImageId = (): number =>
  imageVersionRepository.findAll().reduce((max, row) => Math.max(max, row.id), 0) + 1;

// 方案字段三方合并：
// - 中央未动（基线==中央）：快进并入离线值；
// - 离线未动（基线==离线）：保留中央；
// - 双方都改成不同值：各留一份并标 PLAN_FIELD 冲突，不自动采用任一侧。
function mergePlanFields(
  batch: OfflineBatch,
  plan: RestorationPlan,
  conflicts: MergeConflict[]
): string[] {
  const applied: string[] = [];
  const patch = (batch.plan_patch ?? {}) as Partial<Record<PlanField, string>>;
  const base = (batch.base_plan ?? {}) as Partial<Record<PlanField, string>>;

  PLAN_FIELDS.forEach((field) => {
    if (!(field in patch)) return;
    const offlineValue = patch[field];
    const centralValue = plan[field];
    const baseValue = field in base ? base[field] : centralValue;

    if (offlineValue === centralValue) return;
    if (baseValue === offlineValue) return;
    if (baseValue === centralValue) {
      plan[field] = offlineValue as never;
      applied.push(field);
      return;
    }
    conflicts.push(
      mergeConflictRepository.create({
        batch_no: batch.batch_no,
        plan_id: plan.id,
        conflict_type: MERGE_CONFLICT_TYPE.PLAN_FIELD,
        field_name: field,
        base_value: baseValue,
        central_value: centralValue,
        offline_value: offlineValue
      })
    );
  });

  return applied;
}

// 基线未变：步骤和材料用量整批快进（新增步骤分配新 id，已有步骤按 step_id 更新）。
function fastForwardSteps(batch: OfflineBatch, plan: RestorationPlan): number[] {
  const appliedIds: number[] = [];
  (batch.steps ?? []).forEach((step) => {
    if (typeof step.step_id === "number") {
      restorationStepRepository.update(step.step_id, {
        step_order: step.step_order,
        technique: step.technique,
        material_used: step.material_used,
        operator_id: step.operator_id,
        step_status: step.step_status,
        finished_at: step.finished_at ?? ""
      });
      appliedIds.push(step.step_id);
      return;
    }
    const row: RestorationStep = {
      id: nextStepId(),
      plan_id: plan.id,
      step_order: step.step_order,
      technique: step.technique,
      material_used: step.material_used,
      operator_id: step.operator_id,
      step_status: step.step_status,
      finished_at: step.finished_at ?? ""
    };
    restorationStepRepository.save(row);
    appliedIds.push(row.id);
  });
  return appliedIds;
}

// 基线未变：影像版本按 version_no 去重后并入。
function fastForwardImages(batch: OfflineBatch, plan: RestorationPlan): string[] {
  const appliedVersions: string[] = [];
  (batch.images ?? []).forEach((image) => {
    const existing = imageVersionRepository.findByVersionNo(plan.id, image.version_no);
    if (existing) return;
    const row: ImageVersion = {
      id: nextImageId(),
      relic_id: plan.relic_id,
      plan_id: plan.id,
      version_no: image.version_no,
      image_type: image.image_type,
      file_path: image.file_path,
      capture_at: image.capture_at,
      note: image.note ?? ""
    };
    imageVersionRepository.save(row);
    appliedVersions.push(image.version_no);
  });
  return appliedVersions;
}

// 基线已变：步骤不自动并入，离线侧内容原样保留为 STEP 冲突，等待人工裁决。
function holdSteps(batch: OfflineBatch, plan: RestorationPlan, conflicts: MergeConflict[]): number {
  (batch.steps ?? []).forEach((step) => {
    const central =
      typeof step.step_id === "number"
        ? restorationStepRepository.findById(step.step_id)
        : undefined;
    conflicts.push(
      mergeConflictRepository.create({
        batch_no: batch.batch_no,
        plan_id: plan.id,
        conflict_type: MERGE_CONFLICT_TYPE.STEP,
        field_name: "restoration_step",
        target_id: step.step_id,
        base_value: {
          step_order: step.base_step_order,
          technique: step.base_technique,
          material_used: step.base_material_used,
          step_status: step.base_step_status
        },
        central_value: central
          ? {
              step_order: central.step_order,
              technique: central.technique,
              material_used: central.material_used,
              step_status: central.step_status
            }
          : null,
        offline_value: {
          step_id: step.step_id ?? null,
          step_order: step.step_order,
          technique: step.technique,
          material_used: step.material_used,
          operator_id: step.operator_id,
          step_status: step.step_status,
          finished_at: step.finished_at ?? null
        }
      })
    );
  });
  return batch.steps?.length ?? 0;
}

// 基线已变：影像版本不自动并入，离线侧版本保留为 IMAGE 冲突。
function holdImages(batch: OfflineBatch, plan: RestorationPlan, conflicts: MergeConflict[]): number {
  (batch.images ?? []).forEach((image) => {
    const central = imageVersionRepository.findByVersionNo(plan.id, image.version_no);
    conflicts.push(
      mergeConflictRepository.create({
        batch_no: batch.batch_no,
        plan_id: plan.id,
        conflict_type: MERGE_CONFLICT_TYPE.IMAGE,
        field_name: "image_version",
        target_id: central?.id,
        base_value: null,
        central_value: central
          ? {
              version_no: central.version_no,
              image_type: central.image_type,
              file_path: central.file_path,
              capture_at: central.capture_at,
              note: central.note
            }
          : null,
        offline_value: image
      })
    );
  });
  return batch.images?.length ?? 0;
}

// 归并引擎：对已收存的离线批次执行一次三方归并，任何异常上抛由 service 决定 FAILED 与重试。
export function mergeOfflineBatch(batch: OfflineBatch): MergeOutcome {
  const plan = restorationPlanRepository.findById(batch.plan_id);
  if (!plan) {
    throw new Error(`restoration plan ${batch.plan_id} not found`);
  }

  const conflicts: MergeConflict[] = [];
  const appliedFields = mergePlanFields(batch, plan, conflicts);

  const baselineUnchanged = plan.revision_no === batch.base_revision_no;

  let appliedStepIds: number[] = [];
  let appliedImageVersions: string[] = [];
  let heldStepCount = 0;
  let heldImageCount = 0;

  if (baselineUnchanged) {
    appliedStepIds = fastForwardSteps(batch, plan);
    appliedImageVersions = fastForwardImages(batch, plan);
  } else {
    heldStepCount = holdSteps(batch, plan, conflicts);
    heldImageCount = holdImages(batch, plan, conflicts);
  }

  const bumped =
    appliedFields.length > 0 || appliedStepIds.length > 0 || appliedImageVersions.length > 0;
  if (bumped) {
    plan.revision_no += 1;
  }

  const openConflicts = mergeConflictRepository.findOpenByPlan(plan.id);
  const planArchivable = openConflicts.length === 0;

  return {
    status:
      conflicts.length > 0
        ? OFFLINE_BATCH_STATUS.MERGED_WITH_CONFLICTS
        : OFFLINE_BATCH_STATUS.MERGED,
    base_revision_no: batch.base_revision_no,
    merged_revision_no: plan.revision_no,
    applied_fields: appliedFields,
    applied_step_ids: appliedStepIds,
    applied_image_versions: appliedImageVersions,
    held_step_count: heldStepCount,
    held_image_count: heldImageCount,
    conflicts,
    plan_archivable: planArchivable,
    bumped
  };
}
