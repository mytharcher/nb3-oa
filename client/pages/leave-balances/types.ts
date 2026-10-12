export interface Balance {
  employeeId: string;
  leaveType: string;
  availableUnits: number;
  heldUnits: number;
}
export interface Ledger {
  id: string;
  kind: 'grant' | 'hold' | 'deduct' | 'release' | 'expire' | 'refund';
  availableDelta: number;
  heldDelta: number;
  at: string;
  expiresAt: string | null;
  reference: string;
  actor: { id: string; name: string } | null;
  reason: string | null;
}
export interface Page<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number };
}
export interface LeaveType {
  code: string;
  label: Record<string, string>;
  active: boolean;
  extra?: { deductsBalance?: boolean };
}
export interface BalanceContext {
  employeeId: string;
  employeeName: string;
  types: LeaveType[];
  onAdjusted: (balance: Balance) => void;
}
export const BALANCE_SETTINGS = 'oa.leaveBalances';
export function adjustmentUnits(days: string): number | null {
  if (!days.trim()) return null;
  const n = Number(days) * 2;
  return Number.isInteger(n) && n !== 0 && Math.abs(n) <= 2_000_000_000
    ? n
    : null;
}
