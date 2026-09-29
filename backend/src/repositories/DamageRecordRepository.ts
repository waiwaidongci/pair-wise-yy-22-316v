import { centralStore } from "./centralStore";
import type { DamageRecord } from "../models/DamageRecord";

export const damageRecordRepository = {
  findAll: (): DamageRecord[] => centralStore.damageRecord,
  save: (row: DamageRecord): DamageRecord => {
    centralStore.damageRecord.push(row);
    return row;
  }
};
