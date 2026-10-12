import { createHash } from 'node:crypto';
import type { PurchaseRecord } from './contract.js';
/** Supplier quotation basis excludes accounting estimates so unchanged procurement retries can reuse evidence. */
export function purchaseQuoteBasis(
  record: Pick<
    PurchaseRecord,
    'items' | 'purpose' | 'expectedDate' | 'departmentId'
  >,
): string {
  return createHash('sha256')
    .update(
      JSON.stringify([
        record.departmentId,
        record.purpose,
        record.expectedDate,
        record.items.map((i) => [i.name, i.specification, i.quantity, i.unit]),
      ]),
    )
    .digest('hex');
}
