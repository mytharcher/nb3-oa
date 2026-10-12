import { z } from 'zod';
const id = z.string().min(1).max(200);
export const SetParams = z.object({ key: id });
export const SubjectParams = z.object({ type: id, id });
export const Changes = z
  .object({
    expectedRevision: z.string().length(64),
    changes: z
      .array(
        z.object({
          resource: z.object({
            type: z.enum(['composite', 'settings', 'page']),
            id,
          }),
          action: id,
          enabled: z.boolean(),
          scopes: z.record(z.string(), z.string()).optional(),
        }),
      )
      .min(1)
      .max(1000),
  })
  .strict();
export const Assignments = z
  .object({
    expectedRevision: z.string().length(64),
    managedPermissionSets: z.array(id).max(1000),
    permissionSets: z.array(id).max(1000),
  })
  .strict();
// Definitions and policies are plugin-owned JSON. Writes above accept only individual supported business changes.
export const Snapshot = z.object({
  revision: z.string(),
  sets: z.array(z.record(z.string(), z.unknown())),
  assignments: z.array(z.record(z.string(), z.unknown())),
});
export const SetSnapshot = z.object({
  revision: z.string(),
  definition: z.record(z.string(), z.unknown()),
  assignments: z.array(z.record(z.string(), z.unknown())),
});
