import { z } from 'zod';
const id = z.string().min(1).max(64);
export const Params = z.strictObject({ id });
export const Command = z.strictObject({
  requestKey: z
    .string()
    .min(1)
    .max(128)
    .refine((value) => !value.startsWith('$')),
  reason: z.string().trim().min(1).max(10000),
});
export const Proposal = z.strictObject({
  employeeId: id,
  kinds: z
    .array(z.enum(['transfer', 'salaryChange', 'promotion']))
    .min(1)
    .max(3),
  targetDepartmentId: id,
  targetPositionId: id,
  targetGradeId: id,
  targetManagerId: id.nullable(),
  sourceAccountId: id.nullable(),
  targetAccountId: id.nullable(),
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  targetSalary: z
    .string()
    .regex(/^\d+(?:\.\d{1,2})?$/)
    .max(20),
  reason: z.string().trim().min(1).max(10000),
});
export const Create = Command.safeExtend({ proposal: Proposal });
export const Edit = Create.safeExtend({
  version: z.number().int().nonnegative(),
});
export const ReviewEdit = Command.safeExtend({
  patch: Proposal.omit({ employeeId: true }).partial(),
  version: z.number().int().nonnegative(),
});
export const Transition = Command.safeExtend({
  version: z.number().int().nonnegative(),
  transition: z.enum([
    'submit',
    'withdraw',
    'terminate',
    'requestCancellation',
  ]),
});
export const Action = Command.safeExtend({
  target: z.union([
    z.strictObject({ taskId: id }),
    z.strictObject({ runId: id }),
  ]),
  action: z.enum([
    'approve',
    'reject',
    'return',
    'comment',
    'appoint',
    'reassign',
    'read',
    'transfer',
    'addSigner',
    'urge',
    'cc',
  ]),
  input: z.record(z.string(), z.json()).optional(),
  comment: z.string().max(10000).optional(),
  contentHash: z.string().max(128).optional(),
}).superRefine((value, context) => {
  const allowed: Record<string, readonly string[]> = {
    return: ['to'],
    appoint: ['to', 'place'],
    reassign: ['to', 'override'],
    transfer: ['to'],
    addSigner: ['person', 'mode'],
    cc: ['to'],
  };
  for (const key of Object.keys(value.input ?? {}))
    if (!(allowed[value.action] ?? []).includes(key))
      context.addIssue({
        code: 'custom',
        path: ['input', key],
        message: 'Unsupported approval action input.',
      });
});
export const User = z.strictObject({ id: z.string(), name: z.string() });
export const Record = Proposal.omit({ targetSalary: true }).safeExtend({
  id: z.string(),
  applicantId: z.string(),
  privateSalaryRevisionId: z.string(),
  snapshot: z.json().nullable(),
  cancelConfirmerId: z.string().nullable(),
  cancellationReason: z.string().nullable(),
  executionFailureCode: z.string().nullable(),
  status: z.string(),
  lifecycleVersion: z.number(),
  statusChangedAt: z.string(),
  createdAt: z.string(),
});
export const List = z.array(
  Record.safeExtend({ employee: User, users: z.array(User) }),
);
export const Detail = z.strictObject({
  record: Record,
  facts: z.strictObject({
    employee: User,
    department: User,
    position: User,
    grade: User,
    manager: User.nullable(),
  }),
  users: z.array(User),
  view: z.json(),
  runs: z.array(z.json()),
  actions: z.array(z.json()),
  timeline: z.array(z.json()),
});
export const Salary = z.strictObject({
  targetSalary: z.string(),
  currentSalary: z.number().int().safe().optional(),
});

export const CandidatesQuery = z.strictObject({
  taskId: id,
  action: z.enum(['transfer', 'addSigner', 'cc', 'appoint', 'reassign']),
  search: z.string().max(255).default(''),
  offset: z.coerce.number().int().nonnegative().default(0),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
export const Candidates = z.strictObject({
  people: z.array(User),
  nextOffset: z.number().int().nullable(),
});

export const VersionCommand = Command.safeExtend({
  version: z.number().int().nonnegative(),
});

export const ListQuery = z.strictObject({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().max(255).default(''),
  status: z.string().max(32).optional(),
  orderBy: z
    .enum([
      'createdAt:asc',
      'createdAt:desc',
      'effectiveDate:asc',
      'effectiveDate:desc',
      'id:asc',
      'id:desc',
    ])
    .default('createdAt:desc'),
});

export const FormOptionsQuery = z.strictObject({
  requestId: id.optional(),
  mode: z.enum(['create', 'edit', 'reviewEdit']).default('create'),
});
export const FormOptions = z.strictObject({
  canCreateAsHR: z.boolean(),
  editableFields: z.array(z.string()),
  employee: User.nullable(),
  departments: z.array(User),
  positions: z.array(User),
  grades: z.array(User),
  managers: z.array(User),
});

export const Capabilities = z.strictObject({ canCreateAsHR: z.boolean() });

export const CapacityOptionsQuery = z.strictObject({
  employeeId: id,
  targetDepartmentId: id,
  targetPositionId: id,
  effectiveDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  requestId: id.optional(),
  mode: z.enum(['create', 'edit', 'reviewEdit']),
});
export const CapacityOptions = z.strictObject({
  sourceAccountId: id.nullable(),
  targetAccountId: id.nullable(),
});
