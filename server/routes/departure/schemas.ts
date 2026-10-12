import { z } from 'zod';
import { departureCreateSchema } from '../../providers/departure/validation.js';
export const Params = z.strictObject({ id: z.string().min(1).max(64) });
export const WorkParams = Params.extend({ workId: z.string().min(1).max(64) });
export const Create = departureCreateSchema;
export const Transition = z.strictObject({
  transition: z.enum([
    'edit',
    'submit',
    'withdraw',
    'terminate',
    'settle',
    'requestCancellation',
  ]),
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
});
export const WorkAction = z.strictObject({
  action: z.enum([
    'claim',
    'confirmChecklist',
    'acknowledgeReceipt',
    'complete',
    'forceComplete',
  ]),
  version: z.number().int().nonnegative(),
  requestId: z.string().min(1).max(128),
  input: z.record(z.string(), z.json()).default({}),
});
const user = z.strictObject({ id: z.string(), name: z.string() }).nullable();
export const Record = z
  .object({
    id: z.string(),
    employeeId: z.string(),
    applicantId: z.string(),
    createdById: z.string(),
    departureType: z.string(),
    departureTypeLabel: z.record(z.string(), z.string()).nullable(),
    reason: z.string(),
    expectedLastWorkingDay: z.string().nullable(),
    lastWorkingDay: z.string().nullable(),
    handoverUserId: z.string().nullable(),
    sourceProbationId: z.string().nullable(),
    sourceKey: z.string().nullable(),
    status: z.string(),
    lifecycleVersion: z.number().int(),
    createdAt: z.string(),
    applicant: user,
    createdBy: user,
    handoverUser: user,
  })
  .passthrough();
const offer = z
  .object({
    name: z.string(),
    allowed: z.boolean(),
    blockers: z.array(
      z
        .object({ code: z.string(), message: z.string().optional() })
        .passthrough(),
    ),
  })
  .passthrough();
export const WorkItem = z.object({
  id: z.string(),
  departureId: z.string(),
  employeeId: z.string(),
  applicantId: z.string(),
  kind: z.enum(['work', 'it', 'admin', 'finance']),
  managerId: z.string(),
  receiverId: z.string(),
  claimedById: z.string().nullable(),
  forcedById: z.string().nullable(),
  forceReason: z.string().nullable(),
  checklistConfirmed: z.boolean(),
  receiverAcknowledged: z.boolean(),
  status: z.enum(['open', 'claimed', 'completed']),
  lifecycleVersion: z.number().int(),
  createdAt: z.string(),
  manager: user,
  receiver: user,
  claimedBy: user,
  forcedBy: user,
  offers: z.array(offer),
});
export const Options = z
  .object({
    timeZone: z.string(),
    actor: user,
    canCreateSelfDraft: z.boolean(),
    canCreateManualDraft: z.boolean(),
    selfDepartureTypes: z.array(
      z.object({ code: z.string(), label: z.record(z.string(), z.string()) }),
    ),
    manualDepartureTypes: z.array(
      z.object({ code: z.string(), label: z.record(z.string(), z.string()) }),
    ),
  })
  .passthrough();
export const HandoverCandidates = z.object({
  items: z.array(user),
  total: z.number().int(),
});
export const Detail = z.object({
  record: Record,
  view: z.unknown(),
  runs: z.array(z.unknown()),
  taskActions: z.array(z.unknown()),
  runActions: z.array(z.unknown()),
  upcoming: z.array(z.unknown()),
  timeline: z.json(),
  users: z.array(user),
  timeZone: z.string(),
  readyForSubmission: z.boolean(),
  blockedBy: z.array(z.string()),
  workItems: z.array(WorkItem),
  execution: z.unknown(),
});
export const Result = z.object({ record: Record }).passthrough();

export const CandidatesQuery = z
  .strictObject({
    taskId: z.string().min(1).optional(),
    runId: z.string().min(1).optional(),
    action: z.enum(['transfer', 'addSigner', 'reassign', 'cc', 'appoint']),
    search: z.string().optional(),
    offset: z.coerce.number().int().nonnegative().optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
  })
  .refine(
    (value) => !!value.taskId !== !!value.runId,
    'Exactly one taskId or runId is required',
  );
export const Candidates = z.strictObject({
  people: z.array(z.strictObject({ id: z.string(), name: z.string() })),
  nextOffset: z.number().int().nullable(),
});
