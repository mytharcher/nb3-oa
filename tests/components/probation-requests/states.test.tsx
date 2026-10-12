import { ApiClientError } from '@nocobase/app-client';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import base from '../../../client/locales/en-US.js';
import copy from '../../../client/locales/modules/probation.en-US.js';
import { ErrorState } from '../../../client/pages/probation-requests/states.js';
const runtime = await createTestI18nRuntime({
  application: { namespace: 'nb3-oa', resources: { ...base, ...copy } },
});
afterEach(cleanup);
it('explains a missing departure adapter and does not claim the declined action completed', () => {
  render(
    <TestI18nProvider runtime={runtime}>
      <ErrorState
        error={
          new ApiClientError('SECRET_RAW_BACKEND_REASON', {
            status: 412,
            reason: 'PROBATION_DEPARTURE_UNAVAILABLE',
          })
        }
        retry={vi.fn()}
      />
    </TestI18nProvider>,
  );
  expect(
    screen.getByText(
      'The departure flow is unavailable; this action was not completed. The general manager review remains pending.',
    ),
  ).toBeTruthy();
  expect(screen.queryByText('SECRET_RAW_BACKEND_REASON')).toBeNull();
  expect(screen.queryByRole('button', { name: /Retry/ })).toBeNull();
});
it('offers retry for temporary failures while permission denial has no futile retry', () => {
  const page = render(
    <TestI18nProvider runtime={runtime}>
      <ErrorState error={new Error('RAW')} retry={vi.fn()} />
    </TestI18nProvider>,
  );
  expect(screen.getByRole('button', { name: 'Retry' })).toBeTruthy();
  page.rerender(
    <TestI18nProvider runtime={runtime}>
      <ErrorState
        error={new ApiClientError('RAW', { status: 403 })}
        retry={vi.fn()}
      />
    </TestI18nProvider>,
  );
  expect(screen.queryByRole('button', { name: 'Retry' })).toBeNull();
});
