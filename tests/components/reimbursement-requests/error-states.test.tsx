import { ApiClientError } from '@nocobase/app-client';
import {
  createTestI18nRuntime,
  TestI18nProvider,
} from '@nocobase/i18n/testing';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import en from '../../../client/locales/en-US.js';
import zh from '../../../client/locales/zh-CN.js';
import { ErrorState } from '../../../client/pages/reimbursement-requests/states.js';

afterEach(cleanup);
it.each([
  ['REIMBURSEMENT_PAYMENT_ACCOUNT_REQUIRED', 'paymentAccountRequired'],
  ['REIMBURSEMENT_DEPARTMENT_REQUIRED', 'departmentRequired'],
  ['REIMBURSEMENT_EMPLOYEE_INACTIVE', 'employeeInactive'],
  ['REIMBURSEMENT_LOAN_REQUIRED', 'loanRequired'],
  ['REIMBURSEMENT_CATEGORY_INVALID', 'categoryInvalid'],
  ['REIMBURSEMENT_ATTACHMENT_INVALID', 'attachmentInvalid'],
  ['FIELD_NOT_FOUND', 'configuration'],
  ['INVOICE_ALREADY_OCCUPIED', 'invoiceUnavailable'],
  ['INVOICE_DUPLICATE_LINE', 'invoiceDuplicate'],
  ['EXPENSE_AUTHORIZATION_OVERRUN_REASON', 'overrunReasonRequired'],
])(
  'explains %s in both languages without blaming completed fields',
  async (reason, key) => {
    for (const resources of [en, zh]) {
      const runtime = await createTestI18nRuntime({
        application: { namespace: 'nb3-oa', resources },
      });
      const error = new ApiClientError('Raw private server message', {
        status: 400,
        reason,
      });
      render(
        <TestI18nProvider runtime={runtime}>
          <ErrorState error={error} retry={() => {}} />
        </TestI18nProvider>,
      );
      const errors = resources.reimbursementRequests.errors as Record<
        string,
        string
      >;
      expect(screen.getByText(errors[key])).toBeVisible();
      expect(screen.queryByText(errors.invalid)).toBeNull();
      expect(screen.queryByText('Raw private server message')).toBeNull();
      cleanup();
    }
  },
);
