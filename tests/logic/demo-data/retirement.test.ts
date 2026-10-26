// @vitest-environment node
import type { Application } from '@nocobase/app-server/application';
import { beforeEach, expect, it, vi } from 'vitest';
import { demoContext } from '../../../server/providers/demo-data/context.js';
import { retireOwnedProcesses } from '../../../server/providers/process-management/demo-retirement.js';
const state = vi.hoisted(() => ({
  runs: [] as { status: string }[],
  terminate: vi.fn(),
}));
vi.mock('../../../server/providers/process-management/owners.js', () => ({
  processOwners: [
    {
      collection: 'outingRequests',
      kind: 'oa.outing',
      terminate: state.terminate,
      sdk: async () => ({
        read: async (work: () => unknown) => work(),
        approvals: { runsFor: async () => state.runs },
      }),
    },
  ],
}));
beforeEach(() => {
  state.runs = [];
  state.terminate.mockClear();
});
const app = {
  container: {
    resolve: () => ({
      repository: () => ({
        findOne: async () => ({
          id: 'draft',
          status: 'draft',
          managerApproverId: null,
        }),
      }),
    }),
  },
} as unknown as Application;
it('leaves an unsubmitted owned outing draft to row cleanup without requiring an approval manager', async () => {
  const verify = vi.fn(async () => {});
  await retireOwnedProcesses(
    app,
    [{ collection: 'outingRequests', id: 'draft' }],
    'sample',
    verify,
  );
  expect(verify).toHaveBeenCalledWith('outingRequests', 'draft');
  expect(state.terminate).not.toHaveBeenCalled();
});
it('still refuses retirement of an active outing approval without a dataset-owned manager', async () => {
  state.runs = [{ status: 'pending' }];
  await expect(
    demoContext.run(
      {
        id: 'sample',
        locale: 'zh-CN',
        baseDate: '2026-10-26',
        users: new Set(),
      },
      () =>
        retireOwnedProcesses(
          app,
          [{ collection: 'outingRequests', id: 'draft' }],
          'sample',
          async () => {},
        ),
    ),
  ).rejects.toThrow('DEMO_RETIRE_MANAGER_MISSING');
  expect(state.terminate).not.toHaveBeenCalled();
});
