import type { JobExecutorService } from '@nocobase/jobs';
import type { LifecycleLogger, LifecycleRuntime } from '@nocobase/lifecycle';
import {
  createLifecycleJobs,
  type LifecycleJobs,
} from '@nocobase/lifecycle/jobs';

/** One engine-maintenance sweep; business schedules belong in the scheduler plugin instead. */
export function createApprovalJobs(
  executors: JobExecutorService,
  runtime: () => LifecycleRuntime,
  sweep: () => Promise<unknown>,
  logger?: LifecycleLogger,
): LifecycleJobs {
  return createLifecycleJobs({
    jobs: executors.getJobExecutor('oa-approvals'),
    schedule: executors.getScheduleExecutor('oa-approvals'),
    jobName: 'oa-approval-effect',
    sweepEveryMs: 10 * 60_000,
    logger,
    async onSweep() {
      await sweep();
      // Prune only successful/cancelled effect attempts. Approval runs and audit history remain intact.
      await runtime().prune({
        olderThan: new Date(Date.now() - 30 * 24 * 60 * 60_000),
      });
    },
  });
}
