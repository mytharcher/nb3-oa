import { z } from 'zod';
// Organization-owned names can be localized seed descriptors.
const DutyRoleTitle = z.union([
  z.string(),
  z.object({ key: z.string(), ns: z.string() }),
]);
import { WORK_ITEM_ACTIONS } from '../../providers/work-items/contract.js';
export const Id = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/);
export const Params = z.object({ id: Id }).strict();
export const Command = z
  .object({ requestId: z.string().min(1).max(128) })
  .strict();
export const Draft = Command.extend({
  expectedVersion: z.number().int().positive().optional(),
  title: z.string().trim().min(1).max(200),
  description: z.string().max(100000),
  targetUserId: Id.nullable(),
  dutyRoleCode: Id.nullable(),
  dueAt: z.iso.datetime({ offset: true }),
  requiresConfirmation: z.boolean().default(true),
  attachments: z.array(z.uuid()).max(10),
}).strict();
export const Action = Command.extend({
  expectedVersion: z.number().int().positive(),
  result: z.string().max(100000).optional(),
  reason: z.string().trim().max(2000).optional(),
  resultAttachments: z.array(z.uuid()).max(10).optional(),
  targetUserId: Id.nullable().optional(),
  dutyRoleCode: Id.nullable().optional(),
}).strict();
export const Handover = Command.extend({
  expectedVersion: z.int().positive(),
  fromUserId: Id,
  toUserId: Id,
  reason: z.string().trim().min(1).max(2000),
}).strict();
const User = z.object({ id: Id, name: z.string() });
export const WorkItem = z.object({
  id: Id,
  creatorUserId: Id,
  confirmationOwnerUserId: Id.nullable(),
  confirmationOwner: User.nullable(),
  creator: User,
  targetUserId: Id.nullable(),
  target: User.nullable(),
  dutyRoleCode: Id.nullable(),
  assigneeUserId: Id.nullable(),
  assignee: User.nullable(),
  title: z.string(),
  description: z.string(),
  dueAt: z.iso.datetime(),
  requiresConfirmation: z.boolean(),
  attachments: z.array(z.string()),
  resultAttachments: z.array(z.string()),
  result: z.string().nullable(),
  reason: z.string().nullable(),
  forced: z.boolean(),
  completedAt: z.iso.datetime().nullable(),
  status: z.enum([
    'draft',
    'open',
    'assigned',
    'claimed',
    'awaitingConfirmation',
    'blocked',
    'completed',
    'cancelled',
  ]),
  version: z.number(),
  actions: z.array(z.enum(WORK_ITEM_ACTIONS)),
  overdue: z.boolean(),
  canEdit: z.boolean(),
  canHandoverConfirmation: z.boolean(),
  dutyRole: z.object({ code: z.string(), title: DutyRoleTitle }).nullable(),
});
export const Pending = z.object({
  items: z.array(
    z.object({
      kind: z.literal('oa.workItem'),
      sourceId: Id,
      title: z.string(),
      dueAt: z.iso.datetime(),
      overdue: z.boolean(),
      actions: z.array(z.enum(WORK_ITEM_ACTIONS)),
    }),
  ),
  count: z.number(),
});
export const List = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    mode: z
      .enum(['all', 'created', 'assigned', 'pool', 'pending'])
      .default('all'),
    q: z.string().trim().max(200).default(''),
    status: WorkItem.shape.status.optional(),
    overdue: z.enum(['all', 'true', 'false']).default('all'),
    sort: z.enum(['dueAt', 'title', 'status']).default('dueAt'),
    direction: z.enum(['asc', 'desc']).default('asc'),
  })
  .strict();
export const Meta = z.object({
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
});

export const Context = z.object({
  timeZone: z.string(),
  dutyRoles: z
    .array(z.object({ code: z.string(), title: DutyRoleTitle }))
    .nullable(),
});
