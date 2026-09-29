import { seed } from "../seed";
import type { OfflineBatch } from "../models/OfflineBatch";

const rows: OfflineBatch[] = seed.offlineBatch.map((row) => ({ ...row, payload: { steps: [...row.payload.steps], images: [...row.payload.images] } })) as unknown as OfflineBatch[];

export const offlineBatchRepository = {
  findAll: () => rows,
  findByBatchNo: (batchNo: string) => rows.find((row) => row.batch_no === batchNo),
  findById: (id: number) => rows.find((row) => row.id === id),
  save: (batch: OfflineBatch) => {
    const idx = rows.findIndex((row) => row.batch_no === batch.batch_no);
    if (idx >= 0) rows[idx] = batch;
    else rows.push(batch);
    return batch;
  },
  nextId: () => (rows.length ? Math.max(...rows.map((row) => row.id)) + 1 : 1)
};
