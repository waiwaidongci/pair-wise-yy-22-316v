import { centralStore } from "./centralStore";
import type { RelicItem } from "../models/RelicItem";

export const relicItemRepository = {
  findAll: (): RelicItem[] => centralStore.relicItem,
  save: (row: RelicItem): RelicItem => {
    centralStore.relicItem.push(row);
    return row;
  }
};
