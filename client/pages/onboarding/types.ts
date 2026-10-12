export const resource = { type: 'composite', id: 'oa.onboarding' } as const;
export type Action =
  | 'claim'
  | 'release'
  | 'complete'
  | 'forceComplete'
  | 'transfer'
  | 'reassignMentor';
export type Person = { id: string; name: string };
export type RecordDto = {
  id: string;
  creator: Person;
  employeeId: string;
  userId: string;
  user: Person;
  requisitionId: string;
  departmentId: string;
  positionId: string;
  gradeId: string;
  hireDate: string;
  mentorEmployeeId?: string | null;
  mentorName?: string | null;
  workstationRequirement?: string | null;
  status: 'handling' | 'completed' | 'cancelled';
  version: number;
};
export type Task = {
  id: string;
  kind: string;
  status: 'open' | 'claimed' | 'completed' | 'cancelled';
  assignee: Person | null;
  target: Person | null;
  dueDate: string;
  facts: Record<string, string> | null;
  forced: boolean;
  version: number;
  actions: Action[];
};
export type TimelineEntry = {
  id: string;
  at: string;
  action: string;
  actor: Person | null;
  taskId?: string;
  kind?: string;
  from?: Person;
  to?: Person;
  assetReceiptId?: string;
  sourceTaskId?: string;
  forced?: boolean;
  parentCompleted?: boolean;
  accountEnabled?: boolean;
};
export type Detail = {
  record: RecordDto;
  tasks: Task[];
  timeline: TimelineEntry[];
  timeZone: string;
  canCancel: boolean;
};
export type Source = { basePath: string; reload: () => void };
export const taskFields: Record<string, string[]> = {
  it: ['accountId', 'deviceReference'],
  administration: ['workstation', 'badgeReference'],
  finance: [
    'bankName',
    'bankAccount',
    'bankAccountName',
    'socialInsuranceReference',
  ],
  mentor: ['mentorEmployeeId', 'plan'],
};
export function fieldsFor(kind: string) {
  return kind.startsWith('recovery:')
    ? ['returnReceipt']
    : (taskFields[kind] ?? []);
}
export type Requisition = {
  id: string;
  status: string;
  remaining: number;
  version: number;
  departmentId: string;
  positionId: string;
  gradeId: string;
  sourceYear: number;
};
