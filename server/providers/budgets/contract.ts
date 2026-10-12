import type { DatabaseConnection } from '@nocobase/db';
import { createServiceToken } from '@nocobase/service-provider';

export interface BudgetAccount {
  departmentId: string;
  year: number;
  subject: string;
}
/** All monetary quantities are integer cents; callers convert display amounts. */
export interface BudgetBalance extends BudgetAccount {
  id: string;
  allocatedCents: number;
  heldCents: number;
  usedCents: number;
  availableCents: number;
}
export interface BudgetLedgerEntry {
  id: string;
  budgetId: string;
  kind: string;
  reference: string;
  requestKey: string;
  allocatedDelta: number;
  heldDelta: number;
  usedDelta: number;
  actorId: string;
  reason: string;
  at: Date;
}
export interface BudgetLedgerQuery {
  page: number;
  pageSize: number;
  sort?: 'at' | 'allocatedDelta' | 'heldDelta' | 'usedDelta';
  direction?: 'asc' | 'desc';
}
export interface BudgetCommand extends BudgetAccount {
  requestKey: string;
  reference: string;
  actorId: string;
  reason: string;
}
export interface BudgetService {
  /** Pay one linked claim from a source reservation, retaining the unconsumed hold. */
  consumeHeld(
    input: BudgetCommand & { cents: number; consumptionReference: string },
    connection: DatabaseConnection,
  ): Promise<BudgetBalance>;
  get(
    id: string,
    connection?: DatabaseConnection,
  ): Promise<BudgetBalance | null>;
  list(
    query: BudgetListQuery,
    connection?: DatabaseConnection,
  ): Promise<{ items: BudgetBalance[]; total: number; page: number }>;
  /** Finance allocation/adjustment, audited in the caller transaction. */
  allocate(
    input: BudgetCommand & { deltaCents: number; requireNew?: boolean },
    connection: DatabaseConnection,
  ): Promise<BudgetBalance>;
  /** Set the source document's reservation; insufficient funds rejects the whole write. */
  adjustHold(
    input: BudgetCommand & { cents: number },
    connection: DatabaseConnection,
  ): Promise<BudgetBalance>;
  /** Acceptance consumes the reservation; cancellation releases it. */
  settle(
    input: BudgetCommand,
    connection: DatabaseConnection,
  ): Promise<BudgetBalance>;
  release(
    input: BudgetCommand,
    connection: DatabaseConnection,
  ): Promise<BudgetBalance>;
  /** Move a submitted adjustment's held funds between subjects in the same department/year. */
  transferHeld(
    input: BudgetCommand & { targetSubject: string },
    connection: DatabaseConnection,
  ): Promise<{ source: BudgetBalance; target: BudgetBalance }>;
  ledger(
    account: BudgetAccount,
    query: BudgetLedgerQuery,
    connection?: DatabaseConnection,
  ): Promise<{ items: BudgetLedgerEntry[]; total: number; page: number }>;
  balance(
    account: BudgetAccount,
    connection?: DatabaseConnection,
  ): Promise<BudgetBalance | null>;
}
export interface BudgetListQuery {
  departmentId?: string;
  year?: number;
  subject?: string;
  page: number;
  pageSize: number;
  sort?:
    'year' | 'allocatedCents' | 'heldCents' | 'usedCents' | 'availableCents';
  direction?: 'asc' | 'desc';
}
export const budgetServiceToken =
  createServiceToken<BudgetService>('oa/budget-service');
