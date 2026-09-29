import { imageVersionRepository } from "../repositories/ImageVersionRepository";
import type { ImageVersion } from "../models/ImageVersion";

export const imageVersionService = {
  list: () => imageVersionRepository.findAll(),
  create: (row: ImageVersion) => imageVersionRepository.save(row)
};
