import { expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import enUS from '../../../client/locales/en-US.js';
import zhCN from '../../../client/locales/zh-CN.js';
import { Timeline } from '../../../client/pages/onboarding/timeline.js';
for (const [language, resources, title, label] of [
  ['en-US', enUS, 'Timeline', 'Task forcibly completed'],
  ['zh-CN', zhCN, '办理时间线', '强制完成任务'],
] as const)
  it(`renders safe events in ${language} and company time zone`, async () => {
    const runtime = await createTestI18nRuntime({
      application: { namespace: 'nb3-oa', resources },
      locale: language,
    });
    render(
      <TestI18nProvider runtime={runtime}>
        <Timeline
          timeZone='Asia/Shanghai'
          entries={[
            {
              id: 'a',
              at: '2026-10-11T01:00:00.000Z',
              action: 'onboarding.task.forceComplete',
              actor: null,
              kind: 'it',
              forced: true,
              accountEnabled: true,
            },
            {
              id: 'b',
              at: '2026-10-11T02:00:00.000Z',
              action: 'onboarding.task.transfer',
              actor: { id: 'u', name: 'Handler' },
              from: { id: 'u', name: 'Handler' },
              to: { id: 'v', name: 'Replacement' },
            },
          ]}
        />
      </TestI18nProvider>,
    );
    expect(screen.getByRole('region', { name: title })).toBeTruthy();
    expect(screen.getByText(label)).toBeTruthy();
    expect(screen.getByText('Replacement')).toBeTruthy();
    const time = screen.getAllByText(/Asia\/Shanghai/, {
      selector: 'time',
    })[0]!;
    expect(time.getAttribute('datetime')).toBe('2026-10-11T01:00:00.000Z');
  });
