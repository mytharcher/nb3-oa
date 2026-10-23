// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest';
import {
  ApprovalService,
  type ApprovalQuery,
  type ApprovalRelations,
  type ApprovalTaskReference,
} from '@nocobase/app-plugin-approval/server';
import {
  approvalReadableRecords,
  createAppApprovalService,
  initializeApprovalQuery,
  withApprovalQueryReads,
} from '../../../server/providers/approval-runtime/query-service.js';

afterEach(() => vi.restoreAllMocks());
it('keeps comments, management actors and filers out, and checks decide-only delegation even inside GET batching', async () => {
  const exact = vi
    .spyOn(ApprovalService.prototype, 'involvementOf')
    .mockImplementation(async (_lifecycle, id) =>
      id === 'decider' || id === 'decide-delegate' ? ['delegate'] : [],
    );
  const runtime = {} as ConstructorParameters<typeof ApprovalService>[0];
  const approval = {
    name: 'test',
    kind: 'test',
    options: {},
    lifecycle: { name: 'test', collection: 'test' },
  } as ConstructorParameters<typeof ApprovalService>[1][number];
  const service = createAppApprovalService(runtime, [approval], {});
  const relations: ApprovalRelations[] = [
    ['applicant', ['applicant']],
    ['assignee', ['assignee']],
    ['copied', ['copied']],
    ['decider', ['actor']],
    ['commenter', ['actor']],
    ['administrator', ['actor']],
    ['filer', ['filer']],
    ['decide-delegate', ['delegate']],
    ['work-delegate', ['delegate']],
  ].map(([recordId, relations]) => ({
    lifecycle: 'test',
    recordId,
    relations,
  })) as ApprovalRelations[];
  const query = {
    register: vi.fn(),
    involvement: vi.fn(async () => relations),
    taskRelations: vi.fn(async () => []),
  } as unknown as ApprovalQuery;
  const dispose = await initializeApprovalQuery(service, query);
  const expected = [
    'applicant',
    'assignee',
    'copied',
    'decider',
    'decide-delegate',
  ];
  expect(
    await approvalReadableRecords(service, 'test', 'viewer', false),
  ).toEqual(expected);
  expect(
    await withApprovalQueryReads(() =>
      approvalReadableRecords(service, 'test', 'viewer', false),
    ),
  ).toEqual(expected);
  expect(exact).toHaveBeenCalledWith('test', 'work-delegate', 'viewer');
  dispose!();
});
it('retains all task actors across pages and reads revocations on the next call', async () => {
  vi.spyOn(ApprovalService.prototype, 'involvementOf').mockResolvedValue([]);
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
  let revoked = false;
  const taskRelations = vi.fn(
    async (_business: string, _actor: string, page: { offset: number }) =>
      revoked
        ? []
        : Array.from(
            { length: page.offset === 0 ? 1000 : 1 },
            (_, index) =>
              ({
                lifecycle: 'test',
                recordId: `record-${page.offset + index}`,
              }) as ApprovalTaskReference,
          ),
  );
  const query = {
    register: vi.fn(),
    involvement: vi.fn(async () => []),
    taskRelations,
  } as unknown as ApprovalQuery;
  const dispose = await initializeApprovalQuery(service, query);
  const ids = await approvalReadableRecords(service, 'test', 'viewer', true);
  expect(ids).toHaveLength(1001);
  expect(ids).toContain('record-1000');
  revoked = true;
  expect(
    await approvalReadableRecords(service, 'test', 'viewer', true),
  ).toEqual([]);
  dispose!();
});
