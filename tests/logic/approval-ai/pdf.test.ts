// @vitest-environment node
import { expect, it } from 'vitest';
import { extractContractPdf } from '../../../server/providers/contracts/ai-review.js';
import { contractPdf } from '../../fixtures/approval-ai/pdf.js';
it('extracts offline text PDFs with page references and leaves scanned/mixed pages uncovered', async () => {
  const text = await extractContractPdf(
    contractPdf([
      'Contract payment is due within thirty days of acceptance.',
      'Liability is capped at the total contract price.',
    ]),
  );
  expect(text).toContain('[Page 1]');
  expect(text).toContain('thirty days');
  expect(text).toContain('[Page 2]');
  expect(await extractContractPdf(contractPdf([null]))).toBeNull();
  expect(
    await extractContractPdf(
      contractPdf(['Contract has a page with readable legal text.', null]),
    ),
  ).toBeNull();
});
