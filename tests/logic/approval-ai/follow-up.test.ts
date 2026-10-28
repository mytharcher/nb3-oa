// @vitest-environment node
import { expect, it, vi } from 'vitest';
import { readReviewForFollowUp } from '../../../server/providers/approval-ai/follow-up.js';
import type { ReviewView } from '../../../shared/approval-ai.js';
const reference = {
  lifecycle: 'oa.contract',
  recordId: 'record',
  taskId: 'task',
  generatedAt: '2026-10-28T00:00:00Z',
};
const review: ReviewView = {
  taskId: 'task',
  via: 'assignee',
  definitionId: 'test',
  title: 'Review',
  stage: 'review',
  taskOpen: true,
  status: 'succeeded',
  errorCode: null,
  canGenerate: false,
  generatedAt: reference.generatedAt,
  model: null,
  findings: [],
  coverage: [],
  basis: 'Recorded evidence',
  feedback: null,
};
it('rechecks the current user’s visible reviews for every follow-up', async () => {
  const service = { reviews: vi.fn().mockResolvedValue([review]) };
  const t = (key: string) => key;
  expect(await readReviewForFollowUp(service, reference, 'alice', t)).toBe(
    review,
  );
  expect(service.reviews).toHaveBeenCalledWith(
    'oa.contract',
    'record',
    'alice',
    t,
  );
  service.reviews.mockResolvedValue([]);
  await expect(
    readReviewForFollowUp(service, reference, 'alice', t),
  ).rejects.toMatchObject({ code: 'NOT_FOUND' });
});
it('never selects another task, including when the record is the same', async () => {
  const service = {
    reviews: vi.fn().mockResolvedValue([{ ...review, taskId: 'other' }]),
  };
  await expect(
    readReviewForFollowUp(service, reference, 'alice', (x) => x),
  ).rejects.toMatchObject({ code: 'NOT_FOUND' });
});
it.each([
  { status: 'running' },
  { status: 'failed' },
  { findings: null },
  { generatedAt: '2026-10-28T01:00:00Z' },
])('rejects replaced or unavailable results: %j', async (change) => {
  const service = {
    reviews: vi.fn().mockResolvedValue([{ ...review, ...change }]),
  };
  await expect(
    readReviewForFollowUp(service, reference, 'alice', (x) => x),
  ).rejects.toMatchObject({ code: 'CONFLICT' });
});
