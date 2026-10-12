// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import type { DatabaseConnection } from '@nocobase/db';
import {
  createRecruitmentSubmissionCoordinator,
  type RecruitmentProposal,
  type RecruitmentSubmissionDependencies,
} from '../../../server/providers/recruitment/submission.js';

function fixture() {
  const tx = { marker: 'transaction' } as unknown as DatabaseConnection;
  const outer = { marker: 'outer' } as unknown as DatabaseConnection;
  const account = {
    initialized: true,
    departmentId: 'd1',
    positionId: 'p1',
    year: 2026,
  };
  const band = {
    gradeId: 'g1',
    gradeCode: 'manager',
    gradeTitle: 'Manager',
    rank: 5,
    minimumCents: 10000,
    maximumCents: 20000,
    revisionId: 'revision1',
    tableVersion: 3,
  };
  const state = { held: 0, written: false };
  const deps = {
    org: {
      activeChain: vi.fn(async () => [{ id: 'd1' }]),
      listPositions: vi.fn(async () => [{ id: 'p1', active: true }]),
      listGrades: vi.fn(async () => [{ id: 'g1', active: true }]),
      headOf: vi.fn(async () => 'head'),
      executiveOf: vi.fn(async () => 'vp'),
      dutyRoleMembers: vi.fn(async (role: string) =>
        role === 'hrbp' ? ['bp1', 'bp2'] : [role],
      ),
    },
    employees: {
      getById: vi.fn(async (id: string) => ({
        id,
        status: 'leaving',
        positionId: 'p1',
      })),
    },
    grades: { snapshotForGrade: vi.fn(async () => band) },
    rules: {
      snapshot: vi.fn(async () => ({
        'grade.directorRank': 7,
        'sla.remindHours': 24,
        'sla.escalateHours': 48,
      })),
    },
    headcounts: {
      within: vi.fn(
        async (
          _: DatabaseConnection,
          work: (c: DatabaseConnection) => Promise<unknown>,
        ) => {
          const before = { ...state };
          try {
            return await work(tx);
          } catch (error) {
            Object.assign(state, before);
            throw error;
          }
        },
      ),
      balance: vi.fn(async () => account),
      hold: vi.fn(async (input: { quantity: number }) => {
        state.held = input.quantity;
        return { accountId: 'a1', quantity: input.quantity, state: 'pending' };
      }),
      reviseHold: vi.fn(async (input: { quantity: number }) => {
        state.held = input.quantity;
        return { accountId: 'a1', quantity: input.quantity, state: 'pending' };
      }),
    },
  };
  const service = createRecruitmentSubmissionCoordinator(
    deps as unknown as RecruitmentSubmissionDependencies,
  );
  const proposal: RecruitmentProposal = {
    id: 'r1',
    departmentId: 'd1',
    positionId: 'p1',
    gradeId: 'g1',
    accountId: 'a1',
    year: 2026,
    quantity: 1,
    kind: 'additional',
    replacementEmployeeIds: [],
    minimumCents: 12000,
    maximumCents: 18000,
  };
  const command = {
    actorId: 'head',
    requestKey: 'submit1',
    reason: 'new position',
    resubmission: false,
    now: new Date('2026-10-11T00:00:00Z'),
    authorizeTarget: vi.fn(async () => true),
  };
  const write = vi.fn(async (...args: unknown[]) => {
    state.written = true;
    return args;
  });
  const submit = () => service.submit(proposal, command, outer, write);
  return {
    deps,
    service,
    proposal,
    command,
    write,
    submit,
    tx,
    outer,
    band,
    account,
    state,
  };
}

describe('recruitment submission coordination', () => {
  it('takes the guard before scoped authorization and passes one transaction to every public service', async () => {
    const f = fixture();
    const output = await f.submit();
    expect(f.deps.headcounts.within).toHaveBeenCalledWith(
      f.outer,
      expect.any(Function),
    );
    expect(f.command.authorizeTarget).toHaveBeenCalledWith('d1', f.tx);
    expect(f.deps.headcounts.within.mock.invocationCallOrder[0]).toBeLessThan(
      f.command.authorizeTarget.mock.invocationCallOrder[0],
    );
    expect(f.deps.org.listPositions).toHaveBeenCalledWith(f.tx);
    expect(f.deps.grades.snapshotForGrade).toHaveBeenCalledWith('g1', f.tx);
    expect(f.deps.headcounts.hold).toHaveBeenCalledWith(
      expect.objectContaining({ sourceKind: 'oa.recruitment', sourceId: 'r1' }),
      f.tx,
    );
    expect(output[3]).toBe(f.tx);
  });
  it('keeps salaries and published salary band outside the safe SDK snapshot', async () => {
    const f = fixture();
    const [safe, salary] = await f.submit();
    expect(safe).toMatchObject({
      gradeTableVersion: 3,
      gradeRevisionId: 'revision1',
      rank: 5,
    });
    expect(JSON.stringify(safe)).not.toContain('Cents');
    expect(salary).toMatchObject({
      minimumCents: 12000,
      maximumCents: 18000,
      band: { revisionId: 'revision1' },
    });
  });
  it('department head skips head but an authorized employee still requires head', async () => {
    const f = fixture();
    expect((await f.submit())[0]).toMatchObject({ headRequired: false });
    f.command.actorId = 'employee';
    expect((await f.submit())[0]).toMatchObject({
      headRequired: true,
      headId: 'head',
    });
  });
  it('additional capacity always includes executive and general manager', async () => {
    const f = fixture();
    expect((await f.submit())[0]).toMatchObject({
      executiveRequired: true,
      gmRequired: true,
    });
  });
  it('low-rank replacement skips executive and GM; high-rank replacement includes GM', async () => {
    const f = fixture();
    f.proposal.kind = 'replacement';
    f.proposal.replacementEmployeeIds = ['e1'];
    expect((await f.submit())[0]).toMatchObject({
      executiveRequired: false,
      gmRequired: false,
    });
    f.band.rank = 7;
    expect((await f.submit())[0]).toMatchObject({
      executiveRequired: false,
      gmRequired: true,
    });
    expect(f.deps.employees.getById).toHaveBeenCalledWith('e1', f.tx);
  });
  it('does not infer broad employee permission or reserve anything after scoped refusal', async () => {
    const f = fixture();
    f.command.authorizeTarget.mockResolvedValue(false);
    await expect(f.submit()).rejects.toThrow('RECRUITMENT_FORBIDDEN');
    expect(f.deps.org.activeChain).not.toHaveBeenCalled();
    expect(f.deps.headcounts.hold).not.toHaveBeenCalled();
  });
  it.each(['departmentId', 'positionId', 'year'] as const)(
    'rejects a headcount account mismatched by %s',
    async (field) => {
      const f = fixture();
      Object.assign(f.account, { [field]: field === 'year' ? 2027 : 'other' });
      await expect(f.submit()).rejects.toThrow('RECRUITMENT_ACCOUNT_MISMATCH');
      expect(f.deps.headcounts.hold).not.toHaveBeenCalled();
    },
  );
  it('requires an initialized account', async () => {
    const f = fixture();
    f.account.initialized = false;
    await expect(f.submit()).rejects.toThrow('RECRUITMENT_ACCOUNT_MISMATCH');
  });
  it.each([0, 1.5, Number.MAX_SAFE_INTEGER + 1])(
    'rejects invalid quantity %s',
    async (quantity) => {
      const f = fixture();
      f.proposal.quantity = quantity;
      await expect(f.submit()).rejects.toThrow('RECRUITMENT_INVALID_QUANTITY');
    },
  );
  it.each([{ ids: ['e1', 'e1'] }, { ids: [] }, { ids: ['e1', 'e2'] }])(
    'requires exactly one distinct replacement per requested seat: %s',
    async ({ ids }) => {
      const f = fixture();
      f.proposal.kind = 'replacement';
      f.proposal.replacementEmployeeIds = ids;
      await expect(f.submit()).rejects.toThrow(
        'RECRUITMENT_INVALID_REPLACEMENTS',
      );
    },
  );
  it('rejects active employees as replacement sources', async () => {
    const f = fixture();
    f.proposal.kind = 'replacement';
    f.proposal.replacementEmployeeIds = ['e1'];
    f.deps.employees.getById.mockResolvedValue({
      id: 'e1',
      status: 'regular',
      positionId: 'p1',
    });
    await expect(f.submit()).rejects.toThrow(
      'RECRUITMENT_REPLACEMENT_UNAVAILABLE',
    );
  });
  it('fails unsupported clocks and ambiguous single roles before reserving', async () => {
    const f = fixture();
    f.deps.rules.snapshot.mockResolvedValue({
      'grade.directorRank': 7,
      'sla.remindHours': 12,
      'sla.escalateHours': 48,
    });
    await expect(f.submit()).rejects.toThrow('RECRUITMENT_UNSUPPORTED_SLA');
    expect(f.deps.headcounts.hold).not.toHaveBeenCalled();
    f.deps.rules.snapshot.mockResolvedValue({
      'grade.directorRank': 7,
      'sla.remindHours': 24,
      'sla.escalateHours': 48,
    });
    f.deps.org.dutyRoleMembers.mockResolvedValue(['one', 'two']);
    await expect(f.submit()).rejects.toThrow(
      'RECRUITMENT_AMBIGUOUS_SINGLE_ROLE',
    );
  });
  it('preserves empty assignee roles for actual SDK hold/appoint instead of silently skipping', async () => {
    const f = fixture();
    f.deps.org.dutyRoleMembers.mockResolvedValue([]);
    expect((await f.submit())[0]).toMatchObject({
      hrDirectorId: null,
      gmId: null,
      hrbpIds: [],
      gmRequired: true,
    });
  });
  it('revises the source reservation atomically and never releases first', async () => {
    const f = fixture();
    f.command.resubmission = true;
    f.state.held = 2;
    await f.submit();
    expect(f.deps.headcounts.hold).not.toHaveBeenCalled();
    expect(f.deps.headcounts.reviseHold).toHaveBeenCalledTimes(1);
  });
  it('propagates SDK/write failure to the public guard so the reservation transaction rolls back', async () => {
    const f = fixture();
    f.write.mockRejectedValue(new Error('SDK write failed'));
    await expect(f.submit()).rejects.toThrow('SDK write failed');
    expect(f.state.held).toBe(0);
    // This tests the coordinator's transaction boundary; real headcounts database rollback/concurrency is
    // covered separately, and this is not evidence that the recruitment SDK lifecycle is installed.
  });
  it('rejects either out-of-band salary endpoint before reservation', async () => {
    const f = fixture();
    f.proposal.maximumCents = 20001;
    await expect(f.submit()).rejects.toThrow('OUTSIDE_RANGE');
    expect(f.deps.headcounts.hold).not.toHaveBeenCalled();
  });
});
