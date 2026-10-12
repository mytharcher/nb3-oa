import type { DatabaseConnection } from '@nocobase/db';
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';
export interface LeaveAccount {
  employeeId: string;
  leaveType: string;
}
/** Integer half-days. References identify the leave request, not the user. */
export interface LeaveBalanceCommand extends LeaveAccount {
  requestKey: string;
  reference: string;
  units?: number;
  actorId?: string | null;
  reason?: string;
  at?: Date;
}
export interface LeaveGrantCommand extends LeaveBalanceCommand {
  units: number;
  expiresAt?: Date | null;
}
export interface LeaveBalance extends LeaveAccount {
  availableUnits: number;
  heldUnits: number;
}
export interface LeaveLedgerSort {
  field: 'at' | 'availableDelta' | 'heldDelta';
  direction: 'asc' | 'desc';
}
export interface LeaveLedgerEntry extends LeaveAccount {
  id: string;
  kind: 'grant' | 'hold' | 'deduct' | 'release' | 'expire' | 'refund';
  requestKey: string;
  reference: string;
  lotId: string;
  availableDelta: number;
  heldDelta: number;
  expiresAt: Date | null;
  at: Date;
  actorId: string | null;
  reason: string | null;
}
export interface LeaveBalanceService {
  /** All writes join a caller transaction; this service never locks a user/employee row. */
  grant(
    input: LeaveGrantCommand,
    connection: DatabaseConnection,
  ): Promise<LeaveBalance>;
  hold(
    input: LeaveBalanceCommand & { units: number },
    connection: DatabaseConnection,
  ): Promise<LeaveBalance>;
  /** Sets the reference's total reservation; use a new request key on each revision. */
  adjustHold(
    input: LeaveBalanceCommand & { units: number },
    connection: DatabaseConnection,
  ): Promise<LeaveBalance>;
  /** Deduct/release the entire outstanding reservation. Released references can be adjusted again; deducted ones cannot. */
  deduct(
    input: LeaveBalanceCommand,
    connection: DatabaseConnection,
  ): Promise<LeaveBalance>;
  release(
    input: LeaveBalanceCommand,
    connection: DatabaseConnection,
  ): Promise<LeaveBalance>;
  releaseReference(
    input: {
      employeeId: string;
      reference: string;
      requestKey: string;
      actorId?: string | null;
      at?: Date;
      exceptLeaveType?: string;
    },
    connection: DatabaseConnection,
  ): Promise<void>;
  /** Refund up to the deducted units of this reference; expired lots are refunded then expired atomically. */
  refund(
    input: LeaveBalanceCommand & { units: number },
    connection: DatabaseConnection,
  ): Promise<LeaveBalance>;
  /** Sweep available expired lots, retaining held units until the corresponding flow terminates. */
  expire(
    input: LeaveAccount & { at?: Date },
    connection: DatabaseConnection,
  ): Promise<LeaveBalance>;
  /** Idempotent expiry maintenance, normally invoked once daily in the platform calendar time zone. */
  expireDue(at?: Date): Promise<number>;
  /** Audited HR change: positive grants, negative expires only available units, never touches a hold. */
  adjust(
    input: LeaveGrantCommand,
    connection: DatabaseConnection,
  ): Promise<LeaveBalance>;
  balance(
    account: LeaveAccount,
    connection?: DatabaseConnection,
  ): Promise<LeaveBalance>;
  list(
    employeeId: string,
    connection?: DatabaseConnection,
  ): Promise<LeaveBalance[]>;
  ledger(
    account: LeaveAccount,
    page: number,
    pageSize: number,
    sort?: LeaveLedgerSort,
  ): Promise<{ items: LeaveLedgerEntry[]; total: number }>;
}
export const leaveBalanceServiceToken: ServiceToken<LeaveBalanceService> =
  createServiceToken<LeaveBalanceService>('oa/leave-balance-service');
