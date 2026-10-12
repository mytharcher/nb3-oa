import { z } from 'zod';
import { probationCompensationInputSchema } from '../../providers/probation/validation.js';
export const Params = z.strictObject({ id: z.string().min(1).max(64) });
export const Create = z.strictObject({
  employeeId: z.string().min(1).max(64),
  selfEvaluation: z.string().max(10000),
});
export const ListQuery = z.strictObject({
  view: z.enum(['mine', 'pending', 'done', 'copied']).default('mine'),
});
export const Transition = z.strictObject({
  transition: z.enum(['edit', 'submit', 'withdraw', 'terminate']),
  version: z.number().int().nonnegative(),
  requestId: z.string().min(1).max(128),
  input: z.record(z.string(), z.json()).default({}),
});
export const Action = z.strictObject({
  target: z.union([
    z.strictObject({ taskId: z.string().min(1) }),
    z.strictObject({ runId: z.string().min(1) }),
  ]),
  action: z.string().min(1),
  requestId: z.string().min(1).max(128),
  contentHash: z.string().optional(),
  comment: z.string().max(10000).optional(),
  input: z.record(z.string(), z.json()).optional(),
  compensation: probationCompensationInputSchema.optional(),
});
export const Compensation = z
  .strictObject({ gradeId: z.string(), baseSalary: z.string() })
  .nullable();
/** Public fields never include salary amounts. Rejecting a partial grant prevents SDK subjects bypassing field visibility. */
export const publicRecordFields = [
  'id',
  'employeeId',
  'applicantId',
  'createdById',
  'number',
  'probationEndDate',
  'selfEvaluation',
  'evaluation',
  'conclusion',
  'deferredTo',
  'gradeId',
  'compensationProposalId',
  'hrActorId',
  'departmentId',
  'managerApproverId',
  'headApproverId',
  'headMerged',
  'gmApproverId',
  'ruleSnapshot',
  'status',
  'lifecycleVersion',
  'createdAt',
] as const;
export const User = z.strictObject({ id: z.string(), name: z.string() });
export const Options = z.strictObject({
  canCreateManualDraft: z.boolean(),
  timeZone: z.string(),
  actorId: z.string(),
  actor: User.nullable(),
});
export const Record = z.object({
  applicant: User.nullable(),
  createdBy: User.nullable(),
  managerApprover: User.nullable(),
  headApprover: User.nullable(),
  gmApprover: User.nullable(),
  hrActor: User.nullable(),
  id: z.string(),
  employeeId: z.string(),
  applicantId: z.string(),
  createdById: z.string(),
  number: z.string().nullable(),
  probationEndDate: z.string(),
  selfEvaluation: z.string(),
  evaluation: z.string().nullable(),
  conclusion: z.enum(['regular', 'deferred', 'declined']).nullable(),
  deferredTo: z.string().nullable(),
  gradeId: z.string().nullable(),
  compensationProposalId: z.string().nullable(),
  hrActorId: z.string().nullable(),
  departmentId: z.string().nullable(),
  managerApproverId: z.string().nullable(),
  headApproverId: z.string().nullable(),
  headMerged: z.json().nullable(),
  gmApproverId: z.string().nullable(),
  ruleSnapshot: z.json().nullable(),
  status: z.string(),
  lifecycleVersion: z.number().int(),
  createdAt: z.string(),
});
export const Detail = z.object({
  users: z.array(User),
  record: Record,
  timeZone: z.string(),
  view: z.json(),
  runs: z.array(z.json()),
  taskActions: z.array(z.json()),
  runActions: z.array(z.json()),
  upcoming: z.array(z.json()),
  timeline: z.json(),
});

export const CandidatesQuery = z
  .strictObject({
    taskId: z.string().min(1).optional(),
    runId: z.string().min(1).optional(),
    action: z.enum(['transfer', 'addSigner', 'cc', 'appoint', 'reassign']),
    search: z.string().max(255).default(''),
    offset: z.coerce.number().int().nonnegative().default(0),
    limit: z.coerce.number().int().min(1).max(50).default(20),
  })
  .refine((v) => Boolean(v.taskId) !== Boolean(v.runId), {
    message: 'Choose exactly one approval target.',
  })
  .refine(
    (v) =>
      ['cc', 'appoint'].includes(v.action)
        ? Boolean(v.runId)
        : Boolean(v.taskId),
    {
      message: 'Choose the matching task or run target.',
    },
  );

export const CandidatesResult = z.strictObject({
  people: z.array(z.strictObject({ id: z.string(), name: z.string() })),
  nextOffset: z.number().int().nullable(),
});
