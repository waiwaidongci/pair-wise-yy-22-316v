export const OfflineBatchStatus = ["PENDING", "MERGED", "CONFLICT", "FAILED"] as const;
export type OfflineBatchStatus = (typeof OfflineBatchStatus)[number];
