import type { LeaveRecord, LeaveDetail } from '../approvals/types.js';
export interface CancellationRecord extends LeaveRecord {
  originalLeaveId: string;
  cancelAll: boolean;
  baseline: Record<string, string> | null;
}
export interface CancellationDetail extends Omit<LeaveDetail, 'record'> {
  record: CancellationRecord;
}
export interface CancellationOriginal {
  id: string;
  number: string | null;
  leaveType: string;
  startDate: string;
  endDate: string;
  startHalf: 'am' | 'pm';
  endHalf: 'am' | 'pm';
  days: number | string;
  timeZone: string;
}
export interface SourceContext {
  reload: () => void;
}
export interface DetailContext extends SourceContext {
  detail: CancellationDetail;
  update: (record: CancellationRecord) => void;
}
export { ACTIONS, TAB_VIEW } from '../approvals/types.js';
