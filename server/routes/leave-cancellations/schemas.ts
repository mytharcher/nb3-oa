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
export const LeaveInput = z.strictObject({
  cancelAll: z.boolean(),
  endDate: date,
  endHalf: z.enum(['am', 'pm']),
  reason: z.string().trim().min(1).max(10000),
});
export const CreateLeave = LeaveInput.extend({
  originalLeaveId: z.string().min(1).max(64),
});
export const LeaveParams = z.strictObject({ id: z.string().min(1).max(64) });
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
export const LeaveRecord = z.strictObject({
  id: z.string(),
  originalLeaveId: z.string(),
  cancelAll: z.boolean(),
  baseline: z.record(z.string(), z.json()).nullable(),
  applicantId: z.string(),
  createdById: z.string(),
  number: z.string().nullable(),
  leaveType: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  startHalf: z.enum(['am', 'pm']),
  endHalf: z.enum(['am', 'pm']),
  days: z.union([z.number(), z.string()]),
  reason: z.string(),
  attachments: z.array(z.string()),
  handoverUserId: z.string().nullable(),
  enableDelegation: z.boolean(),
  status: z.string(),
  lifecycleVersion: z.number(),
  ruleSnapshot: z.record(z.string(), z.json()).nullable(),
  hrRecipients: z.array(z.string()),
  requiresHr: z.boolean(),
  managerApproverId: z.string().nullable(),
  createdAt: z.string(),
});
export const Detail = z.strictObject({
  record: LeaveRecord,
  users: z.array(z.strictObject({ id: z.string(), name: z.string() })),
  view: z.json(),
  runs: z.array(z.json()),
  taskActions: z.array(z.json()),
  runActions: z.json(),
  upcoming: z.array(z.json()),
  timeline: z.json(),
});
export const Result = z.json();

export const ActionCandidates = z.strictObject({
  people: z.array(z.strictObject({ id: z.string(), name: z.string() })),
  nextOffset: z.number().int().nonnegative().nullable(),
});
