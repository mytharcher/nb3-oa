import { z } from 'zod';
const cents = z.number().int().nonnegative().max(Number.MAX_SAFE_INTEGER);
export const TravelInput = z
  .strictObject({
    destination: z.string().trim().min(1).max(255),
    international: z.boolean(),
    startAt: z.iso.datetime({ offset: true }),
    endAt: z.iso.datetime({ offset: true }),
    reason: z.string().trim().min(1).max(10000),
    companionIds: z.array(z.string().min(1).max(64)).max(20),
    attachments: z.array(z.string().min(1).max(64)).max(10),
    transportCents: cents,
    lodgingCents: cents,
    allowanceCents: cents,
    needsLoan: z.boolean(),
    needsBooking: z.boolean(),
  })
  .refine((v) => Date.parse(v.startAt) < Date.parse(v.endAt), {
    path: ['endAt'],
    message: 'Trip end must follow its start.',
  })
  .refine(
    (v) =>
      Number.isSafeInteger(
        v.transportCents + v.lodgingCents + v.allowanceCents,
      ),
    {
      path: ['transportCents'],
      message: 'The total amount exceeds safe integer cents.',
    },
  );
export const CreateTravel = TravelInput.safeExtend({
  applicantId: z.string().min(1).max(64).optional(),
});
export const TravelParams = z.strictObject({
  id: z.string().min(1).max(64),
});
export const ListQuery = z.strictObject({
  view: z.enum(['mine', 'pending', 'done', 'copied']).default('mine'),
});
export const TransitionInput = z.strictObject({
  transition: z.enum([
    'edit',
    'submit',
    'withdraw',
    'terminate',
    'retryBooking',
    'reviseTrip',
  ]),
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
export const CandidatesQuery = z.strictObject({
  taskId: z.string().min(1),
  action: z.enum(['transfer', 'addSigner', 'cc']),
  search: z.string().max(255).default(''),
  offset: z.coerce.number().int().nonnegative().default(0),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});
const User = z.strictObject({ id: z.string(), name: z.string() });
export const CandidatesResult = z.strictObject({
  people: z.array(User),
  nextOffset: z.number().int().nullable(),
});

export const TravelRecord = z.strictObject({
  id: z.string(),
  applicantId: z.string(),
  createdById: z.string(),
  number: z.string().nullable(),
  departmentId: z.string().nullable(),
  destination: z.string(),
  international: z.boolean(),
  startAt: z.string(),
  endAt: z.string(),
  companionIds: z.array(z.string()),
  attachments: z.array(z.string()),
  transportCents: cents,
  lodgingCents: cents,
  allowanceCents: cents,
  needsLoan: z.boolean(),
  needsBooking: z.boolean(),
  approvalGrantedAt: z.string().nullable(),
  originalHeadApproverId: z.string().nullable(),
  bookingInformation: z.string().nullable(),
  exceptionReason: z.string().nullable(),
  cancelledAt: z.string().nullable(),
  cancellationId: z.string().nullable(),
  standardSnapshot: z.json().nullable(),
  managerApproverId: z.string().nullable(),
  headMerged: z.json().nullable(),
  executiveApproverId: z.string().nullable(),
  gmApproverId: z.string().nullable(),
  gmMerged: z.json().nullable(),
  authorizationId: z.string().nullable(),
  authorizationSourceId: z.string().nullable(),
  approvalGeneration: z.number().int().nonnegative(),
  amountCents: z.number().int().safe(),
  reason: z.string(),
  ruleSnapshot: z.record(z.string(), z.json()).nullable(),
  headApproverId: z.string().nullable(),
  status: z.string(),
  lifecycleVersion: z.number(),
  createdAt: z.string(),
});
export const Detail = z.strictObject({
  timeZone: z.string(),
  record: TravelRecord,
  users: z.array(User),
  view: z.json(),
  runs: z.array(z.json()),
  taskActions: z.array(z.json()),
  runActions: z.json(),
  upcoming: z.array(z.json()),
  timeline: z.json(),
});
export const List = z.array(
  TravelRecord.extend({
    applicant: User.nullable(),
    createdBy: User.nullable(),
    headApprover: User.nullable(),
    executiveApprover: User.nullable(),
  }),
);
export const Result = z.object({
  record: TravelRecord,
  entry: z.json(),
  effectRuns: z.array(z.json()),
  replayed: z.boolean().optional(),
});

export const ActionResult = z.json();

export const OptionsQuery = z.strictObject({
  applicantId: z.string().min(1).max(64).optional(),
});
