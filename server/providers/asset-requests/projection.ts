import type { AssetRequestRecord } from './contract.js';
const protectedFields = new Set([
  'purpose',
  'photos',
  'scrapReason',
  'borrowDueDate',
  'allocation',
  'originalValueCents',
  'appraisalOpinion',
  'handlingUnits',
  'handlingReason',
  'exceptionReason',
  'ruleSnapshot',
  'approvedFingerprint',
]);
/** SDK history/snapshots are internal JSON, so apply the same field mask as the public record. */
export function projectAssetApprovalJson<T>(
  value: T,
  record: Partial<AssetRequestRecord>,
): T {
  function walk(input: unknown): unknown {
    if (input === null || typeof input !== 'object' || input instanceof Date)
      return input;
    if (Array.isArray(input)) return input.map(walk);
    return Object.fromEntries(
      Object.entries(input)
        .filter(
          ([key]) => !protectedFields.has(key) || Object.hasOwn(record, key),
        )
        .map(([key, item]) => [key, walk(item)]),
    );
  }
  // This preserves the public SDK container shape; protected application-owned JSON properties may be omitted.
  return walk(value) as T;
}
