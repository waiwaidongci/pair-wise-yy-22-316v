import { seed } from "../seed";
import type { ImageVersion } from "../models/ImageVersion";

const rows: ImageVersion[] = seed.imageVersion.map((row) => ({ ...row })) as unknown as ImageVersion[];

export const imageVersionRepository = {
  findAll: () => rows,
  findById: (id: number) => rows.find((row) => row.id === id),
  findByPlanId: (planId: number) => rows.filter((row) => row.plan_id === planId),
  save: (row: ImageVersion) => {
    const idx = rows.findIndex((r) => r.id === row.id);
    if (idx >= 0) rows[idx] = row;
    else rows.push(row);
    return row;
  },
  nextId: () => (rows.length ? Math.max(...rows.map((row) => row.id)) + 1 : 1)
};
