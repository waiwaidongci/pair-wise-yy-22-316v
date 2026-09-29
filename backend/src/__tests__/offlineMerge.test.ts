/* eslint-disable no-console */
// 离线批次归并规则验证：幂等重传、基线快进、双方改动留冲突、归档闸门、失败重试。
// 运行：npx tsx src/__tests__/offlineMerge.test.ts
import assert from "node:assert/strict";
import { centralStore } from "../repositories/centralStore";
import { offlineBatchService } from "../services/OfflineBatchService";
import { mergeConflictService } from "../services/MergeConflictService";
import { restorationPlanService } from "../services/RestorationPlanService";
import { restorationPlanRepository } from "../repositories/RestorationPlanRepository";
import { restorationStepRepository } from "../repositories/RestorationStepRepository";
import { imageVersionRepository } from "../repositories/ImageVersionRepository";
import { mergeConflictRepository } from "../repositories/MergeConflictRepository";
import { OFFLINE_BATCH_STATUS } from "../constants/OfflineBatchStatus";
import { BusinessError } from "../utils/BusinessError";

let passed = 0;
function test(name: string, fn: () => void): void {
  fn();
  passed += 1;
  console.info(`  ✓ ${name}`);
}

function resetStore(): void {
  centralStore.restorationPlan.splice(
    0,
    centralStore.restorationPlan.length,
    ...[
      {
        id: 1, relic_id: 1, damage_record_id: 1, plan_title: "方案甲", method: "干法清理",
        risk_assessment: "低", approval_status: "APPROVED", owner_id: 1, revision_no: 1
      },
      {
        id: 2, relic_id: 2, damage_record_id: 2, plan_title: "方案乙", method: "湿法清理",
        risk_assessment: "中", approval_status: "APPROVED", owner_id: 2, revision_no: 5
      }
    ]
  );
  centralStore.restorationStep.splice(0, centralStore.restorationStep.length, {
    id: 1, plan_id: 1, step_order: "1", technique: "除尘", material_used: "软毛刷",
    operator_id: 1, step_status: "DONE", finished_at: ""
  });
  centralStore.imageVersion.splice(0, centralStore.imageVersion.length);
  centralStore.offlineBatch.splice(0, centralStore.offlineBatch.length);
  centralStore.mergeConflict.splice(0, centralStore.mergeConflict.length);
  centralStore.mergeResult.splice(0, centralStore.mergeResult.length);
  centralStore.auditLog.splice(0, centralStore.auditLog.length);
}

// 规则一：基线未变时整批快进，步骤、材料用量、影像版本并入，方案修订号 +1。
test("基线未变：步骤/材料/影像快进并入，修订号推进", () => {
  resetStore();
  const out = offlineBatchService.submit({
    batch_no: "B-001", plan_id: 1, device_id: "tablet-07", operator_id: 10, base_revision_no: 1,
    steps: [
      { step_id: 1, step_order: "1", technique: "除尘(修订)", material_used: "软毛刷+吹气球", operator_id: 10, step_status: "DONE" },
      { step_order: "2", technique: "补色", material_used: "矿物颜料 3g", operator_id: 10, step_status: "PLANNED" }
    ],
    images: [
      { version_no: "IMG-1", image_type: "AFTER", file_path: "/field/b001-1.jpg", capture_at: "2026-09-28T10:00:00Z", note: "修复后" }
    ]
  });
  assert.equal(out.batch.status, OFFLINE_BATCH_STATUS.MERGED);
  assert.equal(out.result.merged_revision_no, 2);
  assert.deepEqual(out.result.applied_step_ids.sort(), [1, 2]);
  assert.deepEqual(out.result.applied_image_versions, ["IMG-1"]);
  assert.equal(restorationStepRepository.findById(1)!.material_used, "软毛刷+吹气球");
  assert.equal(imageVersionRepository.findByVersionNo(1, "IMG-1")!.file_path, "/field/b001-1.jpg");
});

// 规则二：同一离线批次重传沿用首次结果，不重复并入。
test("重传幂等：沿用首次归并结果，不重复建步骤/影像，retransmit=true", () => {
  const stepCountBefore = restorationStepRepository.findAll().length;
  const imageCountBefore = imageVersionRepository.findAll().length;
  const again = offlineBatchService.submit({
    batch_no: "B-001", plan_id: 1, device_id: "tablet-07", operator_id: 10, base_revision_no: 1,
    steps: [
      { step_id: 1, step_order: "1", technique: "除尘(修订)", material_used: "软毛刷+吹气球", operator_id: 10, step_status: "DONE" },
      { step_order: "2", technique: "补色", material_used: "矿物颜料 3g", operator_id: 10, step_status: "PLANNED" }
    ],
    images: [
      { version_no: "IMG-1", image_type: "AFTER", file_path: "/field/b001-1.jpg", capture_at: "2026-09-28T10:00:00Z", note: "修复后" }
    ]
  });
  assert.equal(again.result.retransmit, true);
  assert.equal(again.result.id, offlineBatchService.listResults("B-001")[0].id);
  assert.equal(restorationStepRepository.findAll().length, stepCountBefore);
  assert.equal(imageVersionRepository.findAll().length, imageCountBefore);
  assert.equal(restorationPlanRepository.findById(1)!.revision_no, 2, "重传不再次推进修订号");
});

// 规则三：两个修复师先后改同一方案字段，三方合并保留双方各一份并标冲突。
test("双方改过同一字段：各留一份并标冲突，方案不可归档", () => {
  resetStore();
  // 中央侧（回馆前）另一修复师已把 method 改为「乙醇清洁」，修订号推进到 2。
  const plan = restorationPlanRepository.findById(1)!;
  plan.method = "乙醇清洁";
  plan.revision_no = 2;

  const out = offlineBatchService.submit({
    batch_no: "B-002", plan_id: 1, device_id: "tablet-07", operator_id: 11, base_revision_no: 1,
    base_plan: { method: "干法清理" },
    plan_patch: { method: "等离子除尘" },
    steps: [{ step_id: 1, step_order: "1", technique: "等离子", material_used: "设备A", operator_id: 11, step_status: "PLANNED", base_material_used: "软毛刷" }],
    images: [{ version_no: "IMG-9", image_type: "DURING", file_path: "/field/b002.jpg", capture_at: "2026-09-28T11:00:00Z" }]
  });

  assert.equal(out.batch.status, OFFLINE_BATCH_STATUS.MERGED_WITH_CONFLICTS);
  assert.equal(out.result.plan_archivable, false);
  assert.equal(out.result.held_step_count, 1, "基线已变：步骤不自动并入");
  assert.equal(out.result.held_image_count, 1, "基线已变：影像不自动并入");
  assert.equal(out.result.applied_step_ids.length, 0);
  assert.equal(out.result.applied_image_versions.length, 0);

  const fieldConflict = mergeConflictRepository
    .findByBatch("B-002")
    .find((c) => c.field_name === "method")!;
  assert.ok(fieldConflict, "字段冲突存在");
  assert.equal(fieldConflict.base_value, "干法清理");
  assert.equal(fieldConflict.central_value, "乙醇清洁");
  assert.equal(fieldConflict.offline_value, "等离子除尘");
  assert.equal(plan.method, "乙醇清洁", "冲突字段不自动采用任一侧");
});

// 规则四：冲突未处理完不能归档，其他读取进度照常。
test("归档闸门：有 OPEN 冲突时归档 409，列表/查询照常可用", () => {
  assert.ok(offlineBatchService.list().length >= 1);
  assert.ok(restorationPlanService.list().length >= 1);
  assert.throws(
    () => restorationPlanService.archive(1, 99),
    (error: unknown) => error instanceof BusinessError && error.status === 409 && error.code === "UNRESOLVED_CONFLICT"
  );
});

// 规则五：逐条裁决；采用离线侧则并入并推进修订号，全部处理完才可归档。
test("裁决后并入：KEEP_OFFLINE 应用离线内容，全部解决后允许归档", () => {
  const conflicts = mergeConflictRepository.findByBatch("B-002");
  assert.equal(conflicts.length, 3, "字段+步骤+影像三条冲突");

  const field = conflicts.find((c) => c.field_name === "method")!;
  const resolved = mergeConflictService.resolve(field.id, { resolution: "KEEP_OFFLINE", operator_id: 99 });
  assert.equal(resolved.status, "RESOLVED");
  assert.equal(restorationPlanRepository.findById(1)!.method, "等离子除尘");
  assert.equal(restorationPlanRepository.findById(1)!.revision_no, 3);

  // 还有两条冲突，仍不可归档。
  assert.throws(() => restorationPlanService.archive(1, 99), BusinessError);

  const step = conflicts.find((c) => c.conflict_type === "STEP")!;
  mergeConflictService.resolve(step.id, { resolution: "KEEP_OFFLINE", operator_id: 99 });
  const image = conflicts.find((c) => c.conflict_type === "IMAGE")!;
  mergeConflictService.resolve(image.id, { resolution: "KEEP_OFFLINE", operator_id: 99 });

  const batch = offlineBatchService.getByBatchNo("B-002");
  assert.equal(batch.status, OFFLINE_BATCH_STATUS.MERGED, "冲突清空后批次转 MERGED");
  assert.equal(restorationStepRepository.findById(1)!.technique, "等离子");
  assert.ok(imageVersionRepository.findByVersionNo(1, "IMG-9"));
  const archived = restorationPlanService.archive(1, 99);
  assert.equal(archived.approval_status, "ARCHIVED");
});

// 规则六：只有一侧改动时干净并入（离线未动保留中央 / 中央未动快进离线）。
test("单方改动不产生冲突：中央侧独改保留，离线侧独改快进", () => {
  resetStore();
  const plan = restorationPlanRepository.findById(1)!;
  plan.plan_title = "方案甲-改"; // 中央独改，离线未带该字段
  plan.revision_no = 2;
  const out = offlineBatchService.submit({
    batch_no: "B-003", plan_id: 1, device_id: "tablet-08", operator_id: 12, base_revision_no: 2,
    base_plan: { plan_title: "方案甲-改", method: "干法清理", risk_assessment: "低" },
    plan_patch: { risk_assessment: "中（材料老化）" }
  });
  assert.equal(out.batch.status, OFFLINE_BATCH_STATUS.MERGED);
  assert.equal(restorationPlanRepository.findById(1)!.plan_title, "方案甲-改");
  assert.equal(restorationPlanRepository.findById(1)!.risk_assessment, "中（材料老化）");
  assert.equal(mergeConflictRepository.findAll().length, 0);
});

// 规则七：归并失败（方案不存在）原批次保留为 FAILED，可按同批次号修正后重试成功。
test("失败保留并重试：FAILED 批次重试成功且 attempts 累计", () => {
  resetStore();
  assert.throws(
    () =>
      offlineBatchService.submit({
        batch_no: "B-004", plan_id: 999, device_id: "tablet-09", operator_id: 13, base_revision_no: 1
      }),
    (error: unknown) => error instanceof BusinessError && error.code === "MERGE_FAILED"
  );
  const failed = offlineBatchService.getByBatchNo("B-004");
  assert.equal(failed.status, OFFLINE_BATCH_STATUS.FAILED);
  assert.ok(failed.last_error, "原报文与错误原因保留");

  const retried = offlineBatchService.submit({
    batch_no: "B-004", plan_id: 1, device_id: "tablet-09", operator_id: 13, base_revision_no: 1,
    plan_patch: { plan_title: "方案甲-现场修订" }
  });
  assert.equal(retried.batch.status, OFFLINE_BATCH_STATUS.MERGED);
  assert.ok(retried.batch.attempts >= 1, "attempts 累计");
  assert.equal(restorationPlanRepository.findById(1)!.plan_title, "方案甲-现场修订");
});

// 规则八：载荷校验失败不入库。
test("非法批次（缺批次号/方案号）拒绝", () => {
  const before = offlineBatchService.list().length;
  assert.throws(
    () =>
      offlineBatchService.submit({
        batch_no: "", plan_id: 1, device_id: "t", operator_id: 1, base_revision_no: 1
      }),
    (error: unknown) => error instanceof BusinessError && error.code === "VALIDATION_FAILED"
  );
  assert.equal(offlineBatchService.list().length, before);
});

console.info(`\n${passed} 个用例全部通过`);
