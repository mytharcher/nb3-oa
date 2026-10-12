import { z } from 'zod';
// Organization-owned names can be localized seed descriptors.
const DutyRoleTitle = z.union([
  z.string(),
  z.object({ key: z.string(), ns: z.string() }),
]);
export const Id = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/);
export const Params = z.object({ id: Id }).strict();
export const Command = z
  .object({ requestId: z.string().min(1).max(128) })
  .strict();
export const Action = Command.extend({
  expectedVersion: z.number().int().positive(),
});
export const Audience = z
  .object({
    all: z.boolean(),
    departmentIds: z.array(Id).max(500),
    dutyRoleCodes: z.array(Id).max(100),
  })
  .strict();
export const Draft = Command.extend({
  expectedVersion: z.number().int().positive().optional(),
  title: z.string().trim().min(1).max(200),
  body: z.string().min(1).max(100000),
  audience: Audience,
  requiresConfirmation: z.boolean(),
  pinned: z.boolean(),
  attachments: z.array(z.uuid()).max(10),
  validFrom: z.iso.datetime({ offset: true }),
  validUntil: z.iso.datetime({ offset: true }),
  knowledgeDocumentId: Id.nullable().optional(),
}).strict();
export const Announcement = z.object({
  id: Id,
  publisherUserId: Id,
  publisher: z.object({ id: Id, name: z.string() }),
  title: z.string(),
  body: z.string(),
  status: z.enum(['draft', 'scheduled', 'published', 'revoked']),
  audience: Audience,
  requiresConfirmation: z.boolean(),
  pinned: z.boolean(),
  attachments: z.array(z.string()),
  knowledgeLink: z
    .object({
      documentId: Id,
      versionId: Id,
      version: z.number(),
      title: z.string(),
    })
    .nullable(),
  hasNewVersion: z.boolean(),
  validFrom: z.iso.datetime(),
  validUntil: z.iso.datetime(),
  publishedAt: z.iso.datetime().nullable(),
  version: z.number(),
});
export const Receipt = z.object({
  id: Id,
  announcementId: Id,
  userId: Id,
  user: z.object({ id: Id, name: z.string() }),
  employeeId: Id,
  name: z.string(),
  status: z.enum(['pending', 'confirmed']),
  confirmedAt: z.iso.datetime().nullable(),
  version: z.number(),
});
export const Pending = z.object({
  items: z.array(
    z.object({
      id: Id,
      announcementId: Id,
      title: z.string(),
      dueAt: z.iso.datetime(),
    }),
  ),
  count: z.number(),
});
export const List = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  mode: z.enum(['mine', 'received']).default('received'),
  q: z.string().trim().max(200).default(''),
  status: z.enum(['draft', 'scheduled', 'published', 'revoked']).optional(),
  sort: z.enum(['publishedAt', 'validUntil', 'title']).default('publishedAt'),
  direction: z.enum(['asc', 'desc']).default('desc'),
});
export const Meta = z.object({
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
});

export const Detail = Announcement.extend({
  capabilities: z.object({
    actions: z.array(
      z.enum(['edit', 'publish', 'revoke', 'remind', 'confirm', 'receipts']),
    ),
    ownReceipt: z
      .object({
        status: z.enum(['pending', 'confirmed']),
        confirmedAt: z.iso.datetime().nullable(),
      })
      .nullable(),
  }),
});

export const Context = z.object({
  timeZone: z.string(),
  dutyRoles: z
    .array(z.object({ code: z.string(), title: DutyRoleTitle }))
    .nullable(),
});

export const RosterQuery = z
  .object({
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    status: z.enum(['all', 'pending', 'confirmed']).default('all'),
    q: z.string().trim().max(200).default(''),
  })
  .strict();
export const RosterMeta = Meta.extend({
  pending: z.number().int().nonnegative(),
  confirmed: z.number().int().nonnegative(),
});
