import { restorationStepRepository } from "../repositories/RestorationStepRepository";
import type { RestorationStep } from "../models/RestorationStep";

export const restorationStepService = {
  list: () => restorationStepRepository.findAll(),
  create: (row: RestorationStep) => restorationStepRepository.save(row)
};
