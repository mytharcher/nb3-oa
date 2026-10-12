import { z } from 'zod';
export const Id = z.string().min(1).max(64),
  Key = z.string().min(1).max(128),
  Person = z.object({ id: Id, name: z.string() });
export const Params = z.strictObject({ id: Id });
export const FileParams = z.strictObject({ id: Id, fileId: Id });
export const Fields = {
  contractId: Id.nullable(),
  fileIds: z.array(Id).max(20),
  sealType: z.string().min(1).max(64),
  copies: z.number().int().min(1).max(10000),
  external: z.boolean(),
  returnDueAt: z.string().datetime().nullable(),
  purpose: z.string().trim().min(1).max(5000),
  contact: z.string().max(2000),
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
export const ActualReturn = z.strictObject({
  requestKey: Key,
  expectedVersion: z.number().int().positive(),
  actualCopies: z.number().int().positive(),
  sealedAt: z.string().datetime(),
  returnedAt: z.string().datetime(),
  reason: z.string().trim().min(1).max(2000),
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
      sealId: Id.optional(),
      actualCopies: z.number().int().positive().nullable().optional(),
      sealedAt: z.string().datetime().nullable().optional(),
      borrowedAt: z.string().datetime().nullable().optional(),
      returnedAt: z.string().datetime().nullable().optional(),
      reason: z.string().max(2000).optional(),
      to: z.union([Id, z.array(Id).max(100)]).optional(),
      person: Id.optional(),
      mode: z.enum(['before', 'after', 'parallel']).optional(),
      place: Id.optional(),
      override: z.boolean().optional(),
      userId: Id.optional(),
      userIds: z.array(Id).max(100).optional(),
    })
    .optional(),
});
export const InstanceInput = z.strictObject({
  requestKey: Key,
  id: Id.optional(),
  expectedVersion: z.number().int().positive().optional(),
  code: z.string().trim().min(1).max(64),
  name: z.string().trim().min(1).max(200),
  sealType: z.string().min(1).max(64),
  active: z.boolean(),
  reason: z.string().trim().min(1).max(2000),
});
export const Instance = z.object({
  id: Id,
  code: z.string(),
  name: z.string(),
  sealType: z.string(),
  active: z.boolean(),
  version: z.number(),
});
export const Request = z.object({
  ...Fields,
  id: Id,
  applicantId: Id,
  createdById: Id,
  applicant: Person,
  createdBy: Person,
  departmentId: Id,
  number: z.string().nullable(),
  contractVersion: z.number().nullable(),
  contractTextVersionId: Id.nullable(),
  status: z.string(),
  lifecycleVersion: z.number(),
  sealId: Id.nullable(),
  actualCopies: z.number().nullable(),
  sealedAt: z.string().nullable(),
  borrowedAt: z.string().nullable(),
  returnedAt: z.string().nullable(),
  ledgerId: Id.nullable(),
  exceptionReason: z.string().nullable(),
  administrativeReason: z.string().nullable(),
  createdAt: z.string(),
  statusChangedAt: z.string(),
  submittedAt: z.string().nullable(),
});
export const Ledger = z.object({
  id: Id,
  requestId: Id,
  sealId: Id,
  applicantId: Id,
  applicant: Person,
  departmentId: Id,
  contractId: Id.nullable(),
  contractVersion: z.number().nullable(),
  contractTextVersionId: Id.nullable(),
  approvedCopies: z.number(),
  actualCopies: z.number().nullable(),
  external: z.boolean(),
  borrowedAt: z.union([z.string(), z.date()]).nullable(),
  sealedAt: z.union([z.string(), z.date()]).nullable(),
  registeredById: Id,
  registeredBy: Person,
  registeredAt: z.union([z.string(), z.date()]),
});
export const Receipt = z.object({
  id: Id,
  ledgerId: Id,
  requestId: Id,
  sealId: Id,
  returnedAt: z.string(),
  actualCopies: z.number(),
  sealedAt: z.string(),
  confirmedById: Id,
  confirmedBy: Person,
  contractConfirmation: z.enum(['confirmed', 'notApplicable', 'unconfirmed']),
  reason: z.string(),
});
export const File = z.object({
  id: Id,
  filename: z.string(),
  ext: z.string(),
  mimeType: z.string(),
  size: z.number(),
});
export const Upload = z.strictObject({
  requestKey: Key,
  file: z.custom<globalThis.File>((v) => v instanceof globalThis.File),
});
export const ActionResult = z.object({
  actionId: Id,
  name: z.string(),
  outcome: z.string().optional(),
});
export const Detail = z.object({
  record: Request,
  tasks: z.array(
    z.object({
      id: Id,
      runId: Id,
      status: z.string(),
      assigneeId: Id.nullable().optional(),
      assignee: Person.nullable().optional(),
    }),
  ),
  runs: z.array(
    z.object({
      id: Id,

      status: z.string(),
      contentHash: z.string(),
    }),
  ),
  actions: z.array(
    z.object({
      id: Id,
      name: z.string(),
      actorId: Id,
      actor: Person,
      createdAt: z.union([z.string(), z.date()]),
    }),
  ),
});

export const Meta = z.object({
  total: z.number().int().nonnegative(),
  page: z.number().int().positive().optional(),
  pageSize: z.number().int().positive().optional(),
});
export const LedgerMeta = Meta.extend({ timeZone: z.string() });

export const BrowserOptions = z.object({
  timeZone: z.string(),
  actorId: Id,
  sealTypes: z.array(
    z.object({ code: z.string(), label: z.record(z.string(), z.string()) }),
  ),
  contracts: z.array(z.object({ id: Id, number: z.string().nullable() })),
});
export const BrowserCapabilities = z.object({
  timeZone: z.string(),
  transitions: z.array(z.string()),
  taskActions: z.array(z.json()),
  canActualReturn: z.boolean(),
});

export const LedgerQuery = z.strictObject({
  page: z.coerce.number().int().positive().max(100000).default(1),
  pageSize: z.coerce
    .number()
    .pipe(
      z.union([z.literal(10), z.literal(20), z.literal(50), z.literal(100)]),
    )
    .default(20),
});
export const LedgerDetail = z.object({
  timeZone: z.string(),
  record: Ledger,
  request: z.object({
    id: Id,
    number: z.string().nullable(),
    status: z.string(),
  }),
  receipt: Receipt.nullable(),
  printable: z.boolean(),
});
