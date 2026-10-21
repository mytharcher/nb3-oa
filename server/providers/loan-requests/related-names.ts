import type { DatabaseManager, RepositoryPolicy } from '@nocobase/db';
import type { LoanLedgerService } from '../loan-ledger/contract.js';
import type { LoanRequestRecord } from './contract.js';

/** Internal ledger resolution never leaves the facade; only the scoped public number does. */
export async function readLoanLedgerName(
  db: Pick<DatabaseManager, 'repository'>,
  ledger: Pick<LoanLedgerService, 'get'>,
  id: string,
  policy: RepositoryPolicy | undefined,
): Promise<string | null> {
  const read = policy?.read;
  if (
    !read ||
    (read !== true &&
      (!Array.isArray(read.fields) ||
        !read.fields.includes('id') ||
        !read.fields.includes('number')))
  )
    return null;
  const loan = await ledger.get(id);
  if (!loan) return null;
  const row = await db
    .repository<LoanRequestRecord>('loanRequests')
    .withPolicy(policy)
    .findOne({
      filter: { id: loan.sourceId },
      select: (s) => s.fields('id', 'number'),
    });
  return row?.id === loan.sourceId &&
    typeof row.number === 'string' &&
    row.number.trim()
    ? row.number
    : null;
}
