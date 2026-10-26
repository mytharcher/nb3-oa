import { cleanup, render } from '@testing-library/react';
import { afterEach, expect, it } from 'vitest';
import { FinanceIntegrationSection } from '../../client/components/finance-integration-section.js';
import { ElectronicSignatureSection } from '../../client/components/electronic-signature-section.js';
import { InvoiceTools } from '../../client/pages/reimbursement-requests/invoice-tools.js';

afterEach(cleanup);

it('withdraws external integration controls before mounting hooks or making requests', () => {
  // No application, authentication or query provider: withdrawn controls must not access them.
  const { container } = render(
    <>
      <FinanceIntegrationSection
        kind='payment'
        record={{ id: 'paid', status: 'paid' }}
      />
      <ElectronicSignatureSection kind='contract' id='contract' />
      <InvoiceTools
        recordId='draft'
        lineId='line'
        fileIds={['file']}
        operation='recognize'
        version='1'
      />
      <InvoiceTools
        recordId='draft'
        lineId='line'
        fileIds={['file']}
        operation='verify'
        version='1'
      />
    </>,
  );
  expect(container).toBeEmptyDOMElement();
});
