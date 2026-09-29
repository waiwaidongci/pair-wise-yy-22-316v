import { centralStore } from "./centralStore";
import type { OfflineBatch } from "../models/OfflineBatch";
import type { OfflineBatchPayload } from "../types/OfflineBatchPayload";
import { OFFLINE_BATCH_STATUS } from "../constants/OfflineBatchStatus";

let batchSeq = 100;

export const offlineBatchRepository = {
  findAll: (): OfflineBatch[] => centralStore.offlineBatch,
  findByBatchNo: (batchNo: string): OfflineBatch | undefined =>
    centralStore.offlineBatch.find((row) => row.batch_no === batchNo),
  create: (payload: OfflineBatchPayload): OfflineBatch => {
    const row: OfflineBatch = {
      id: (batchSeq += 1),
      ...payload,
      base_plan: payload.base_plan ?? {},
      plan_patch: payload.plan_patch ?? {},
      steps: payload.steps ?? [],
      images: payload.images ?? [],
      status: OFFLINE_BATCH_STATUS.PENDING,
      attempts: 0,
      received_at: new Date().toISOString()
    };
    centralStore.offlineBatch.push(row);
    return row;
  },
  update: (batchNo: string, patch: Partial<OfflineBatch>): OfflineBatch | undefined => {
    const row = centralStore.offlineBatch.find((item) => item.batch_no === batchNo);
    if (!row) return undefined;
    Object.assign(row, patch);
    return row;
  }
};
