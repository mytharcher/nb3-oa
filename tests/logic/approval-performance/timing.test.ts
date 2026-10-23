// @vitest-environment node
import { expect, it } from 'vitest';
import {
  measureApprovalPhase,
  withApprovalTimings,
  type ApprovalTiming,
} from '../../../server/providers/approval-runtime/timing.js';

it('keeps nested phase accounting and error propagation local to each collection', async () => {
  let first: ApprovalTiming | undefined;
  const failure = new Error('business failure');
  await expect(
    withApprovalTimings(
      () =>
        measureApprovalPhase('transactionBody', () =>
          measureApprovalPhase('transactionBody', () =>
            measureApprovalPhase('businessWrite', async () => {
              throw failure;
            }),
          ),
        ),
      (value) => {
        first = value;
      },
    ),
  ).rejects.toBe(failure);
  expect(first?.phases.transactionBody?.count).toBe(1);
  expect(first?.phases.businessWrite?.count).toBe(1);
  let second: ApprovalTiming | undefined;
  await expect(
    withApprovalTimings(
      async () => 'unchanged',
      (value) => {
        second = value;
      },
    ),
  ).resolves.toBe('unchanged');
  expect(second?.phases).toEqual({});
  await expect(
    measureApprovalPhase('afterCommit', async () => 'unchanged'),
  ).resolves.toBe('unchanged');
});
