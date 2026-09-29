import { useEffect } from "react";
import { useOfflineBatchStore } from "../stores/OfflineBatchStore";
import { StatusBadge } from "../components/common/StatusBadge";
import { StatCard } from "../components/common/StatCard";
import { EmptyState } from "../components/common/EmptyState";
import { OfflineBatchStatusText } from "../constants/OfflineBatchStatus";
import { formatDate } from "../utils/formatters";
import type { OfflineBatch } from "../types/OfflineBatch";

function statusOf(batch: OfflineBatch) {
  return OfflineBatchStatusText[batch.status as keyof typeof OfflineBatchStatusText] ?? batch.status;
}

function BatchCard({ batch }: { batch: OfflineBatch }) {
  const { merge, retry, resolve } = useOfflineBatchStore();

  return (
    <article className="batch-card">
      <header className="batch-head">
        <div>
          <strong>{batch.batch_no}</strong>
          <span className="muted">方案 #{batch.plan_id} · 基线修订 v{batch.base_revision}</span>
        </div>
        <StatusBadge value={batch.status} />
      </header>

      <p className="muted">修复师 #{batch.created_by} · {formatDate(batch.created_at)}</p>

      <div className="batch-payload">
        <span>步骤 {batch.payload.steps.length} 条</span>
        <span>影像 {batch.payload.images.length} 张</span>
        <span>重试 {batch.retry_count} 次</span>
      </div>

      {batch.status === "MERGED" && batch.result && (
        <div className="batch-result">
          已归并：步骤 {String(batch.result.merged_steps ?? 0)} 条 · 影像 {String(batch.result.merged_images ?? 0)} 张 · 方案修订 → v{String(batch.result.revision ?? batch.base_revision)}
          {batch.result.resolved ? "（冲突已解决）" : ""}
        </div>
      )}

      {batch.status === "CONFLICT" && batch.conflict_details && (
        <div className="batch-conflict">
          <strong>冲突：</strong>
          基线 v{String(batch.conflict_details.base_revision)} → 当前 v{String(batch.conflict_details.current_revision)}，双方改过的内容各留一份并标冲突，未处理完不能归档。
        </div>
      )}

      {batch.status === "FAILED" && batch.conflict_details && (
        <div className="batch-failed">
          <strong>归并失败：</strong>{String(batch.conflict_details.error ?? "未知错误")}，原批次已保留，可重试。
        </div>
      )}

      <footer className="batch-actions">
        {batch.status === "PENDING" && <button onClick={() => merge(batch.batch_no)}>归并</button>}
        {batch.status === "CONFLICT" && <button onClick={() => resolve(batch.batch_no, { note: "manual resolution" })}>解决冲突</button>}
        {batch.status === "FAILED" && <button onClick={() => retry(batch.batch_no)}>重试</button>}
        {batch.status === "MERGED" && <span className="muted">—</span>}
      </footer>
    </article>
  );
}

export function OfflineBatchesPage() {
  const { rows, loading, load } = useOfflineBatchStore();

  useEffect(() => {
    load();
  }, [load]);

  const pending = rows.filter((b) => b.status === "PENDING").length;
  const conflict = rows.filter((b) => b.status === "CONFLICT").length;
  const failed = rows.filter((b) => b.status === "FAILED").length;
  const merged = rows.filter((b) => b.status === "MERGED").length;

  return (
    <main className="page">
      <section className="page-head">
        <div>
          <p className="eyebrow">relic-restore</p>
          <h1>离线批次归并</h1>
        </div>
        <StatusBadge value={conflict > 0 ? "CONFLICT" : "READY"} />
      </section>

      <section className="metrics">
        <StatCard label="待归并" value={pending} />
        <StatCard label="已归并" value={merged} />
        <StatCard label="冲突 / 失败" value={`${conflict} / ${failed}`} />
      </section>

      <section className="panel">
        <h2>批次列表</h2>
        {loading && <p className="muted">加载中…</p>}
        {!loading && rows.length === 0 && <EmptyState title="暂无离线批次" />}
        <div className="batch-list">
          {rows.map((batch) => <BatchCard key={batch.id} batch={batch} />)}
        </div>
      </section>

      <section className="panel">
        <h2>归并规则</h2>
        <ul className="rules">
          <li>同一批次号重传时沿用首次归并结果，不重复并入。</li>
          <li>步骤和影像仅在方案基线修订号未变时并入；基线变更则双方内容各留一份并标冲突。</li>
          <li>冲突未处理完不能归档，其他进度照常可用。</li>
          <li>归并失败后原批次保留，可重试。</li>
        </ul>
      </section>
    </main>
  );
}
