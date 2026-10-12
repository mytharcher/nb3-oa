// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { createTestI18nRuntime } from '@nocobase/i18n/testing';
import { scheduleTitle } from '../../client/pages/administration/scheduler/pages/schedule-title.js';
import enUS from '../../client/locales/administration/scheduler/en-US.js';
import zhCN from '../../client/locales/administration/scheduler/zh-CN.js';

const ns = '@nocobase/app-plugin-scheduler';
const runtime = await createTestI18nRuntime({
  namespaces: {
    [ns]: {
      'en-US': async () => ({ default: enUS }),
      'zh-CN': async () => ({ default: zhCN }),
    },
  },
});

describe('scheduler names', () => {
  it('translates stored English and unresolved titles in the current UI language', async () => {
    await runtime.ensureLocaleLoaded('zh-CN');
    const chinese = runtime.getFixedT(ns, 'zh-CN');
    const english = runtime.getFixedT(ns, 'en-US');
    const annual = {
      key: 'oa.annual-leave.daily-reconciliation',
      title: 'Annual leave automatic accrual',
    };
    expect(scheduleTitle(annual, chinese)).toBe('年假自动计提');
    expect(scheduleTitle(annual, english)).toBe(
      'Annual leave automatic accrual',
    );
    expect(
      scheduleTitle(
        {
          key: 'oa.loanRequests.reminders',
          title: 'loanRequests.scheduleTitle',
        },
        chinese,
      ),
    ).toBe('借款还款提醒');
    expect(
      scheduleTitle({ key: 'custom', title: 'Custom task' }, chinese),
    ).toBe('Custom task');
  });
});
