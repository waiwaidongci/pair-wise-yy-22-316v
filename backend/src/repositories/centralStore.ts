import { seed } from "../seed";
import type { RelicItem } from "../models/RelicItem";
import type { DamageRecord } from "../models/DamageRecord";
import type { RestorationPlan } from "../models/RestorationPlan";
import type { RestorationStep } from "../models/RestorationStep";
import type { ImageVersion } from "../models/ImageVersion";
import type { OfflineBatch } from "../models/OfflineBatch";
import type { MergeConflict } from "../models/MergeConflict";
import type { MergeResult } from "../models/MergeResult";

// 单一内存档案库：中央档案与离线归并相关的运行态数据都在这里，
// 便于离线批次归并时对同一份方案做三方合并与版本推进。
export interface AuditLogRow {
  id: number;
  actor: string;
  action: string;
  target_type: string;
  target_id: string;
  created_at: string;
}

export interface CentralStore {
  relicItem: RelicItem[];
  damageRecord: DamageRecord[];
  restorationPlan: RestorationPlan[];
  restorationStep: RestorationStep[];
  imageVersion: ImageVersion[];
  offlineBatch: OfflineBatch[];
  mergeConflict: MergeConflict[];
  mergeResult: MergeResult[];
  auditLog: AuditLogRow[];
}

export const centralStore: CentralStore = {
  relicItem: [...seed.relicItem] as RelicItem[],
  damageRecord: [...seed.damageRecord] as DamageRecord[],
  restorationPlan: [...seed.restorationPlan] as RestorationPlan[],
  restorationStep: [...seed.restorationStep] as RestorationStep[],
  imageVersion: [...seed.imageVersion] as ImageVersion[],
  offlineBatch: [],
  mergeConflict: [],
  mergeResult: [],
  auditLog: []
};

let logSeq = 0;

export function appendAuditLog(row: Omit<AuditLogRow, "id" | "created_at">): AuditLogRow {
  const entry: AuditLogRow = {
    id: (logSeq += 1),
    actor: row.actor,
    action: row.action,
    target_type: row.target_type,
    target_id: row.target_id,
    created_at: new Date().toISOString()
  };
  centralStore.auditLog.unshift(entry);
  return entry;
}
