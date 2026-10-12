// @vitest-environment node
import { expect, it, vi } from 'vitest';
import { sharedRead } from '../../client/pages/approvals/shared-read.js';

it('shares pending reads, keeps remaining subscribers alive and never caches settled data', async () => {
  const client = {};
  let resolve!: (value: string) => void;
  const request = vi.fn(
    (_signal: AbortSignal) =>
      new Promise<string>((r) => {
        resolve = r;
      }),
  );
  const first = sharedRead(client, 'actor/revision/path', request);
  const second = sharedRead(client, 'actor/revision/path', request);
  expect(request).toHaveBeenCalledTimes(1);
  first.release();
  await Promise.resolve();
  expect(request.mock.calls[0]![0].aborted).toBe(false);
  resolve('current');
  expect(await second.promise).toBe('current');
  const next = sharedRead(client, 'actor/revision/path', request);
  expect(request).toHaveBeenCalledTimes(2);
  second.release();
  next.release();
  await Promise.resolve();
  expect(request.mock.calls[1]![0].aborted).toBe(true);
});
it('reuses synchronous effect remounts and isolates different clients, identities and revisions', async () => {
  const client = {};
  const request = vi.fn((_signal: AbortSignal) => new Promise<never>(() => {}));
  const old = sharedRead(client, 'alice/0/path', request);
  old.release();
  const remount = sharedRead(client, 'alice/0/path', request);
  const nextRevision = sharedRead(client, 'alice/1/path', request);
  const nextActor = sharedRead(client, 'bob/0/path', request);
  const nextClient = sharedRead({}, 'alice/0/path', request);
  await Promise.resolve();
  expect(request).toHaveBeenCalledTimes(4);
  expect(request.mock.calls[0]![0].aborted).toBe(false);
  for (const read of [remount, nextRevision, nextActor, nextClient])
    read.release();
  await Promise.resolve();
  expect(request.mock.calls.every(([signal]) => signal.aborted)).toBe(true);
});
