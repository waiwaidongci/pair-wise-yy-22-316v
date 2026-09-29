import { centralStore } from "./centralStore";
import type { RestorationStep } from "../models/RestorationStep";

export const restorationStepRepository = {
  findAll: (): RestorationStep[] => centralStore.restorationStep,
  findByPlan: (planId: number): RestorationStep[] =>
    centralStore.restorationStep.filter((row) => row.plan_id === planId),
  findById: (id: number): RestorationStep | undefined =>
    centralStore.restorationStep.find((row) => row.id === id),
  save: (row: RestorationStep): RestorationStep => {
    centralStore.restorationStep.push(row);
    return row;
  },
  update: (id: number, patch: Partial<RestorationStep>): RestorationStep | undefined => {
    const row = centralStore.restorationStep.find((item) => item.id === id);
    if (!row) return undefined;
    Object.assign(row, patch);
    return row;
  }
};
