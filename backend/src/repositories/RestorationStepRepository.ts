import { seed } from "../seed";
import type { RestorationStep } from "../models/RestorationStep";

const rows: RestorationStep[] = seed.restorationStep.map((row) => ({ ...row })) as unknown as RestorationStep[];

export const restorationStepRepository = {
  findAll: () => rows,
  findById: (id: number) => rows.find((row) => row.id === id),
  findByPlanId: (planId: number) => rows.filter((row) => row.plan_id === planId),
  save: (row: RestorationStep) => {
    const idx = rows.findIndex((r) => r.id === row.id);
    if (idx >= 0) rows[idx] = row;
    else rows.push(row);
    return row;
  },
  nextId: () => (rows.length ? Math.max(...rows.map((row) => row.id)) + 1 : 1)
};
