import { centralStore } from "./centralStore";
import type { ImageVersion } from "../models/ImageVersion";

export const imageVersionRepository = {
  findAll: (): ImageVersion[] => centralStore.imageVersion,
  findByPlan: (planId: number): ImageVersion[] =>
    centralStore.imageVersion.filter((row) => row.plan_id === planId),
  findByVersionNo: (planId: number, versionNo: string): ImageVersion | undefined =>
    centralStore.imageVersion.find((row) => row.plan_id === planId && row.version_no === versionNo),
  save: (row: ImageVersion): ImageVersion => {
    centralStore.imageVersion.push(row);
    return row;
  }
};
