// @vitest-environment node
import type { Application } from '@nocobase/app-server/application';
import { expect, it, vi } from 'vitest';
import { trialSession } from '../../../cli/commands/lib/trial-data/http.js';
import { sampleFailureReason } from '../../../server/providers/demo-data/errors.js';

it.each([
  [{ reason: 'INVALID_INPUT', message: 'private response' }, 'INVALID_INPUT'],
  [{ code: 'VERSION_CONFLICT' }, 'VERSION_CONFLICT'],
  [{ message: 'private response' }, 'HTTP_409'],
  [{ reason: 'private response', code: 'private response' }, 'HTTP_409'],
])(
  'retains safe HTTP failure codes for sample checkpoints',
  async (error, reason) => {
    const fetch = vi
      .fn()
      .mockResolvedValueOnce(Response.json({ user: { id: 'sample-user' } }))
      .mockResolvedValueOnce(Response.json({ error }, { status: 409 }));
    const app = {
      config: { get: () => 'http://sample.test' },
      router: { fetch },
    } as unknown as Application;
    const session = await trialSession(app, 'employee', 'private-password');
    const failure = await session
      .request('/generalRequests', { secret: 'private body' })
      .catch((cause: unknown) => cause);
    expect(failure).toBeInstanceOf(Error);
    expect(sampleFailureReason(failure, 'DEMO_SCENARIO_FAILED')).toBe(reason);
    expect(String(failure)).toContain(`HTTP 409 ${reason}`);
    expect(String(failure)).not.toContain('private');
  },
);

it('keeps structured service codes and never stores arbitrary exception details', () => {
  expect(
    sampleFailureReason({ reason: 'DEMO_REFERENCE_CONFLICT' }, 'fallback'),
  ).toBe('DEMO_REFERENCE_CONFLICT');
  expect(sampleFailureReason({ code: 'VERSION_CONFLICT' }, 'fallback')).toBe(
    'VERSION_CONFLICT',
  );
  for (const error of [
    new Error('SQL containing private values'),
    null,
    'private',
    { reason: 'x'.repeat(200) },
  ])
    expect(sampleFailureReason(error, 'DEMO_OPERATION_FAILED')).toBe(
      'DEMO_OPERATION_FAILED',
    );
});
