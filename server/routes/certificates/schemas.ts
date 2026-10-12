import { z } from 'zod';
export const Id = z.string().min(1).max(64),
  Key = z.string().min(1).max(128);
export const Params = z.strictObject({ id: Id });
export const Fields = {
  certificateType: z.enum(['employment', 'income', 'other']),
  purpose: z.string().trim().min(1).max(2000),
  copies: z.number().int().min(1).max(100),
  deliveryMethod: z.enum(['pickup', 'mail', 'digital']),
};
export const Create = z.strictObject({ ...Fields, requestKey: Key });
export const Edit = z.strictObject({
  ...Fields,
  requestKey: Key,
  expectedVersion: z.number().int().positive(),
});
export const Command = z.strictObject({
  requestKey: Key,
  expectedVersion: z.number().int().positive(),
  reason: z.string().max(2000).optional(),
});
export const Prepare = z.strictObject({
  templateId: Id,
  revisionId: Id,
  issueDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  monthlyCents: z
    .number()
    .int()
    .nonnegative()
    .max(Number.MAX_SAFE_INTEGER)
    .optional(),
  requestKey: Key,
});
export const Action = z.strictObject({
  action: z.string().min(1).max(128),
  target: z.union([
    z.strictObject({ taskId: Id }),
    z.strictObject({ runId: Id }),
  ]),
  requestId: Key,
  contentHash: z.string().optional(),
  comment: z.string().max(5000).optional(),
  input: z
    .strictObject({
      preparationId: Id.optional(),
      to: z.union([Id, z.array(Id).max(100)]).optional(),
      person: Id.optional(),
      mode: z.enum(['before', 'after', 'alongside']).optional(),
      place: Id.optional(),
      override: z.boolean().optional(),
      reason: z.string().max(2000).optional(),
      userId: Id.optional(),
      userIds: z.array(Id).max(100).optional(),
    })
    .optional(),
});
const Person = z.object({ id: Id, name: z.string() });
export const Record = z.object({
  id: Id,
  number: z.string().nullable().optional(),
  ...Fields,
  applicantId: Id,
  applicant: Person,
  createdById: Id,
  createdBy: Person,
  employeeId: Id,
  departmentId: Id,
  preparationId: Id.nullable(),
  issueId: Id.nullable(),
  status: z.string(),
  lifecycleVersion: z.number(),
  submittedAt: z.string().nullable(),
  createdAt: z.string(),
  statusChangedAt: z.string(),
  exceptionReason: z.string().nullable(),
  administrativeReason: z.string().nullable(),
});
export const Detail = z.object({
  capabilities: z.object({
    taskActions: z.array(
      z.object({
        taskId: Id,
        runId: Id,
        contentHash: z.string(),
        actions: z.array(
          z.object({
            name: z.string(),
            options: z.json().optional(),
            primary: z.boolean(),
            tone: z.string(),
          }),
        ),
      }),
    ),
    transitions: z.array(z.string()),
    canIssue: z.boolean(),
    canDownload: z.boolean(),
    preparation: z
      .object({
        id: Id,
        number: z.string(),
        issueDate: z.string(),
        status: z.string(),
        templateId: Id,
        revisionId: Id,
      })
      .nullable(),
    issue: z
      .object({ id: Id, number: z.string(), issueDate: z.string() })
      .nullable(),
  }),
  record: Record,
  tasks: z.array(
    z.object({
      id: Id,
      runId: Id,
      status: z.string(),
      assigneeId: Id.nullable(),
      assignee: Person.nullable(),
    }),
  ),
  runs: z.array(
    z.object({ id: Id, status: z.string(), contentHash: z.string() }),
  ),
  actions: z.array(
    z.object({
      id: Id,
      action: z.string(),
      actorId: Id,
      actor: Person,
      createdAt: z.string(),
    }),
  ),
});
export const Preparation = z.object({
  id: Id,
  number: z.string(),
  issueDate: z.string(),
  status: z.string(),
  revisionId: Id,
});
export const Generated = z.object({
  preparationId: Id,
  generated: z.literal(true),
});

export const Query = z.strictObject({
  q: z.string().trim().max(200).optional(),
  order: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  status: z
    .enum([
      'draft',
      'head',
      'issuing',
      'issued',
      'revision',
      'rejected',
      'withdrawn',
      'terminated',
      'issueException',
      'administrativelyClosed',
    ])
    .optional(),
});
export const List = z.object({
  items: z.array(Record),
  total: z.number().int().nonnegative(),
});
