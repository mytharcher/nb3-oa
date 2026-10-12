export const resource = {
  type: 'composite',
  id: 'oa.attendanceManagement',
} as const;
export interface Shift {
  id: string;
  code: string;
  name: string;
  enabled: boolean;
  currentRevision: number;
  version: number;
}
export interface Interval {
  start: string;
  startDayOffset: 0 | 1;
  end: string;
  endDayOffset: 0 | 1;
}
export interface Definition {
  name: string;
  timeZone: string;
  intervals: Interval[];
  lateToleranceMinutes: number;
  earlyToleranceMinutes: number;
  absenceThresholdMinutes: number;
}
export interface Revision extends Definition {
  id: string;
  shiftId: string;
  revision: number;
  createdBy: { id: string; name: string };
  createdAt: string;
}
export interface CurrentShift {
  shift: Shift;
  revision: Revision;
}
export interface Schedule {
  id: string;
  departmentId: string;
  date: string;
  version: number;
  revision: {
    id: string;
    revision: number;
    shiftRevisionId: string | null;
    restDay: boolean;
    createdBy: { id: string; name: string };
    reason: string;
    createdAt: string;
  };
}
export interface Envelope<T> {
  data: T;
}
export interface ShiftPage {
  data: Shift[];
  meta: { total: number; page: number; pageSize: number };
}
export interface SourceContext {
  basePath: string;
  search: string;
  reload: () => void;
  onShiftSaved: (shift: Shift) => void;
  onScheduleSaved: (schedule: Schedule) => void;
}
