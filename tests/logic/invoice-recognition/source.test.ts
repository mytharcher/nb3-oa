// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect, vi } from 'vitest';
import { serverFileRepositoryManagerToken } from '@nocobase/app-plugin-file/server';
import {
  createEmployeesAppTest,
  createEmployee,
  ALL,
} from '../employees/helpers.js';
import { reimbursementServiceToken } from '../../../server/providers/reimbursement/index.js';
import { reimbursementInvoiceSourceToken } from '../../../server/providers/reimbursement/invoice-source.js';
vi.setConfig({ testTimeout: 120000 });
const test = createEmployeesAppTest();
test('invoice source reads actual protected upload and refuses another owner or hidden fields', async ({
  testApp,
}) => {
  const c = testApp.application.container;
  const owner = await createEmployee(testApp, 'Invoice owner'),
    outsider = await createEmployee(testApp, 'Invoice outsider');
  const draft = await c.resolve(reimbursementServiceToken).create(
    {
      reason: 'Invoice source',
      authorizationId: null,
      loanId: null,
      offsetCents: 0,
      overrunReason: '',
      lines: [
        {
          id: randomUUID(),
          category: 'other',
          date: '2026-10-25',
          amountCents: 100,
          invoiceNumber: 'FIXTURE',
          attachmentIds: [randomUUID()],
          standardExceptionReason: '',
        },
      ],
    },
    owner.userId,
  );
  const files = c
    .resolve(serverFileRepositoryManagerToken)
    .repository('reimbursementAttachmentFiles', {
      connection: 'main',
      disk: 'local',
      accessPath: '/uploads/reimbursement',
      policy: {
        read: true,
        create: {
          scope: { reimbursementId: draft.record.id, ownerId: owner.userId },
          defaults: {
            reimbursementId: draft.record.id,
            ownerId: owner.userId,
            uploadVersion: draft.record.lifecycleVersion,
          },
        },
        update: false,
        delete: false,
      },
    });
  const bytes = Buffer.from('%PDF-1.7 synthetic invoice source');
  const { record: file } = await files.uploadOne({
    file: new File([bytes], 'invoice.pdf', { type: 'application/pdf' }),
  });
  const source = c.resolve(reimbursementInvoiceSourceToken);
  const input = {
    recordId: draft.record.id,
    lineId: 'unsaved-local-line',
    fileId: file.id,
    actorId: owner.userId,
    policy: ALL,
    mode: 'recognize' as const,
  };
  expect(Buffer.from((await source.read(input)).bytes)).toEqual(bytes);
  expect((await source.read({ ...input, mode: 'read' })).fileHash).toMatch(
    /^[a-f0-9]{64}$/,
  );
  await expect(
    source.read({ ...input, actorId: outsider.userId }),
  ).rejects.toThrow();
  await expect(
    source.read({ ...input, fileId: randomUUID() }),
  ).rejects.toThrow();
  await expect(
    source.read({
      ...input,
      policy: {
        read: { scope: true, fields: ['id'] },
        create: false,
        update: false,
        delete: false,
      },
    }),
  ).rejects.toThrow();
  await expect(source.read({ ...input, mode: 'verify' })).rejects.toThrow();
});
