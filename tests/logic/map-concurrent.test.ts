// @vitest-environment node
import { expect, it } from 'vitest';
import { mapConcurrent } from '../../server/providers/map-concurrent.js';

it('bounds active readers and preserves declaration order despite out-of-order completion', async () => {
  let active = 0;
  let peak = 0;
  const releases: (() => void)[] = [];
  const result = mapConcurrent([0, 1, 2], 2, async (value) => {
    active++;
    peak = Math.max(peak, active);
    await new Promise<void>((resolve) => {
      releases[value] = resolve;
    });
    active--;
    return value;
  });
  expect(active).toBe(2);
  releases[1]!();
  await Promise.resolve();
  await Promise.resolve();
  expect(releases[2]).toBeTypeOf('function');
  releases[2]!();
  releases[0]!();
  expect(await result).toEqual([0, 1, 2]);
  expect(peak).toBe(2);
});
it('fails the complete read and waits for active workers without starting queued sources', async () => {
  const failure = new Error('owner denied');
  let release!: () => void;
  const started: number[] = [];
  const result = mapConcurrent([0, 1, 2], 2, async (value) => {
    started.push(value);
    if (value === 0) throw failure;
    await new Promise<void>((resolve) => {
      release = resolve;
    });
    return value;
  });
  let settled = false;
  const outcome = result.catch((error: unknown) => error);
  void result.then(
    () => {
      settled = true;
    },
    () => {
      settled = true;
    },
  );
  await Promise.resolve();
  expect(settled).toBe(false);
  release();
  expect(await outcome).toBe(failure);
  expect(started).toEqual([0, 1]);
});
