// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest';
import { ApprovalService } from '@nocobase/app-plugin-approval/server';
import * as integration from '../../../server/providers/approval-runtime/task-center.js';
import { approvalReadableScope } from '../../../server/providers/approval-runtime/readable-scope.js';
import {
  approvalReadableRecords,
  createAppApprovalService,
  withApprovalQueryReads,
} from '../../../server/providers/approval-runtime/query-service.js';

afterEach(() => vi.restoreAllMocks());

it('awaits role denial instead of treating a directory Promise as an unrestricted grant', async () => {
  const f = fixture([]);
  const directory = { hasRole: vi.fn().mockResolvedValue(false) };
  const scope = await approvalReadableScope('viewer', {
    approvals: f.service,
    lifecycle: 'test',
    directory: directory as never,
    roles: ['approval.admin'],
  });
  expect(scope).not.toBe(true);
  directory.hasRole.mockResolvedValue(true);
  expect(
    await approvalReadableScope('viewer', {
      approvals: f.service,
      lifecycle: 'test',
      directory: directory as never,
      roles: ['approval.admin'],
    }),
  ).toBe(true);
});
function fixture(records: string[]) {
  let visible = records;
  let pageRecords: string[] = [];
  const center = vi.fn(
    async (_owner: string, query: { page: number; sourceType: string }) => {
      pageRecords =
        query.sourceType === 'approval.task'
          ? visible.slice((query.page - 1) * 100, query.page * 100)
          : [];
      return {
        data: pageRecords.map((id) => ({ sourceKey: id })),
        meta: {
          total: query.sourceType === 'approval.task' ? visible.length : 0,
        },
      };
    },
  );
  vi.spyOn(integration, 'taskCenterRuntimeDatabase').mockReturnValue({
    repository: () => ({
      findMany: async () =>
        pageRecords.map((id) => ({
          sourceType: 'approval.task',
          sourceKey: id,
          subject: 'test',
          recordId: id,
        })),
    }),
  } as never);
  vi.spyOn(integration, 'taskCenterIntegration').mockReturnValue({
    reader: { list: center },
  } as never);
  const service = createAppApprovalService(
    {} as ConstructorParameters<typeof ApprovalService>[0],
    [
      {
        name: 'test',
        kind: 'test',
        options: {},
        lifecycle: { collection: 'test' },
      } as ConstructorParameters<typeof ApprovalService>[1][number],
    ],
    {},
  );
  return {
    service,
    center,
    revoke: () => {
      visible = [];
    },
  };
}

it('never grants access from a stale personal index, comments, management actions or non-decision delegates', async () => {
  const exact = vi
    .spyOn(ApprovalService.prototype, 'involvementOf')
    .mockImplementation(async (_lifecycle, id) =>
      ['assignee', 'copied', 'decider', 'decide-delegate'].includes(String(id))
        ? ['assignee']
        : [],
    );
  const f = fixture([
    'assignee',
    'copied',
    'decider',
    'commenter',
    'administrator',
    'filer',
    'decide-delegate',
    'work-delegate',
  ]);
  const expected = ['assignee', 'copied', 'decider', 'decide-delegate'];
  expect(
    await approvalReadableRecords(f.service, 'test', 'viewer', false),
  ).toEqual(expected);
  expect(
    await withApprovalQueryReads(() =>
      approvalReadableRecords(f.service, 'test', 'viewer', false),
    ),
  ).toEqual(expected);
  expect(exact).toHaveBeenCalledWith('test', 'work-delegate', 'viewer');
  expect(f.center).toHaveBeenCalledWith(
    'viewer',
    expect.objectContaining({ includeTotal: false, subject: 'test' }),
  );
});

it('retains actual task actors across all index pages and rereads revocations on the next request', async () => {
  vi.spyOn(ApprovalService.prototype, 'involvementOf').mockResolvedValue([]);
  vi.spyOn(ApprovalService.prototype, 'tasksFor').mockResolvedValue([
    { actorId: 'viewer' },
  ] as never);
  const f = fixture(Array.from({ length: 101 }, (_, i) => `record-${i}`));
  const ids = await approvalReadableRecords(f.service, 'test', 'viewer', true);
  expect(ids).toHaveLength(101);
  expect(ids).toContain('record-100');
  expect(f.center).toHaveBeenCalledWith(
    'viewer',
    expect.objectContaining({ page: 2 }),
  );
  f.revoke();
  expect(
    await approvalReadableRecords(f.service, 'test', 'viewer', true),
  ).toEqual([]);
});
