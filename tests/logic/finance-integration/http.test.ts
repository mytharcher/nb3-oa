// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { expect, vi } from 'vitest';
import { createAppTest } from '@nocobase/app-testing/server';
import { databaseManagerToken } from '@nocobase/db';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { createStandaloneServer } from '../../../server/standalone.js';
import { reimbursementServiceToken } from '../../../server/providers/reimbursement/index.js';
import { paymentRequestServiceToken } from '../../../server/providers/payment-requests/contract.js';
import type { PaymentRequestService } from '../../../server/providers/payment-requests/service.js';
import {
  OA_TEST_DATABASE_ENV,
  OA_TEST_SERVER,
  OA_TEST_ORIGIN,
} from '../oa-test-origin.js';
import {
  createEmployee,
  grantToUser,
  composite,
  ALL,
} from '../employees/helpers.js';
import { write } from '../platform/helpers.js';
vi.setConfig({ testTimeout: 120000 });
const test = createAppTest({
  createServer: createStandaloneServer,
  env: OA_TEST_DATABASE_ENV,
  server: OA_TEST_SERVER,
  config: {
    app: { publicOrigin: OA_TEST_ORIGIN },
    secrets: { keys: [{ version: 1, key: 'f'.repeat(64) }] },
    financeIntegration: {
      enabled: true,
      instanceId: 'oa-http-test',
      baseUrl: 'https://gateway.example/oa/',
      token: 'synthetic-gateway-secret',
    },
  },
});
test('independently authorizes finance status/send, sends owned paid facts and reconciles an uncertain result', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken);
  const applicant = await createEmployee(testApp, 'Finance HTTP applicant');
  const finance = await createEmployee(testApp, 'Finance HTTP finance');
  const outsider = await createEmployee(testApp, 'Finance HTTP outsider');
  const integrationGrant = {
    resource: { type: 'settings', id: 'oa.financeIntegration' },
    actions: [{ action: 'read' }, { action: 'send' }],
  };
  await grantToUser(
    testApp,
    'finance-integration-http',
    [
      integrationGrant,
      composite('oa.reimbursement', {
        view: { reimbursementRequests: 'allRecords' },
      }),
      composite('oa.payment', { view: { paymentRequests: 'allRecords' } }),
    ],
    finance.userId,
  );
  await grantToUser(
    testApp,
    'finance-integration-outsider',
    [integrationGrant],
    outsider.userId,
  );
  const reimbursements = c.resolve(reimbursementServiceToken);
  const payments = c.resolve(
    paymentRequestServiceToken,
  ) as PaymentRequestService;
  const reimbursement = await reimbursements.create(
    {
      reason: 'Accounting fixture',
      authorizationId: null,
      loanId: null,
      offsetCents: 0,
      overrunReason: '',
      lines: [
        {
          id: randomUUID(),
          category: 'other',
          date: '2026-10-25',
          amountCents: 500,
          invoiceNumber: 'SYNTHETIC-INV',
          attachmentIds: [randomUUID()],
          standardExceptionReason: '',
        },
      ],
    },
    applicant.userId,
  );
  const payment = await payments.create(
    {
      reason: 'Accounting payment fixture',
      sourceMode: 'none',
      purchaseOrderId: null,
      contractId: null,
      noPriorApprovalReason: 'Fixture for an approved payable',
      vendorId: null,
      amountCents: 700,
      invoiceNumber: '',
      attachments: [],
      paymentMethod: 'bankTransfer',
    },
    applicant.userId,
  );
  const session = await finance.session(),
    ownerSession = await applicant.session(),
    outsiderSession = await outsider.session();
  const url = `/financeIntegration/reimbursement/${reimbursement.record.id}`;
  expect((await testApp.request(url)).status).toBe(401);
  expect((await ownerSession.fetch(url)).status).toBe(403);
  expect((await session.fetch(url)).status).toBe(400); // not paid
  // Synthetic terminal fixtures isolate transport/auth; actual lifecycle exports are tested in the owner suites.
  await db
    .repository('reimbursementRequests')
    .updateOne({
      filter: { id: reimbursement.record.id },
      values: { status: 'paid', number: 'BX-HTTP' },
    });
  await db
    .repository('paymentRequests')
    .updateOne({
      filter: { id: payment.record.id },
      values: { status: 'paid', number: 'FK-HTTP' },
    });
  expect((await outsiderSession.fetch(url)).status).toBe(403);
  expect(
    (await outsiderSession.fetch(url + '/send', write('POST', {}))).status,
  ).toBe(403);
  expect(
    (await session.fetch(url + '/send', write('POST', { amountCents: 1 })))
      .status,
  ).toBe(400);
  expect((await (await session.fetch(url)).json()).data).toMatchObject({
    enabled: true,
    state: 'not_sent',
  });
  const originalFetch = globalThis.fetch;
  const wires: Record<string, unknown>[] = [];
  const remote = vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async (input, init) => {
      const target = String(input instanceof Request ? input.url : input);
      if (!target.startsWith('https://gateway.example/oa/'))
        return originalFetch(input, init);
      if (init?.method === 'POST') {
        wires.push(JSON.parse(String(init.body)) as Record<string, unknown>);
        throw new Error('Synthetic lost response');
      }
      const wire = wires.at(-1)!;
      return Response.json({
        idempotencyKey: wire.idempotencyKey,
        payloadHash: wire.payloadHash,
        state: 'posted',
        externalId: 'ERP-HTTP',
        voucherNumber: 'V-HTTP',
      });
    });
  try {
    const sent = await session.fetch(url + '/send', write('POST', {}));
    expect(sent.status).toBe(200);
    expect((await sent.json()).data.state).toBe('unknown');
    expect(wires[0]).toMatchObject({
      amountCents: 500,
      paidCents: 500,
      currency: 'CNY',
      source: {
        id: reimbursement.record.id,
        number: 'BX-HTTP',
        kind: 'reimbursement',
      },
    });
    expect(JSON.stringify(wires[0])).not.toMatch(
      /bankAccount|attachmentIds|synthetic-gateway-secret/,
    );
    const checked = await session.fetch(url + '/refresh', write('POST', {}));
    expect(checked.status).toBe(200);
    const status = (await checked.json()).data;
    expect(status).toMatchObject({ state: 'posted', voucherNumber: 'V-HTTP' });
    expect(status).not.toHaveProperty('payload');
    expect(status).not.toHaveProperty('destination');
    await session.fetch(url + '/send', write('POST', {}));
    expect(wires).toHaveLength(1);
    const paymentUrl = `/financeIntegration/payment/${payment.record.id}`;
    expect(
      (await session.fetch(paymentUrl + '/send', write('POST', {}))).status,
    ).toBe(200);
    expect(wires[1]).toMatchObject({
      amountCents: 700,
      paidCents: 700,
      offsetCents: 0,
      lines: [],
      source: { kind: 'payment' },
    });
    // Hide financial fields while retaining record visibility: no status or outgoing facts may escape.
    const authz = c.resolve(authorizationToken),
      originalFor = authz.for.bind(authz);
    const restricted = vi
      .spyOn(authz, 'for')
      .mockImplementation((subject, context) => {
        const request = originalFor(subject, context),
          originalAuthorize = request.authorize.bind(request);
        request.authorize = async (input) => {
          const decision = await originalAuthorize(input);
          return input.resource.id === 'oa.reimbursement'
            ? {
                ...decision,
                conditions: {
                  ...decision.conditions,
                  database: {
                    reimbursementRequests: {
                      ...ALL,
                      read: { fields: ['id'], scope: true },
                    },
                  },
                },
              }
            : decision;
        };
        return request;
      });
    try {
      expect((await session.fetch(url)).status).toBe(403);
      expect(
        (await session.fetch(url + '/send', write('POST', {}))).status,
      ).toBe(403);
    } finally {
      restricted.mockRestore();
    }
  } finally {
    remote.mockRestore();
  }
});
