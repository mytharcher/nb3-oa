import { ApiClientError } from '@nocobase/app-client';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it, vi } from 'vitest';
import base from '../../../client/locales/en-US.js';
import copy from '../../../client/locales/modules/departure.en-US.js';
import { ErrorState } from '../../../client/pages/departure-requests/states.js';
const runtime = await createTestI18nRuntime({
  application: {
    namespace: 'nb3-oa',
    resources: { ...base, departureRequests: copy },
  },
});
afterEach(cleanup);
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
