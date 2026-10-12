import type { RecordView } from '@nocobase/lifecycle/react';
import type {
  ApprovalTimeline,
  RunView,
  UpcomingStage,
  TaskActions,
  RunActions,
} from '@nocobase/app-plugin-approval/client';
export interface Person {
  id: string;
  name: string;
}
export type Operation = 'use' | 'borrow' | 'scrap';
export interface RequestInput {
  operation: Operation;
  category: string | null;
  assetIds: string[];
  quantity: number;
  purpose: string;
  borrowDueDate: string | null;
  scrapReason: string;
  photos: string[];
}
export interface AssetOption {
  id: string;
  code: string;
  name?: string;
  category: string;
  serialNumber: string | null;
  status: string;
  version: number;
}
export interface RequestRecord extends Partial<RequestInput> {
  id?: string;
  number?: string | null;
  status?: string;
  lifecycleVersion?: number;
  applicantId?: string;
  applicant?: Person;
  createdById?: string;
  departmentId?: string | null;
  allocation?: AssetOption[] | null;
  appraisalOpinion?: string | null;
  handlingReason?: string | null;
  exceptionReason?: string | null;
  updatedAt?: string;
  createdAt?: string;
}
export interface Detail {
  record: RequestRecord;
  users: Person[];
  timeZone: string;
  view: RecordView;
  runs: RunView[];
  taskActions: TaskActions[];
  runActions: RunActions[];
  upcoming: UpcomingStage[];
  timeline: ApprovalTimeline;
}
export interface Options {
  employee: { id: string; name: string; status: string } | null;
  department: Person | null;
  head: Person | null;
  administrative: boolean;
  eligible: boolean;
  eligibleReason: string | null;
  categories: { code: string; title: string }[];
  timeZone: string;
}
export interface Page<T> {
  data: T[];
  meta: { page: number; pageSize: number; total: number };
}
export interface SourceContext {
  reload?: () => void;
  detail?: Detail;
  updateDetail?: (detail: Detail) => void;
}
export const EDIT_FIELDS = [
  'operation',
  'category',
  'assetIds',
  'quantity',
  'purpose',
  'borrowDueDate',
  'scrapReason',
  'photos',
  'lifecycleVersion',
] as const;
export function editableRecord(
  record: RequestRecord | undefined,
): record is RequestRecord & RequestInput & { lifecycleVersion: number } {
  return !!record && EDIT_FIELDS.every((key) => Object.hasOwn(record, key));
}
export function fullAllocation(record: RequestRecord) {
  return (
    (record.status !== 'issuing' ||
      (Object.hasOwn(record, 'category') &&
        typeof record.category === 'string' &&
        !!record.category)) &&
    typeof record.quantity === 'number' &&
    Array.isArray(record.allocation) &&
    record.allocation.length === record.quantity &&
    record.allocation.every((a) =>
      ['id', 'code', 'serialNumber', 'version'].every((k) =>
        Object.hasOwn(a, k),
      ),
    )
  );
}
export function statusOf(error: unknown) {
  return error && typeof error === 'object' && 'status' in error
    ? Number(error.status)
    : undefined;
}

export function requestInput(value: Partial<RequestInput>): RequestInput {
  return {
    operation: value.operation ?? 'use',
    category: value.category ?? null,
    assetIds: value.assetIds ?? [],
    quantity: value.quantity ?? 1,
    purpose: value.purpose ?? '',
    borrowDueDate: value.borrowDueDate ?? null,
    scrapReason: value.scrapReason ?? '',
    photos: value.photos ?? [],
  };
}
