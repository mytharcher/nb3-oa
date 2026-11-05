import { ApiClientError } from '@nocobase/app-client';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import enUS from '../../client/locales/en-US.js';
import zhCN from '../../client/locales/zh-CN.js';
import { ErrorState } from '../../client/pages/approvals/states.js';

const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: enUS },
});
function show(status: number, reason?: string) {
  const retry = vi.fn();
  render(
    <TestI18nProvider runtime={runtime}>
      <ErrorState
        error={
          new ApiClientError('private database detail', {
            status,
            reason,
            method: 'POST',
            url: '/api/leaveRequests/id/transition',
          })
        }
        retry={retry}
      />
    </TestI18nProvider>,
  );
  return retry;
}

describe('approval errors', () => {
  it.each([
    ['LEAVE_EMPLOYEE_INACTIVE', /applicant.*active employee record/i],
    ['LEAVE_HANDOVER_INACTIVE', /selected handover person.*unavailable/i],
    ['LEAVE_BALANCE_UNAVAILABLE', /balance/i],
    ['LEAVE_BALANCE_INSUFFICIENT', /balance.*insufficient/i],
    ['LEAVE_ATTACHMENT_REQUIRED', /supporting attachments required/i],
    ['LEAVE_FILE_TYPE', /matching format/i],
    ['LEAVE_FILE_SIZE', /nonempty file up to 5 MB/i],
    ['LEAVE_ATTACHMENT_INVALID', /invalid or do not belong/i],
    ['LEAVE_ATTACHMENTS_UNAVAILABLE', /temporarily unavailable/i],
    ['LEAVE_OVERLAP', /overlap/i],
    ['LEAVE_SLA_CONFIGURATION_UNSUPPORTED', /configuration/i],
  ])('explains %s without inviting an unchanged retry', (reason, message) => {
    show(400, reason as string);
    expect(screen.getByRole('alert')).toHaveTextContent(message as RegExp);
    expect(screen.getByRole('alert').textContent).not.toMatch(/approvals\./);
    expect(
      screen.queryByRole('button', { name: 'Retry' }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText('private database detail'),
    ).not.toBeInTheDocument();
  });

  it('explains denied attachment access without a retry', () => {
    show(403, 'LEAVE_ATTACHMENT_DENIED');
    expect(screen.getByRole('alert')).toHaveTextContent(
      enUS.approvals.attachmentDenied,
    );
    expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
  });

  it('allows recovery from a temporary server failure', async () => {
    const retry = show(500);
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: 'Retry' }));
    expect(retry).toHaveBeenCalledOnce();
    expect(
      screen.queryByText('private database detail'),
    ).not.toBeInTheDocument();
  });
});

it.each([
  ['LEAVE_EMPLOYEE_INACTIVE', '申请人未关联有效的在职员工档案'],
  ['LEAVE_HANDOVER_INACTIVE', '所选工作交接人当前不可用'],
])(
  'identifies the affected person in Chinese for %s',
  async (reason, message) => {
    const chinese = await createTestI18nRuntime({
      locale: 'zh-CN',
      application: { namespace: 'nb3-oa', resources: zhCN },
    });
    render(
      <TestI18nProvider runtime={chinese}>
        <ErrorState
          error={
            new ApiClientError('private detail', {
              status: 400,
              reason,
              method: 'POST',
              url: '/api/leaveRequests/id/transition',
            })
          }
          retry={() => {}}
        />
      </TestI18nProvider>,
    );
    expect(screen.getByRole('alert')).toHaveTextContent(message);
    expect(screen.getByRole('alert')).not.toHaveTextContent(
      '相关员工当前不可用',
    );
  },
);
