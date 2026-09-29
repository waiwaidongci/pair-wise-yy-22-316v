import { useState } from "react";
import { StatCard } from "../components/common/StatCard";
import { StatusBadge } from "../components/common/StatusBadge";
import { ConflictPanel } from "../components/common/ConflictPanel";
import { useOfflineMerge } from "../hooks/useOfflineMerge";
import { createDefaultOfflineBatch } from "../constructors/OfflineBatchConstructor";
import { OfflineBatchStatusText } from "../constants/offlineSyncText";
import { MERGE_CONFLICT_STATUS } from "../constants/MergeConflictStatus";
import type { OfflineBatchSubmitPayload } from "../types/OfflineBatch";

// 三个内置剧本，方便现场断网-回馆归并的演示与验收。
const SCENARIOS: Record<string, () => OfflineBatchSubmitPayload> = {
  fastForward: () =>
    createDefaultOfflineBatch({
      batch_no: "FIELD-20260928-A",
      plan_id: 3,
      device_id: "tablet-07",
      operator_id: 10,
      base_revision_no: 1,
      steps: [
        { step_order: "1", technique: "机械除尘", material_used: "软毛刷 1把", operator_id: 10, step_status: "DONE" },
        { step_order: "2", technique: "裂隙粘合", material_used: "鱼鳔胶 2ml", operator_id: 10, step_status: "PLANNED" }
      ],
      images: [
        { version_no: "IMG-FIELD-A1", image_type: "DURING", file_path: "/field/a1.jpg", capture_at: "2026-09-28T10:12:00Z", note: "除尘后" }
      ]
    }),
  bothSides: () =>
    createDefaultOfflineBatch({
      batch_no: "FIELD-20260928-B",
      plan_id: 2,
      device_id: "tablet-07",
      operator_id: 11,
      base_revision_no: 1,
      base_plan: { risk_assessment: "低风险（初评）" },
      plan_patch: { risk_assessment: "高：釉面酥粉，需控湿" },
      steps: [
        { step_id: 2, step_order: "2", technique: "乙醇点洁(现场改)", material_used: "无水乙醇 5ml", operator_id: 11, step_status: "PLANNED", base_material_used: "材料待补" }
      ],
      images: [
        { version_no: "IMG-FIELD-B1", image_type: "BEFORE", file_path: "/field/b1.jpg", capture_at: "2026-09-28T15:40:00Z", note: "背光裂隙" }
      ]
    }),
  retry: () =>
    createDefaultOfflineBatch({
      batch_no: "FIELD-20260928-C",
      plan_id: 999,
      device_id: "tablet-09",
      operator_id: 12,
      base_revision_no: 1,
      plan_patch: { plan_title: "首次必然失败：方案不存在，改 plan_id 后同号重试" }
    })
};

export function OfflineSyncPage() {
  const { batches, results, conflicts, loading, message, error, refresh, sync } = useOfflineMerge();
  const [draft, setDraft] = useState<OfflineBatchSubmitPayload>(SCENARIOS.fastForward());
  const [raw, setRaw] = useState(JSON.stringify(SCENARIOS.fastForward(), null, 2));

  const openConflicts = conflicts.filter((row) => row.status === MERGE_CONFLICT_STATUS.OPEN);
  const blockedPlans = new Set(openConflicts.map((row) => row.plan_id));

  const loadScenario = (key: keyof typeof SCENARIOS) => {
    const payload = SCENARIOS[key]();
    setDraft(payload);
    setRaw(JSON.stringify(payload, null, 2));
  };

  const submit = async () => {
    try {
      const parsed = JSON.parse(raw) as OfflineBatchSubmitPayload;
      setDraft(parsed);
      await sync(parsed);
      await refresh();
    } catch (parseError) {
      alert(`批次 JSON 无法解析：${parseError instanceof Error ? parseError.message : String(parseError)}`);
    }
  };

  return (
    <main className="page">
      <section className="page-head">
        <div>
          <p className="eyebrow">offline reconciliation</p>
          <h1>离线批次归并中心</h1>
          <p className="muted">按批次号与方案修订号归并：重传沿用首次结果；步骤与影像仅在基线未变时并入；双方改动各留一份并标冲突，冲突处理完才能归档。</p>
        </div>
        <StatusBadge value={loading ? "PENDING" : openConflicts.length > 0 ? "MERGED_WITH_CONFLICTS" : "MERGED"} />
      </section>

      <section className="metrics">
        <StatCard label="已收回批次" value={batches.length} />
        <StatCard label="待裁决冲突" value={openConflicts.length} />
        <StatCard label="被拦归档方案" value={blockedPlans.size} />
      </section>

      <section className="workbench">
        <div className="panel wide">
          <h2>待上报 / 重试批次</h2>
          <p className="muted">
            剧本：
            <button onClick={() => loadScenario("fastForward")}>基线未变快进</button>
            <button onClick={() => loadScenario("bothSides")}>双方改动冲突</button>
            <button onClick={() => loadScenario("retry")}>失败后重试</button>
          </p>
          <textarea className="payload" rows={14} value={raw} onChange={(event) => setRaw(event.target.value)} />
          <div className="conflict-foot">
            <button className="primary" onClick={() => void submit()} disabled={loading}>回馆上报 / 同号重传 / 重试</button>
            <button onClick={() => void refresh()}>刷新</button>
            {message && <b className="ok">{message}</b>}
            {error && <b className="danger">{error}</b>}
          </div>
          <p className="muted">当前草稿批次号：{draft.batch_no}，方案基线修订号：{draft.base_revision_no}</p>
        </div>

        <div className="panel">
          <h2>归并规则</h2>
          <ul className="rules">
            <li>同批次号重传 → 直接返回首次结果，不重复并入。</li>
            <li>基线修订号一致 → 步骤、材料用量、影像版本整批快进。</li>
            <li>基线已变 → 步骤和影像挂起，双方内容各留一份。</li>
            <li>方案字段双方都改 → 三方合并标 OPEN 冲突。</li>
            <li>有 OPEN 冲突 → 方案归档被拦截，其他进度照常。</li>
            <li>归并失败 → 原批次保留 FAILED，按同批次号重试。</li>
          </ul>
        </div>
      </section>

      <section className="panel wide">
        <h2>冲突裁决（{conflicts.length}）</h2>
        {conflicts.length === 0 ? (
          <p className="muted">暂无冲突。基线已变的批次归并后，步骤/影像与双方同改字段会出现在这里。</p>
        ) : (
          <div className="conflict-list">
            {conflicts.map((row) => <ConflictPanel key={row.id} row={row} />)}
          </div>
        )}
      </section>

      <section className="panel wide">
        <h2>批次与归并结果</h2>
        <div className="table">
          {batches.map((batch) => {
            const result = results.find((row) => row.batch_no === batch.batch_no);
            return (
              <article key={batch.batch_no} className="row">
                <strong>{batch.batch_no}</strong>
                <span>
                  方案 {batch.plan_id} · 基线 r{batch.base_revision_no}
                  {result ? ` → r${result.merged_revision_no}` : ""} · 尝试 {batch.attempts}
                  {batch.last_error ? ` · ${batch.last_error}` : ""}
                </span>
                <span title={OfflineBatchStatusText[batch.status]}>
                  <StatusBadge value={batch.status} />
                </span>
              </article>
            );
          })}
          {batches.length === 0 && <p className="muted">还没有回馆批次。</p>}
        </div>
      </section>
    </main>
  );
}
