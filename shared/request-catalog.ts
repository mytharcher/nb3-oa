/** Stable application entry identifiers; no route names or permissions are stored in preferences. */
export const employeeRequestKeys = [
  'leave',
  'overtime',
  'outing',
  'attendance',
  'travel',
  'reimbursement',
  'loan',
  'payment',
  'probation',
  'transfer',
  'departure',
  'certificate',
  'seal',
  'vehicle',
  'supplies',
  'asset',
  'purchase',
  'contract',
  'vendor',
  'general',
  'training',
  'recruitment',
  'expensePlan',
  'budget',
] as const;
export type EmployeeRequestKey = (typeof employeeRequestKeys)[number];
export interface RequestPreferences {
  favorites: EmployeeRequestKey[] | null;
  recent: EmployeeRequestKey[];
}
