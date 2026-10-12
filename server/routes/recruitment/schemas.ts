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
  departmentId: id,
  positionId: id,
  gradeId: id,
  accountId: id,
  year: z.number().int().min(1900).max(9999),
  quantity: z.number().int().min(1).max(100000),
  kind: z.enum(['additional', 'replacement']),
  replacementEmployeeIds: z.array(id).max(100000),
  minimumCents: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  maximumCents: z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER),
  expectedStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  jobDescription: z.string().trim().min(1).max(20000),
  reason: z.string().trim().min(1).max(10000),
});
export const Create = Command.safeExtend({ proposal: Proposal });
export const Edit = Create.safeExtend({
  version: z.number().int().nonnegative(),
});
export const ReviewEdit = Command.safeExtend({
  patch: Proposal.partial(),
  version: z.number().int().nonnegative(),
});
export const Transition = Command.safeExtend({
  version: z.number().int().nonnegative(),
  transition: z.enum(['submit', 'withdraw', 'terminate']),
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
export const Close = Command.safeExtend({
  version: z.number().int().nonnegative(),
});
export const User = z.strictObject({ id: z.string(), name: z.string() });
export const Snapshot = z.strictObject({
  privateSalaryRevisionId: z.string().optional(),
  departmentId: z.string(),
  positionId: z.string(),
  gradeId: z.string(),
  rank: z.number(),
  quantity: z.number(),
  kind: z.enum(['additional', 'replacement']),
  replacementEmployeeIds: z.array(z.string()),
  accountId: z.string(),
  year: z.number(),
  gradeTableVersion: z.number(),
  gradeRevisionId: z.string(),
  directorRank: z.number(),
  headId: z.string().nullable(),
  headRequired: z.boolean(),
  executiveId: z.string().nullable(),
  executiveRequired: z.boolean(),
  gmId: z.string().nullable(),
  gmRequired: z.boolean(),
  hrDirectorId: z.string().nullable(),
  hrbpIds: z.array(z.string()),
});
export const Record = Proposal.omit({
  minimumCents: true,
  maximumCents: true,
}).safeExtend({
  id: z.string(),
  applicantId: z.string(),
  privateSalaryRevisionId: z.string(),
  snapshot: Snapshot.nullable(),
  status: z.string(),
  lifecycleVersion: z.number(),
  statusChangedAt: z.string(),
  createdAt: z.string(),
});
export const Identities = z.strictObject({
  department: User.nullable(),
  position: User.nullable(),
  grade: User.nullable(),
});
export const List = z.array(
  Record.safeExtend({ applicant: User.nullable(), identities: Identities }),
);
export const Detail = z.strictObject({
  record: Record,
  users: z.array(User),
  identities: Identities,
  canSubmit: z.boolean(),
  view: z.json(),
  runs: z.array(z.json()),
  taskActions: z.array(z.json()),
  runActions: z.array(z.json()),
  timeline: z.array(z.json()),
});
export const Salary = z.strictObject({
  minimumCents: z.number().int().safe(),
  maximumCents: z.number().int().safe(),
});
export const Requisition = z.strictObject({
  id: z.string(),
  requestId: z.string(),
  departmentId: z.string(),
  positionId: z.string(),
  gradeId: z.string(),
  accountId: z.string(),
  originalQuantity: z.number(),
  remaining: z.number(),
  consumed: z.number(),
  sourceYear: z.number(),
  sourceVersion: z.number(),
  status: z.enum(['recruiting', 'full', 'closed']),
  version: z.number(),
  createdAt: z.string(),
  updatedAt: z.string(),
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

export const FormOptionsQuery = z.strictObject({
  requestId: id,
  mode: z.enum(['edit', 'reviewEdit']),
});
export const FormOptions = z.strictObject({
  editableFields: z.array(z.string()),
  department: z.strictObject({ id, name: z.string() }).nullable(),
  positions: z.array(z.strictObject({ id, name: z.string() })),
  grades: z.array(z.strictObject({ id, name: z.string() })),
});

export const CreateOptions = z.strictObject({
  canCreate: z.boolean(),
  editableFields: z.array(z.string()),
  departments: z.array(z.strictObject({ id, name: z.string() })),
  positions: z.array(z.strictObject({ id, name: z.string() })),
  grades: z.array(z.strictObject({ id, name: z.string() })),
});

export const ReplacementQuery = FormOptionsQuery.safeExtend({
  departmentId: id,
  positionId: id,
  search: z.string().max(100).optional(),
});
export const ReplacementCandidates = z.array(
  z.strictObject({
    id,
    name: z.string(),
    status: z.enum(['probation', 'regular', 'leaving', 'left']),
  }),
);

export const CreateReplacementQuery = z.strictObject({
  departmentId: id,
  positionId: id,
  search: z.string().max(100).optional(),
});
export const CapacityQuery = z.strictObject({
  mode: z.enum(['create', 'edit', 'reviewEdit']),
  requestId: id.optional(),
  departmentId: id,
  positionId: id,
  year: z.coerce.number().int().min(1900).max(9999),
});
export const CapacityOptions = z.array(
  z.strictObject({
    id,
    departmentId: id,
    positionId: id,
    year: z.number().int(),
    initialized: z.boolean(),
  }),
);

export const ListQuery = z.strictObject({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  q: z.string().max(100).optional(),
  status: z.string().max(64).optional(),
  orderBy: z.enum(['createdAt', 'statusChangedAt']).default('createdAt'),
  desc: z
    .enum(['true', 'false'])
    .default('true')
    .transform((value) => value === 'true'),
});
