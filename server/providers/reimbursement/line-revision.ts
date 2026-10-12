import { hashOf } from '@nocobase/app-plugin-approval/server';
import type { FinanceLineFact, ReimbursementLine } from './contract.js';
import { ReimbursementAmountError } from './amounts.js';

export function reimbursementLineHash(line: ReimbursementLine): string {
  return hashOf({ ...line });
}
/** A finance return does not grant editing rights over approved or still-unheard evidence. */
export function checkReturnedLineRevision(
  previous: readonly ReimbursementLine[],
  proposed: readonly ReimbursementLine[],
  facts: Readonly<Record<string, FinanceLineFact>>,
): void {
  const fail = (message: string): never => {
    throw new ReimbursementAmountError(
      'REIMBURSEMENT_LINE_REVISION_RESTRICTED',
      message,
    );
  };
  const original = new Map(previous.map((line) => [line.id, line]));
  const edited = new Map(proposed.map((line) => [line.id, line]));
  if (original.size !== previous.length || edited.size !== proposed.length)
    fail('Expense line identities must be unique.');
  if (!Object.values(facts).some((fact) => fact.outcome === 'returned'))
    fail('A finance line correction requires an explicitly returned line.');
  if (proposed.some((line) => !original.has(line.id)))
    fail('A finance correction cannot introduce new expense lines.');
  for (const line of previous) {
    const fact = facts[line.id];
    if (!fact || fact.contentHash !== reimbursementLineHash(line))
      fail(
        'Correction permissions must match the exact submitted line evidence.',
      );
    if (fact.outcome === 'returned') continue;
    const revised = edited.get(line.id);
    if (!revised || reimbursementLineHash(revised) !== fact.contentHash)
      fail(
        'Approved and pending lines remain read-only during a finance correction.',
      );
  }
}
