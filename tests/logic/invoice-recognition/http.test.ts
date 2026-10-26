import { createAppTest } from '@nocobase/app-testing/server';
import { createStandaloneServer } from '../../../server/standalone.js';
import { databaseManagerToken } from '@nocobase/db';
import {
  OA_TEST_DATABASE_ENV,
  OA_TEST_ORIGIN,
  OA_TEST_SERVER,
} from '../oa-test-origin.js';
import { write } from '../platform/helpers.js';
// @vitest-environment node
vi.mock('../../../shared/external-integrations.js', () => ({
  externalIntegrationsEnabled: true,
}));
import { randomUUID } from 'node:crypto';
import { expect, vi } from 'vitest';
import { serverFileRepositoryManagerToken } from '@nocobase/app-plugin-file/server';
import {
  createEmployee,
  ALL,
  grantToUser,
  composite,
} from '../employees/helpers.js';
import { reimbursementServiceToken } from '../../../server/providers/reimbursement/index.js';
import { reimbursementInvoiceSourceToken } from '../../../server/providers/reimbursement/invoice-source.js';
vi.setConfig({ testTimeout: 120000 });
const test = createAppTest({
  createServer: createStandaloneServer,
  env: OA_TEST_DATABASE_ENV,
  server: OA_TEST_SERVER,
  config: {
    app: { publicOrigin: OA_TEST_ORIGIN },
    secrets: { keys: [{ version: 1, key: 'i'.repeat(64) }] },
    invoiceRecognition: {
      enabled: true,
      instanceId: 'fixture',
      baseUrl: 'https://invoice.example/oa/',
      token: 'synthetic',
    },
  },
});
test('invoice endpoints independently authorize, refuse client facts and persist current source verification', async ({
  testApp,
}) => {
  const c = testApp.application.container;
  const owner = await createEmployee(testApp, 'Invoice owner'),
    outsider = await createEmployee(testApp, 'Invoice outsider');
  const viewer = await createEmployee(testApp, 'Invoice authorized reader');
  await grantToUser(
    testApp,
    randomUUID(),
    [
      composite('oa.reimbursement', {
        view: { reimbursementRequests: 'allRecords' },
      }),
    ],
    viewer.userId,
  );
  const viewerSession = await viewer.session();
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
  const session = await owner.session(),
    foreign = await outsider.session();
  const line = draft.record.lines[0];
  await c
    .resolve(databaseManagerToken)
    .repository('reimbursementRequests')
    .updateOne({
      filter: { id: draft.record.id },
      values: { lines: [{ ...line, attachmentIds: [file.id] }] },
    });
  const url = `/invoiceRecognition/${draft.record.id}/${line.id}/${file.id}`;
  expect((await testApp.request(url + '/verify')).status).toBe(401);
  expect((await foreign.fetch(url + '/verify', write('POST', {}))).status).toBe(
    403,
  );
  expect(
    (await session.fetch(url + '/verify', write('POST', { amountCents: 1 })))
      .status,
  ).toBe(400);
  const originalFetch = globalThis.fetch;
  let calls = 0;
  const remote = vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async (input, init) => {
      if (!String(input).startsWith('https://invoice.example/oa/'))
        return originalFetch(input, init);
      calls++;
      const envelope = JSON.parse(String(init?.body));
      expect(envelope.facts?.amountCents ?? 100).toBe(100);
      return Response.json({
        operationKey: envelope.operationKey,
        contentHash: envelope.contentHash,
        ...(envelope.operation === 'recognize'
          ? {
              state: 'recognized',
              facts: {
                number: 'OCR-100',
                date: '2026-10-25',
                amountCents: 100,
              },
            }
          : {
              state: 'valid',
              reference: 'CHECK-1',
              checkedAt: new Date().toISOString(),
            }),
      });
    });
  try {
    const recognized = await session.fetch(
      url + '/recognize',
      write('POST', {}),
    );
    expect(recognized.status).toBe(200);
    expect((await recognized.json()).data.result.facts.number).toBe('OCR-100');
    const verified = await session.fetch(url + '/verify', write('POST', {}));
    expect(verified.status).toBe(200);
    expect((await verified.json()).data.state).toBe('valid');
    expect(
      (await (await session.fetch(url + '/verify')).json()).data.state,
    ).toBe('valid');
    expect(
      (await (await viewerSession.fetch(url + '/verify')).json()).data.state,
    ).toBe('valid');
    expect(
      (await viewerSession.fetch(url + '/verify', write('POST', {}))).status,
    ).toBe(403);
    expect(
      (await (await viewerSession.fetch(url + '/recognize')).json()).data.state,
    ).toBe('not_checked');
    expect(calls).toBe(2);
    await c
      .resolve(databaseManagerToken)
      .repository('reimbursementRequests')
      .updateOne({
        filter: { id: draft.record.id },
        values: {
          lines: [
            { ...line, invoiceNumber: 'CHANGED', attachmentIds: [file.id] },
          ],
        },
      });
    expect(
      (await (await session.fetch(url + '/verify')).json()).data.state,
    ).toBe('not_checked');
  } finally {
    remote.mockRestore();
  }
});
