// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { ApprovalSuggestions } from '@nocobase/app-plugin-approval/server/assistant';
import { createApprovalAiService } from '../../../server/providers/approval-ai/service.js';
import { processOwners } from '../../../server/providers/process-management/owners.js';

const { bindings } = vi.hoisted(() => ({ bindings: vi.fn() }));
vi.mock('../../../server/providers/approval-runtime/query-service.js', () => ({
  approvalTaskBindings: bindings,
}));
function fixture(kind = 'oa.leave', userId = 'reviewer') {
  let allowed = true;
  const task = {
    id: 'task',
    lifecycle: kind,
    recordId: 'record',
    stage: 'manager',
    kind: 'decide',
    role: 'approver',
    assigneeId: 'reviewer',
    status: 'pending',
  };
  const authorize = vi.fn(async () => ({
    effect: allowed ? 'allow' : 'deny',
    conditions: {
      database: {
        [processOwners.find((owner) => owner.kind === kind)!.collection]: {},
      },
    },
  }));
  const row: Record<string, unknown> = {
    id: 'record',
    reason: 'Synthetic business content',
  };
  const findOne = vi.fn(async () => row);
  const withPolicy = vi.fn(() => ({ findOne }));
  const offered = [
    {
      task,
      onBehalfOf: userId === 'delegate' ? 'reviewer' : null,
      actions: [{ name: 'approve' }],
    },
  ];
  const sdk = {
    read: async (work: () => Promise<unknown>) => work(),
    approvals: {
      tasksFor: vi.fn(async () => [task]),
      actionsFor: vi.fn(async () => offered),
    },
  };
  bindings.mockImplementation(() => ({
    approvals: [{ name: kind, options: { freeze: ['reason'] } }],
  }));
  const suggestions = {
    status: vi.fn(async () => ({
      state: 'ready',
      canGenerate: true,
      advice: null,
    })),
    generate: vi.fn(async () => ({
      state: 'generating',
      canGenerate: false,
      advice: null,
    })),
    cancel: vi.fn(async () => ({
      state: 'cancelled',
      canGenerate: true,
      advice: null,
    })),
    read: vi.fn(),
  };
  const dependencies = {
    db: { repository: vi.fn(() => ({ withPolicy, findOne })) },
    authz: {
      subjects: { resolveFor: vi.fn(async () => []) },
      for: vi.fn(() => ({ authorize })),
    },
    owners: processOwners,
    sdk: vi.fn(async () => sdk),
    suggestions,
  };
  const service = createApprovalAiService(
    dependencies as unknown as Parameters<typeof createApprovalAiService>[0],
  );
  return {
    service,
    sdk,
    suggestions,
    task,
    row,
    offered,
    authorize,
    findOne,
    withPolicy,
    target: { lifecycle: kind, recordId: 'record' },
    deny: () => {
      allowed = false;
    },
  };
}
beforeEach(() => vi.clearAllMocks());
describe('native suggestions across OA approval owners', () => {
  it('supports every registered business without a contract-only recipe', async () => {
    const approvalOwners = processOwners.filter(
      (owner) => owner.kind !== 'oa.itRepair',
    );
    expect(approvalOwners).toHaveLength(26);
    for (const owner of approvalOwners) {
      const f = fixture(owner.kind);
      const result = await f.service.reviews(
        owner.kind,
        'record',
        'reviewer',
        (key) => key,
      );
      expect(result).toEqual([
        {
          taskId: 'task',
          title: 'approvalAi.title',
          stage: 'manager',
          state: 'ready',
          canGenerate: true,
          advice: null,
        },
      ]);
      expect(f.authorize).toHaveBeenCalledWith({
        resource: {
          type: 'composite',
          id: owner.kind === 'oa.contract' ? 'oa.contract' : owner.resource,
        },
        action: 'view',
      });
      expect(f.suggestions.status).toHaveBeenCalledWith(
        'task',
        'reviewer',
        'reviewer',
      );
      expect(f.suggestions.generate).not.toHaveBeenCalled();
    }
  });
  it('rejects lifecycle-only repair owners without reading or generating approval suggestions', async () => {
    const f = fixture('oa.itRepair');
    f.sdk.approvals = null as never;
    await expect(
      f.service.reviews('oa.itRepair', 'record', 'reviewer', String),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    await expect(
      f.service.generate(
        f.target,
        'task',
        'reviewer',
        { requestKey: 'operation' },
        String,
      ),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(bindings).not.toHaveBeenCalled();
    expect(f.suggestions.status).not.toHaveBeenCalled();
    expect(f.suggestions.generate).not.toHaveBeenCalled();
  });
  it('denies action permission and record/field restrictions before calling the plugin', async () => {
    for (const mode of ['permission', 'record', 'field']) {
      const f = fixture();
      if (mode === 'permission') f.deny();
      if (mode === 'record') f.findOne.mockResolvedValueOnce(null as never);
      if (mode === 'field') delete f.row.reason;
      await expect(
        f.service.reviews('oa.leave', 'record', 'reviewer', String),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
      expect(f.suggestions.status).not.toHaveBeenCalled();
    }
  });
  it('does not disclose candidates, completed tasks, or other handlers', async () => {
    for (const mode of ['candidate', 'completed', 'outsider']) {
      const f = fixture();
      if (mode === 'candidate') f.task.status = 'candidate';
      if (mode === 'completed') f.task.status = 'approved';
      if (mode === 'outsider') f.offered.length = 0;
      expect(
        await f.service.reviews('oa.leave', 'record', 'outsider', String),
      ).toEqual([]);
      await expect(
        f.service.generate(
          f.target,
          'task',
          'outsider',
          { requestKey: 'request' },
          String,
        ),
      ).rejects.toMatchObject({ code: 'NOT_FOUND' });
      expect(f.suggestions.generate).not.toHaveBeenCalled();
    }
  });
  it('does not expose another handler report through administrator task operations', async () => {
    const f = fixture('oa.leave', 'administrator');
    f.offered[0].onBehalfOf = null;
    expect(
      await f.service.reviews('oa.leave', 'record', 'administrator', String),
    ).toEqual([]);
    expect(f.suggestions.status).not.toHaveBeenCalled();
  });
  it('passes authoritative assignee and real delegate principal separately', async () => {
    const f = fixture('oa.leave', 'delegate');
    await f.service.generate(
      f.target,
      'task',
      'delegate',
      { requestKey: 'operation', previousId: 'old-generation' },
      String,
    );
    expect(f.suggestions.generate).toHaveBeenCalledWith('task', 'reviewer', {
      principalId: 'delegate',
      requestKey: 'operation',
      previousId: 'old-generation',
    });
    await f.service.cancel(
      f.target,
      'task',
      'delegate',
      'current-generation',
      String,
    );
    expect(f.suggestions.cancel).toHaveBeenCalledWith(
      'task',
      'reviewer',
      'current-generation',
      'delegate',
    );
  });
  it('refuses cross-record/task mutations', async () => {
    const f = fixture();
    await expect(
      f.service.generate(
        f.target,
        'another-task',
        'reviewer',
        { requestKey: 'operation' },
        String,
      ),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
    expect(f.suggestions.generate).not.toHaveBeenCalled();
  });
  it('revalidates authorization before returning a generation response', async () => {
    const f = fixture();
    f.suggestions.generate.mockImplementation(async () => {
      f.deny();
      return { state: 'generating', canGenerate: false, advice: null };
    });
    await expect(
      f.service.generate(
        f.target,
        'task',
        'reviewer',
        { requestKey: 'operation' },
        String,
      ),
    ).rejects.toMatchObject({ code: 'NOT_FOUND' });
  });
  it('rejects forged/unknown realtime targets', async () => {
    const f = fixture();
    expect(await f.service.canSubscribe('unknown', 'reviewer')).toBe(false);
  });
});
// Keep the public plugin contract exercised by the host adapter rather than legacy queue internals.
const _contract: keyof ApprovalSuggestions = 'status';
void _contract;
