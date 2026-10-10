import type { JobExecutorService } from '@nocobase/jobs';
import type { LifecycleRuntime } from '@nocobase/lifecycle';
import { describe, expect, it, vi } from 'vitest';

import { createApprovalJobs } from '../../../server/providers/approval-notifications/jobs.ts';

function harness() {
  let sweep: (() => Promise<void>) | undefined;
  const jobExecutor = {
    registerJob: vi.fn(),
    setup: vi.fn(async () => {}),
    addJob: vi
      .fn<(job: unknown) => Promise<void>>()
      .mockResolvedValue(undefined),
    shutdown: vi.fn(async () => {}),
  };
  const scheduleExecutor = {
    addJob: vi.fn(async (rule: { execute: () => Promise<void> }) => {
      sweep = rule.execute;
    }),
    setup: vi.fn(async () => {}),
    shutdown: vi.fn(async () => {}),
  };
  const executors = {
    getJobExecutor: vi.fn(() => jobExecutor),
    getScheduleExecutor: vi.fn(() => scheduleExecutor),
  } as unknown as JobExecutorService;
  const runtime = {
    recover: vi.fn(async () => {}),
    reclaim: vi.fn(async () => {}),
    runTriggers: vi.fn(async () => {}),
    runEffect: vi.fn(async () => {}),
    prune: vi.fn(async () => {}),
  } as unknown as LifecycleRuntime;
  const maintain = vi.fn(async () => {});
  const jobs = createApprovalJobs(executors, () => runtime, maintain);
  return {
    jobs,
    runtime,
    maintain,
    jobExecutor,
    scheduleExecutor,
    sweep: () => sweep!(),
  };
}

describe('approval maintenance jobs', () => {
  it('recovers on startup, executes queued effects and closes both executors', async () => {
    const h = harness();
    await expect(
      h.jobs.dispatch('effect1', { runAfter: null }),
    ).rejects.toThrow('not started');
    await h.jobs.start(h.runtime);
    expect(h.runtime.recover).toHaveBeenCalledOnce();
    await h.jobs.dispatch('effect1', { runAfter: null });
    const queued = h.jobExecutor.addJob.mock.calls[0]![0] as {
      execute: (context: { signal: AbortSignal }) => Promise<void>;
    };
    const controller = new AbortController();
    await queued.execute({ signal: controller.signal });
    expect(h.runtime.runEffect).toHaveBeenCalledWith(
      'effect1',
      controller.signal,
    );
    await h.jobs.shutdown();
    expect(h.scheduleExecutor.shutdown).toHaveBeenCalledOnce();
    expect(h.jobExecutor.shutdown).toHaveBeenCalledOnce();
    await expect(
      h.jobs.dispatch('effect2', { runAfter: null }),
    ).rejects.toThrow('not started');
  });

  it('runs repeated maintenance and retains failed work when a sweep fails', async () => {
    const h = harness();
    await h.jobs.start(h.runtime);
    await h.sweep();
    await h.sweep();
    expect(h.runtime.reclaim).toHaveBeenCalledTimes(2);
    expect(h.runtime.runTriggers).toHaveBeenCalledTimes(2);
    expect(h.maintain).toHaveBeenCalledTimes(2);
    expect(h.runtime.prune).toHaveBeenCalledWith({
      olderThan: expect.any(Date),
    });
    h.maintain.mockRejectedValueOnce(
      new Error('notification temporarily down'),
    );
    await expect(h.sweep()).rejects.toThrow('notification temporarily down');
    expect(h.runtime.prune).toHaveBeenCalledTimes(2);
    await h.sweep();
    expect(h.runtime.prune).toHaveBeenCalledTimes(3);
    await h.jobs.shutdown();
  });
});
