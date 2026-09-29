import { centralStore } from "./centralStore";
import type { RestorationPlan } from "../models/RestorationPlan";

export const restorationPlanRepository = {
  findAll: (): RestorationPlan[] => centralStore.restorationPlan,
  findById: (id: number): RestorationPlan | undefined =>
    centralStore.restorationPlan.find((row) => row.id === id),
  save: (row: RestorationPlan): RestorationPlan => {
    centralStore.restorationPlan.push(row);
    return row;
  },
  update: (id: number, patch: Partial<RestorationPlan>): RestorationPlan | undefined => {
    const row = centralStore.restorationPlan.find((item) => item.id === id);
    if (!row) return undefined;
    Object.assign(row, patch);
    return row;
  }
};
