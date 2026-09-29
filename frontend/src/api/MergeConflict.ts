import type { MergeConflict } from "../types/MergeConflict";
import type { MergeConflictResolution } from "../constants/MergeConflictResolution";
import { ERROR_MESSAGES } from "../constants/errorMessages";

// 档案员裁决冲突：KEEP_CENTRAL 保留中央侧，KEEP_OFFLINE 采用离线批次侧。
export async function resolveMergeConflict(
  conflictId: number,
  resolution: MergeConflictResolution,
  operatorId: number
): Promise<MergeConflict> {
  const res = await fetch(`/api/merge-conflict/${conflictId}/resolve`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ resolution, operator_id: operatorId })
  });
  if (!res.ok) {
    try {
      const body = (await res.json()) as { code?: keyof typeof ERROR_MESSAGES; message?: string };
      throw new Error(
        (body.code && ERROR_MESSAGES[body.code]) || body.message || ERROR_MESSAGES.VALIDATION_FAILED
      );
    } catch (error) {
      throw error instanceof Error ? error : new Error(ERROR_MESSAGES.VALIDATION_FAILED);
    }
  }
  return res.json();
}

export async function archiveRestorationPlan(planId: number, operatorId: number): Promise<unknown> {
  const res = await fetch(`/api/restoration-plan/${planId}/archive`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ operator_id: operatorId })
  });
  if (!res.ok) {
    const body = (await res.json().catch(() => ({}))) as {
      code?: keyof typeof ERROR_MESSAGES;
      message?: string;
    };
    throw new Error(
      (body.code && ERROR_MESSAGES[body.code]) || body.message || ERROR_MESSAGES.UNRESOLVED_CONFLICT
    );
  }
  return res.json();
}
