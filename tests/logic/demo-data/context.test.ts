// @vitest-environment node
import { it, expect } from 'vitest';
import {
  demoContext,
  demoContexts,
  demoNow,
  demoPartition,
  demoRecordPartition,
  demoLocaleFor,
  inDemoPartition,
} from '../../../server/providers/demo-data/context.js';
import { assertBusinessTimeline } from '../../../server/providers/demo-data/validate.js';
import { addDays } from '../../../cli/commands/lib/trial-data/bootstrap.js';
import { getTrialAccounts } from '../../../cli/commands/lib/trial-data/accounts.js';
import {
  demoText,
  demoMarker,
} from '../../../server/providers/demo-data/content.js';
import { notificationLocaleGroups } from '../../../server/providers/approval-notifications/locales.js';

it('keeps ordinary recipients out of the import language and resolves registered users without actor context', () => {
  const scope = {
    id: 'notification-scope',
    locale: 'zh-CN' as const,
    baseDate: '2026-10-26',
    users: new Set(['sample-user']),
  };
  demoContext.run(scope, () => {
    expect(demoLocaleFor()).toBe('zh-CN');
    expect(demoLocaleFor('sample-user')).toBe('zh-CN');
    expect(demoLocaleFor('ordinary-user')).toBeUndefined();
    expect(
      notificationLocaleGroups(
        ['sample-user', 'ordinary-user', 'sample-user'],
        'en-US',
      ),
    ).toEqual(
      new Map([
        ['zh-CN', ['sample-user']],
        ['en-US', ['ordinary-user']],
      ]),
    );
  });
  expect(demoLocaleFor()).toBeUndefined();
});

it.each([
  ['zh-CN', '许知衡', '研发部', '陪同家人就医的休假安排'],
  [
    'en-US',
    'Daniel Brooks',
    'Engineering',
    'Leave for a family medical appointment',
  ],
] as const)(
  'generates %s people, departments and business titles from the same scenarios',
  (locale, name, department, title) => {
    demoContext.run(
      {
        id: 'bilingual-fixture',
        locale,
        baseDate: '2026-10-26',
        users: new Set(),
      },
      () => {
        expect(
          getTrialAccounts().find((account) => account.key === 'manager')?.name,
        ).toBe(name);
        expect(demoText('示例·研发部')).toBe(department);
        expect(demoMarker('leave-draft')).toContain(title);
      },
    );
  },
);

it('keeps historical clocks isolated from concurrent ordinary business and wall time', async () => {
  const scope = {
    id: 'scope-a',
    locale: 'en-US' as const,
    baseDate: '2024-02-29',
    users: new Set(['person-a']),
    now: new Date('2022-02-28T01:00:00Z'),
  };
  const before = Date.now();
  await Promise.all([
    demoContext.run(scope, async () => {
      await Promise.resolve();
      expect(demoNow().toISOString()).toBe('2022-02-28T01:00:00.000Z');
      expect(Date.now()).toBeGreaterThanOrEqual(before);
    }),
    (async () => {
      await Promise.resolve();
      expect(demoNow().getTime()).toBeGreaterThanOrEqual(before);
    })(),
  ]);
  expect(demoNow().getTime()).toBeGreaterThanOrEqual(before);
  expect(addDays('2024-02-29', 1)).toBe('2024-03-01');
  expect(addDays('2026-01-01', -1)).toBe('2025-12-31');
});
it('selects the record partition for administrator and background lifecycle access', () => {
  const scope = {
    id: 'partition-a',
    locale: 'zh-CN' as const,
    baseDate: '2026-10-19',
    users: new Set(['demo-a']),
  };
  demoContexts.set('demo-a', scope);
  const tx = {};
  try {
    demoRecordPartition(tx, { applicantId: 'demo-a' });
    expect(demoPartition(tx)?.id).toBe(scope.id);
    expect(inDemoPartition('demo-a', tx)).toBe(true);
    expect(inDemoPartition('real-person', tx)).toBe(false);
    demoRecordPartition(tx, { applicantId: 'real-person' });
    demoContext.run(scope, () => {
      expect(demoPartition(tx)).toBeUndefined();
      expect(inDemoPartition('demo-a', tx)).toBe(false);
      expect(inDemoPartition('real-person', tx)).toBe(true);
    });
  } finally {
    demoContexts.delete('demo-a');
  }
});
it('independently rejects reversed chronology and fractional cents', () => {
  expect(() =>
    assertBusinessTimeline({
      createdAt: '2026-02-01',
      updatedAt: '2026-01-31',
    }),
  ).toThrow('DEMO_INVALID_TIMELINE');
  expect(() =>
    assertBusinessTimeline({
      createdAt: '2026-02-01',
      completedAt: '2026-01-31',
    }),
  ).toThrow('DEMO_INVALID_TIMELINE');
  expect(() => assertBusinessTimeline({ amountCents: 1.2 })).toThrow(
    'DEMO_INVALID_MONEY',
  );
  expect(() =>
    assertBusinessTimeline({
      createdAt: '2024-02-29',
      completedAt: '2024-03-01',
      amountCents: 12500,
    }),
  ).not.toThrow();
});

it('provides native English for every static business sample string, including actual newlines', async () => {
  const { readFile } = await import('node:fs/promises');
  const ts = await import('typescript');
  const { demoText } =
    await import('../../../server/providers/demo-data/content.js');
  const scope = {
    id: 'demo-static-content',
    locale: 'en-US' as const,
    baseDate: '2026-10-19',
    users: new Set<string>(),
  };
  await demoContext.run(scope, async () => {
    for (const file of [
      'bootstrap',
      'scenarios',
      'collaboration',
      'follow-ups',
      'engine',
      'headcounts',
    ]) {
      const source = await readFile(
        new URL(
          `../../../cli/commands/lib/trial-data/${file}.ts`,
          import.meta.url,
        ),
        'utf8',
      );
      const tree = ts.createSourceFile(
        file,
        source,
        ts.ScriptTarget.Latest,
        true,
      );
      const visit = (node: import('typescript').Node): void => {
        if (
          ts.isCallExpression(node) &&
          node.expression.getText(tree) === 'demoText' &&
          node.arguments[0] &&
          ts.isStringLiteralLike(node.arguments[0])
        ) {
          expect(
            demoText(node.arguments[0].text),
            `${file}: ${node.arguments[0].text}`,
          ).not.toMatch(/\p{Script=Han}/u);
        }
        ts.forEachChild(node, visit);
      };
      visit(tree);
    }
  });
});
