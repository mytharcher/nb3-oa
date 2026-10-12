// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { describe, expect, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { auditServiceToken } from '../../../server/providers/audit/index.ts';
import { organizationServiceToken } from '../../../server/providers/org/index.ts';
import { dictionaryServiceToken } from '../../../server/providers/platform/index.ts';
import { budgetServiceToken } from '../../../server/providers/budgets/index.ts';
import {
  createPlatformAppTest,
  createUser,
  grantSettings,
  write,
} from '../platform/helpers.ts';
const test = createPlatformAppTest();
interface View {
  id: string;
  allocatedCents: number;
  heldCents: number;
  usedCents: number;
  availableCents: number;
  department: { title: string };
}
async function body(response: Response) {
  return (await response.json()) as { data: View; error?: { reason: string } };
}
describe('finance budget API', () => {
  test('requires identity and distinct settings read/update, exact cents, active dimensions and immutable manual history', async ({
    app,
    testApp,
    request,
  }) => {
    const reader = await createUser(testApp, 'Budget reader'),
      editor = await createUser(testApp, 'Budget editor'),
      stranger = await createUser(testApp, 'Budget stranger');
    await grantSettings(testApp, reader.user.id, 'oa.budgets', ['read']);
    await grantSettings(testApp, editor.user.id, 'oa.budgets', [
      'read',
      'update',
    ]);
    const dept = await app.container
      .resolve(organizationServiceToken)
      .createDepartment({ title: 'Budget HQ' }, { actorId: editor.user.id });
    const dict = app.container.resolve(dictionaryServiceToken);
    await dict.create(
      'budgetSubject',
      {
        code: 'budget-test',
        label: { 'en-US': 'Test subject', 'zh-CN': '测试科目' },
      },
      editor.user.id,
    );
    const input = {
      departmentId: dept.id,
      year: 2026,
      subject: 'budget-test',
      deltaAmount: '100.01',
      reason: 'Annual approved allocation',
      requestKey: randomUUID(),
    };
    expect((await request('/budgets')).status).toBe(401);
    expect((await stranger.fetch('/budgets')).status).toBe(403);
    expect(
      (await reader.fetch('/budgets/allocations', write('POST', input))).status,
    ).toBe(403);
    const created = await editor.fetch(
      '/budgets/allocations',
      write('POST', input),
    );
    expect(created.status).toBe(201);
    const b = (await body(created)).data;
    expect(b).toMatchObject({
      allocatedCents: 10001,
      availableCents: 10001,
      department: { title: 'Budget HQ' },
    });
    expect(
      (await editor.fetch('/budgets/allocations', write('POST', input))).status,
    ).toBe(201);
    expect(
      (
        await editor.fetch(
          '/budgets/allocations',
          write('POST', { ...input, requestKey: randomUUID() }),
        )
      ).status,
    ).toBe(409);
    expect(
      (
        await editor.fetch(
          '/budgets/allocations',
          write('POST', {
            ...input,
            year: 2027,
            deltaAmount: '1.001',
            requestKey: randomUUID(),
          }),
        )
      ).status,
    ).toBe(400);
    expect(
      (
        await editor.fetch(
          '/budgets/allocations',
          write('POST', {
            ...input,
            departmentId: randomUUID(),
            requestKey: randomUUID(),
          }),
        )
      ).status,
    ).toBe(400);
    const adjustment = {
      deltaAmount: '-10.01',
      reason: 'Correct allocation',
      requestKey: randomUUID(),
    };
    const reduced = await editor.fetch(
      `/budgets/${b.id}/adjustments`,
      write('POST', adjustment),
    );
    expect(reduced.status).toBe(200);
    expect((await body(reduced)).data.allocatedCents).toBe(9000);
    expect(
      (
        await editor.fetch(
          `/budgets/${b.id}/adjustments`,
          write('POST', adjustment),
        )
      ).status,
    ).toBe(200);
    expect(
      (
        await editor.fetch(
          `/budgets/${b.id}/adjustments`,
          write('POST', {
            ...adjustment,
            deltaAmount: '-90.01',
            requestKey: randomUUID(),
          }),
        )
      ).status,
    ).toBe(400);
    const ledger = await reader.fetch(
      `/budgets/${b.id}/ledger?pageSize=1&orderBy=allocatedDelta&direction=asc`,
    );
    expect(ledger.status).toBe(200);
    const history = (await ledger.json()) as {
      data: { allocatedDelta: number; actor: { name: string } }[];
      meta: { total: number };
    };
    expect(history.meta.total).toBe(2);
    const ledgerOverflow = (await (
      await reader.fetch(`/budgets/${b.id}/ledger?page=999&pageSize=1`)
    ).json()) as { data: unknown[]; meta: { page: number; total: number } };
    expect(ledgerOverflow.meta).toMatchObject({ page: 2, total: 2 });
    expect(ledgerOverflow.data).toHaveLength(1);

    expect(history.data[0]).toMatchObject({
      allocatedDelta: -1001,
      actor: { name: 'Budget editor' },
    });
    const entry = await dict.get('budgetSubject', 'budget-test');
    await dict.update(
      'budgetSubject',
      entry!.id,
      { active: false },
      editor.user.id,
    );
    expect(
      (
        await editor.fetch(
          `/budgets/${b.id}/adjustments`,
          write('POST', { ...adjustment, requestKey: randomUUID() }),
        )
      ).status,
    ).toBe(400);
    expect((await reader.fetch(`/budgets/${b.id}`)).status).toBe(200);
  });
  test('sorts all matching balances before paging and rolls allocation back with audit', async ({
    app,
    testApp,
  }) => {
    const user = await createUser(testApp, 'Finance');
    await grantSettings(testApp, user.user.id, 'oa.budgets', [
      'read',
      'update',
    ]);
    const db = app.container.resolve(databaseManagerToken),
      s = app.container.resolve(budgetServiceToken),
      dept = await app.container
        .resolve(organizationServiceToken)
        .createDepartment(
          { title: 'Sorted budgets' },
          { actorId: user.user.id },
        );
    const dict = app.container.resolve(dictionaryServiceToken);
    await dict.create(
      'budgetSubject',
      { code: 'sort-test', label: { 'en-US': 'Sort test' } },
      user.user.id,
    );
    for (const [year, cents] of [
      [2024, 500],
      [2025, 999],
      [2026, 100],
    ] as const)
      await db.transaction((tx) =>
        s.allocate(
          {
            departmentId: dept.id,
            subject: 'sort-test',
            year,
            deltaCents: cents,
            actorId: user.user.id,
            reason: 'Fixture',
            reference: 'annual',
            requestKey: randomUUID(),
          },
          tx,
        ),
      );
    const response = await user.fetch(
      `/budgets?departmentId=${dept.id}&pageSize=1&orderBy=availableCents&direction=desc`,
    );
    const result = (await response.json()) as {
      data: View[];
      meta: { total: number };
    };
    expect(result.meta.total).toBe(3);
    expect(result.data[0].availableCents).toBe(999);
    const overflow = (await (
      await user.fetch(
        `/budgets?departmentId=${dept.id}&page=999&pageSize=1&orderBy=availableCents&direction=desc`,
      )
    ).json()) as { data: View[]; meta: { page: number; total: number } };
    expect(overflow.meta).toMatchObject({ page: 3, total: 3 });
    expect(overflow.data[0].availableCents).toBe(100);
    const empty = (await (
      await user.fetch(`/budgets?departmentId=${randomUUID()}&page=999`)
    ).json()) as { data: View[]; meta: { page: number; total: number } };
    expect(empty).toMatchObject({ data: [], meta: { page: 1, total: 0 } });

    const audit = app.container.resolve(auditServiceToken);
    const spy = vi
      .spyOn(audit, 'record')
      .mockRejectedValueOnce(new Error('audit unavailable'));
    try {
      const res = await user.fetch(
        '/budgets/allocations',
        write('POST', {
          departmentId: dept.id,
          year: 2027,
          subject: 'sort-test',
          deltaAmount: '10.00',
          reason: 'Annual',
          requestKey: randomUUID(),
        }),
      );
      expect(res.status).toBe(500);
      expect(
        await s.balance({
          departmentId: dept.id,
          year: 2027,
          subject: 'sort-test',
        }),
      ).toBeNull();
    } finally {
      spy.mockRestore();
    }
  });
});
