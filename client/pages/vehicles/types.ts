import type {
  TaskActions,
  RunActions,
  RunView,
  ApprovalTimeline,
} from '@nocobase/app-plugin-approval/client';
import type { RecordView } from '@nocobase/lifecycle/react';
export interface Person {
  id: string;
  name: string;
}
export interface Vehicle {
  id: string;
  name: string;
  plateNumber: string;
  vehicleType: string;
  capacity: number;
  status: 'active' | 'inactive' | 'maintenance';
  version: number;
}
export interface Driver {
  id: string;
  employeeId: string;
  active: boolean;
  version: number;
  employee: { id: string; user: Person };
}
export interface Input {
  purpose: string;
  destination: string;
  startAt: string;
  endAt: string;
  passengers: number;
  needsDriver: boolean;
}
export interface Request extends Input {
  id: string;
  applicantId: string;
  createdById: string;
  number: string | null;
  status: string;
  lifecycleVersion: number;
  createdAt: string;
  applicant?: Person;
}
export interface Detail {
  record: Request;
  users: Person[];
  timeZone: string;
  view: RecordView;
  runs: RunView[];
  taskActions: TaskActions[];
  runActions: RunActions[];
  timeline: ApprovalTimeline;
  transitions: string[];
  canViewCost: boolean;
}
export interface Options {
  actor: Person;
  timeZone: string;
  canCreate: boolean;
  canManage: boolean;
  canManageDrivers: boolean;
}
export interface Facts {
  dispatch: null | {
    id: string;
    vehicle: { id: string; name: string; plateNumber: string };
    driver: Person | null;
    dispatchedBy: Person;
    createdAt: string;
  };
  usage: null | {
    id: string;
    mileage: number;
    exception: string;
    registeredBy: Person;
    createdAt: string;
  };
}
export interface Page<T> {
  data: { items: T[]; total: number };
}
export interface Source {
  reload: () => void;
}
export function dateText(value: string, locale: string, zone: string) {
  return new Intl.DateTimeFormat(locale, {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: zone,
  }).format(new Date(value));
}
