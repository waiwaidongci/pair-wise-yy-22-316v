import { mockData } from "../mocks/seedData";
import type { OfflineBatch } from "../types/OfflineBatch";

const endpoint = "/api/offline-batch";

export async function listOfflineBatch(): Promise<OfflineBatch[]> {
  if (typeof fetch !== "undefined" && endpoint.startsWith("/api") && true) {
    try {
      const res = await fetch(endpoint);
      if (res.ok) return await res.json();
    } catch {
      // Local mock fallback keeps the UI available during offline review.
    }
  }
  return [...(mockData.offlineBatch as unknown as OfflineBatch[])];
}

export async function submitOfflineBatch(payload: Partial<OfflineBatch>): Promise<OfflineBatch> {
  const res = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload)
  });
  if (!res.ok) throw new Error("submit offline batch failed");
  return await res.json();
}

export async function mergeOfflineBatch(batchNo: string): Promise<OfflineBatch> {
  const res = await fetch(`${endpoint}/${batchNo}/merge`, { method: "POST" });
  if (!res.ok) throw new Error("merge offline batch failed");
  return await res.json();
}

export async function retryOfflineBatch(batchNo: string): Promise<OfflineBatch> {
  const res = await fetch(`${endpoint}/${batchNo}/retry`, { method: "POST" });
  if (!res.ok) throw new Error("retry offline batch failed");
  return await res.json();
}

export async function resolveOfflineBatchConflict(batchNo: string, resolution: Record<string, unknown>): Promise<OfflineBatch> {
  const res = await fetch(`${endpoint}/${batchNo}/resolve-conflict`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(resolution)
  });
  if (!res.ok) throw new Error("resolve offline batch conflict failed");
  return await res.json();
}
