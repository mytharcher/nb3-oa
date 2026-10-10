import { ApiClientError } from '@nocobase/app-client';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import enUS from '../../client/locales/en-US.js';
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
    ['LEAVE_BALANCE_UNAVAILABLE', /balance/i],
    ['LEAVE_ATTACHMENT_REQUIRED', /attachment/i],
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
