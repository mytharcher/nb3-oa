import { z } from 'zod';
const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine(
    (s) =>
      Number.isFinite(Date.parse(`${s}T00:00:00Z`)) &&
      new Date(`${s}T00:00:00Z`).toISOString().slice(0, 10) === s,
    'Invalid date',
  );
export const AttendanceChangeInput = z.strictObject({
  date: date,
  originalAttendanceId: z.string().min(1).max(64),
  originalVersion: z.number().int().nonnegative(),
  correctionAt: z.string().datetime({ offset: true }),
  reason: z.string().trim().min(1).max(10000),
  proof: z.string().trim().max(10000).default(''),
  attachments: z.array(z.string().min(1).max(128)).max(10).default([]),
});
export const CreateAttendanceChange = AttendanceChangeInput.safeExtend({
  applicantId: z.string().min(1).optional(),
});
export const AttendanceChangeParams = z.strictObject({
  id: z.string().min(1).max(64),
});
export const ListQuery = z.strictObject({
  view: z.enum(['mine', 'pending', 'done', 'copied']).default('mine'),
});
export const TransitionInput = z.strictObject({
  transition: z.enum(['edit', 'submit', 'withdraw', 'terminate']),
  version: z.number().int().nonnegative(),
  requestId: z.string().min(1).max(128),
  input: z.record(z.string(), z.json()).default({}),
});
export const ActionInput = z.strictObject({
  target: z.union([
    z.strictObject({ taskId: z.string().min(1) }),
    z.strictObject({ runId: z.string().min(1) }),
  ]),
  action: z.string().min(1),
  input: z.record(z.string(), z.json()).optional(),
  comment: z.string().max(10000).optional(),
  contentHash: z.string().optional(),
  requestId: z.string().min(1).max(128),
});
export const AttendanceChangeRecord = z.strictObject({
  id: z.string(),
  applicantId: z.string(),
  createdById: z.string(),
  number: z.string().nullable(),
  date: z.string(),
  originalAttendanceId: z.string(),
  originalVersion: z.number().int(),
  correctionAt: z.string(),
  proof: z.string(),
  attachments: z.array(z.string()),
  reason: z.string(),
  status: z.string(),
  lifecycleVersion: z.number(),
  ruleSnapshot: z.record(z.string(), z.json()).nullable(),
  hrRecipients: z.array(z.string()),
  managerApproverId: z.string().nullable(),
  createdAt: z.string(),
});
export const Detail = z.strictObject({
  timeZone:z.string(),
  record: AttendanceChangeRecord,
  users: z.array(z.strictObject({ id: z.string(), name: z.string() })),
  view: z.json(),
  runs: z.array(z.json()),
  taskActions: z.array(z.json()),
  runActions: z.json(),
  upcoming: z.array(z.json()),
  timeline: z.json(),
});
const User = z.strictObject({ id: z.string(), name: z.string() });
export const List = z.array(
  AttendanceChangeRecord.extend({
    applicant: User.nullable(),
    createdBy: User.nullable(),
    managerApprover: User.nullable(),
    hrUsers: z.array(User),
  }),
);
export const Result = z.object({
  record: AttendanceChangeRecord,
  entry: z.json(),
  effectRuns: z.array(z.json()),
  replayed: z.boolean().optional(),
});
export const ActionResult = z.json();

export const ActionCandidates = z.strictObject({
  people: z.array(z.strictObject({ id: z.string(), name: z.string() })),
  nextOffset: z.number().int().nonnegative().nullable(),
});
