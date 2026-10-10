import { z } from 'zod';
const scope = z.union([
  z.literal('all'),
  z.array(z.string().trim().min(1).max(128)).min(1).max(50),
]);
export const DelegationInputSchema = z
  .object({
    principalId: z.string().min(1).max(64),
    delegateId: z.string().min(1).max(64),
    scope,
    from: z.iso.datetime({ offset: true }),
    to: z.iso.datetime({ offset: true }),
  })
  .strict();
export const DelegationParams = z
  .object({ id: z.string().min(1).max(64) })
  .strict();
const person = z.object({ id: z.string(), name: z.string() });
export const DelegationSchema = z.object({
  id: z.string(),
  principalId: z.string(),
  delegateId: z.string(),
  principal: person,
  delegate: person,
  scope,
  from: z.iso.datetime(),
  to: z.iso.datetime(),
  source: z.enum(['manual', 'leave']),
  sourceApplication: z.string().nullable(),
  active: z.boolean(),
  createdAt: z.iso.datetime(),
  updatedAt: z.iso.datetime(),
});
