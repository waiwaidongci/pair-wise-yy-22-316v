import { useState } from "react";
import { StatusBadge } from "./StatusBadge";
import { useMergeConflictStore } from "../../stores/MergeConflictStore";
import { MergeConflictStatusText, MergeConflictTypeText, MergeConflictResolutionText } from "../../constants/offlineSyncText";
import { MERGE_CONFLICT_STATUS } from "../../constants/MergeConflictStatus";
import type { MergeConflict as MergeConflictRow } from "../../types/MergeConflict";

function ValueView({ value }: { value: unknown }) {
  if (value === null || value === undefined || value === "") return <span className="muted">（空）</span>;
  return <code>{typeof value === "string" ? value : JSON.stringify(value)}</code>;
}

// 冲突裁决面板：基线 / 中央档案侧 / 离线批次侧三方内容并列，双方改动各留一份。
export function ConflictPanel({ row }: { row: MergeConflictRow }) {
  const resolve = useMergeConflictStore((state) => state.resolve);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const closed = row.status !== MERGE_CONFLICT_STATUS.OPEN;

  const act = async (resolution: "KEEP_CENTRAL" | "KEEP_OFFLINE") => {
    setBusy(true);
    setError("");
    try {
      await resolve(row.id, resolution, 99);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : String(requestError));
    } finally {
      setBusy(false);
    }
  };

  return (
    <article className="panel conflict">
      <header className="conflict-head">
        <div>
          <strong>#{row.id} · {MergeConflictTypeText[row.conflict_type]} · {row.field_name}</strong>
          <p className="muted">批次 {row.batch_no} / 方案 {row.plan_id} / 当前修订 {row.plan_revision_no ?? "-"}</p>
        </div>
        <StatusBadge value={row.status} />
      </header>
      <div className="conflict-grid">
        <div><span>基线</span><ValueView value={row.base_value} /></div>
        <div className="central"><span>中央档案侧</span><ValueView value={row.central_value} /></div>
        <div className="offline"><span>离线批次侧</span><ValueView value={row.offline_value} /></div>
      </div>
      <footer className="conflict-foot">
        {closed ? (
          <em>
            {MergeConflictStatusText[row.status]}
            {row.resolution ? ` · ${MergeConflictResolutionText[row.resolution]}` : ""}
          </em>
        ) : (
          <>
            <button disabled={busy} onClick={() => void act("KEEP_CENTRAL")}>保留中央侧</button>
            <button className="primary" disabled={busy} onClick={() => void act("KEEP_OFFLINE")}>采用离线侧并并入</button>
          </>
        )}
        {error && <b className="danger">{error}</b>}
      </footer>
    </article>
  );
}
