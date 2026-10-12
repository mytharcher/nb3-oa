// @vitest-environment node
import { expect, it } from 'vitest';
import {
  PublishInput,
  Metadata,
} from '../../../server/routes/job-grades/schemas.js';
const input = {
  requestKey: 'publication-key',
  expectedVersion: 0,
  reason: 'HR publication',
  bands: [{ gradeId: 'real-grade', minimumCents: 1, maximumCents: 2 }],
};
it('rejects caller actor/rank fields instead of passing them into publication snapshots', () => {
  expect(PublishInput.safeParse(input).success).toBe(true);
  expect(
    PublishInput.safeParse({ ...input, actorId: 'another-user' }).success,
  ).toBe(false);
  expect(
    PublishInput.safeParse({
      ...input,
      bands: [{ ...input.bands[0], rank: 10 }],
    }).success,
  ).toBe(false);
});
it('reports duplicate grades and inverted amounts on their input fields', () => {
  const duplicate = PublishInput.safeParse({
    ...input,
    bands: [...input.bands, ...input.bands],
  });
  expect(duplicate.success).toBe(false);
  if (!duplicate.success)
    expect(duplicate.error.issues[0]?.path).toEqual(['bands']);
  const inverted = PublishInput.safeParse({
    ...input,
    bands: [{ ...input.bands[0], maximumCents: 0 }],
  });
  expect(inverted.success).toBe(false);
  if (!inverted.success)
    expect(inverted.error.issues[0]?.path).toEqual([
      'bands',
      0,
      'maximumCents',
    ]);
});
it('ordinary publication metadata accepts neither salary bands nor freeform publication reason', () => {
  const metadata = {
    id: 'revision',
    version: 1,
    createdBy: { id: 'hr', name: 'HR' },
    createdAt: new Date().toISOString(),
  };
  expect(Metadata.safeParse(metadata).success).toBe(true);
  expect(Metadata.safeParse({ ...metadata, bands: input.bands }).success).toBe(
    false,
  );
  expect(
    Metadata.safeParse({
      ...metadata,
      reason: 'Potentially private compensation explanation',
    }).success,
  ).toBe(false);
});
