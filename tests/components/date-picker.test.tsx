import {
  TestI18nProvider,
  createTestI18nRuntime,
} from '@nocobase/i18n/testing';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { ReactElement, ReactNode } from 'react';
import { describe, expect, it, vi } from 'vitest';

import { DatePicker, DateRangePicker } from '@/components/date-picker';

import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';

const namespace = '@nocobase/app-template-default';
const english = await createTestI18nRuntime({
  locale: 'en-US',
  application: { namespace, resources: enUS },
});
const chinese = await createTestI18nRuntime({
  locale: 'zh-CN',
  application: { namespace, resources: zhCN },
});

function English({ children }: { readonly children: ReactNode }): ReactElement {
  return <TestI18nProvider runtime={english}>{children}</TestI18nProvider>;
}
function Chinese({ children }: { readonly children: ReactNode }): ReactElement {
  return <TestI18nProvider runtime={chinese}>{children}</TestI18nProvider>;
}

describe('DatePicker', () => {
  it('shows the translated placeholder and picks a day', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const onBlur = vi.fn();
    render(
      <DatePicker
        id='due'
        value={undefined}
        onChange={onChange}
        onBlur={onBlur}
      />,
      { wrapper: English },
    );

    const trigger = screen.getByRole('button', { name: /Pick a date/u });
    expect(trigger).toHaveAttribute('id', 'due');
    await user.click(trigger);
    const days = await screen.findAllByRole('button', { name: /15th/u });
    await user.click(days[0]!);

    expect(onChange).toHaveBeenCalledTimes(1);
    const picked = onChange.mock.calls[0]![0] as Date;
    expect(picked.getDate()).toBe(15);
    expect(onBlur).toHaveBeenCalled();
  });

  it('formats the value in the interface language', () => {
    const value = new Date(2026, 9, 10);
    const { unmount } = render(
      <DatePicker value={value} onChange={() => {}} />,
      { wrapper: English },
    );
    expect(screen.getByRole('button')).toHaveTextContent('October 10th, 2026');
    unmount();

    render(<DatePicker value={value} onChange={() => {}} />, {
      wrapper: Chinese,
    });
    expect(screen.getByRole('button')).toHaveTextContent('2026年10月10日');
  });

  it('labels the calendar navigation in Chinese', async () => {
    const user = userEvent.setup();
    render(<DatePicker value={new Date(2026, 9, 10)} onChange={() => {}} />, {
      wrapper: Chinese,
    });
    await user.click(screen.getByRole('button'));
    expect(
      await screen.findByRole('button', { name: /下个月|下一月/u }),
    ).toBeInTheDocument();
  });
});

describe('DateRangePicker', () => {
  it('shows the range placeholder and the selected range', () => {
    const { rerender } = render(
      <DateRangePicker value={undefined} onChange={() => {}} />,
      { wrapper: English },
    );
    expect(
      screen.getByRole('button', { name: /Pick a date range/u }),
    ).toBeInTheDocument();

    rerender(
      <DateRangePicker
        value={{ from: new Date(2026, 9, 1), to: new Date(2026, 9, 5) }}
        onChange={() => {}}
      />,
    );
    expect(screen.getByRole('button')).toHaveTextContent(
      'Oct 1, 2026 – Oct 5, 2026',
    );
  });
});
