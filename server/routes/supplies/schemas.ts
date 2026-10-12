import { z } from 'zod';
const PrintInfo = z.strictObject({
  name: z.string().trim().min(1).max(200),
  title: z.string().trim().min(1).max(200),
  phone: z.string().trim().min(1).max(100),
  email: z.string().trim().email().max(254),
  address: z.string().trim().min(1).max(500),
  department: z.string().trim().max(200).optional(),
});
export const SupplyInput = z
  .strictObject({
    items: z
      .array(
        z.strictObject({
          code: z.string().min(1).max(64),
          quantity: z.number().int().min(1).max(100000),
          printInfo: PrintInfo.optional(),
        }),
      )
      .min(1)
      .max(100),
    purpose: z.string().trim().min(1).max(10000),
  })
  .refine(
    (value) =>
      new Set(value.items.map((item) => item.code)).size === value.items.length,
    'Duplicate item code',
  );
export const CreateSupply = SupplyInput;
export const SupplyParams = z.strictObject({
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
export const SupplyRecord = z.strictObject({
  id: z.string(),
  applicantId: z.string(),
  createdById: z.string(),
  number: z.string().nullable(),
  items: SupplyInput.shape.items,
  purpose: z.string(),
  itemSnapshot: z.record(z.string(), z.json()).nullable(),
  approvedFingerprint: z.string().nullable(),
  approvedAt: z.string().nullable(),
  issuedById: z.string().nullable(),
  forcedClosed: z.boolean(),
  status: z.string(),
  lifecycleVersion: z.number(),
  ruleSnapshot: z.record(z.string(), z.json()).nullable(),
  hrRecipients: z.array(z.string()),
  managerApproverId: z.string().nullable(),
  createdAt: z.string(),
});
export const Detail = z.strictObject({
  timeZone: z.string(),
  record: SupplyRecord,
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
  SupplyRecord.extend({
    applicant: User.nullable(),
    createdBy: User.nullable(),
    managerApprover: User.nullable(),
    issuedBy: User.nullable(),
    hrUsers: z.array(User),
  }),
);
export const Result = z.object({
  record: SupplyRecord,
  entry: z.json(),
  effectRuns: z.array(z.json()),
  replayed: z.boolean().optional(),
});
export const ActionResult = z.json();

export const ActionCandidates = z.strictObject({
  people: z.array(z.strictObject({ id: z.string(), name: z.string() })),
  nextOffset: z.number().int().nonnegative().nullable(),
});
