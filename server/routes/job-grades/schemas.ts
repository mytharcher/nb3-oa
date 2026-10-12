import { z } from 'zod';
const id = z.string().min(1).max(64);
const cents = z.number().int().safe().nonnegative();
export const BandInput = z
  .strictObject({ gradeId: id, minimumCents: cents, maximumCents: cents })
  .refine((band) => band.maximumCents >= band.minimumCents, {
    path: ['maximumCents'],
    message: 'Maximum must include minimum.',
  });
export const PublishInput = z
  .strictObject({
    requestKey: z.string().trim().min(1).max(128),
    expectedVersion: z.number().int().min(0).max(2147483646),
    reason: z.string().trim().min(1).max(2000),
    bands: z.array(BandInput).min(1),
  })
  .refine(
    (input) =>
      new Set(input.bands.map((band) => band.gradeId)).size ===
      input.bands.length,
    { path: ['bands'], message: 'Each grade must appear once.' },
  );
export const RevisionParams = z.strictObject({ revisionId: id });
export const Band = z.strictObject({
  gradeId: id,
  gradeCode: z.string(),
  gradeTitle: z.string(),
  rank: z.number().int().safe(),
  minimumCents: cents,
  maximumCents: cents,
});
export const Metadata = z.strictObject({
  id,
  version: z.number().int().positive(),
  createdBy: z.strictObject({ id, name: z.string() }),
  createdAt: z.string().datetime(),
});
export const Revision = Metadata.extend({
  reason: z.string(),
  bands: z.array(Band).min(1),
});
export const TimedRevision = Revision.extend({ timeZone: z.string() });
export const Current = z.strictObject({
  version: z.number().int().nonnegative(),
  revision: TimedRevision.nullable(),
});
export const ListQuery = z.strictObject({
  search: z.string().trim().max(200).default(''),
  sort: z.enum(['version', 'createdAt']).default('version'),
  direction: z.enum(['asc', 'desc']).default('desc'),
  page: z.coerce.number().int().positive().default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export const ListMeta = z.strictObject({
  timeZone: z.string(),
  page: z.number().int(),
  pageSize: z.number().int(),
  total: z.number().int().nonnegative(),
});
