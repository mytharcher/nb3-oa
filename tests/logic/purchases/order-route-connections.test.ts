// @vitest-environment node
import { expect, it, vi } from 'vitest';
import type { MiddlewareHandler } from 'hono';
import type { Application } from '@nocobase/app-server/application';
import { databaseManagerToken, type DatabaseConnection } from '@nocobase/db';
import {
  authenticationToken,
  userAdministrationServiceToken,
} from '@nocobase/app-plugin-authentication';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { approvalDirectoryServiceToken } from '../../../server/providers/approval-directory/contract.js';
import { calendarServiceToken } from '../../../server/providers/platform/index.js';
import { purchaseOrderServiceToken } from '../../../server/providers/purchases/contract.js';
import routes from '../../../server/routes/purchases/orders.js';

async function fixture() {
  let inTransaction = false;
  const tx = {} as DatabaseConnection;
  const row = {
    id: 'order-1',
    purchaseId: 'purchase-1',
    number: 'PUR-001',
    applicantId: 'applicant',
    departmentId: 'engineering',
    items: [],
    actualCents: 10000,
    vendor: {},
    account: {},
    status: 'awaitingReceipt',
    version: 1,
    createdAt: new Date('2026-10-20T00:00:00Z'),
    acceptedAt: null,
    acceptedById: null,
    receiptDate: null,
    receiptReason: null,
  };
  const person = async (id: string) => ({ id, name: `Person ${id}` });
  const boundGet = vi.fn(async (id: string) => {
    expect(inTransaction).toBe(true);
    return person(id);
  });
  const users = {
    get: vi.fn(async (id: string) => {
      if (inTransaction)
        throw new Error('Unbound lookup would acquire another connection');
      return person(id);
    }),
    withConnection: vi.fn((connection: DatabaseConnection) => {
      expect(connection).toBe(tx);
      expect(inTransaction).toBe(true);
      return { get: boundGet };
    }),
  };
  const mutate = (status: string) =>
    vi.fn(
      async (_id: string, _input: unknown, connection: DatabaseConnection) => {
        expect(connection).toBe(tx);
        expect(inTransaction).toBe(true);
        return {
          ...row,
          status,
          acceptedById: status === 'accepted' ? 'receiver' : null,
        };
      },
    );
  const service = {
    accept: mutate('accepted'),
    cancel: mutate('cancelled'),
    list: vi.fn(async () => ({
      data: [row, { ...row, id: 'order-2' }],
      meta: { page: 1, pageSize: 20, total: 2 },
    })),
  };
  const authenticate: MiddlewareHandler = async (context, next) => {
    context.set('auth', { user: { id: 'applicant' } });
    await next();
  };
  const authorize: MiddlewareHandler = async (context, next) => {
    context.set('authz', {
      authorize: async () => ({
        effect: 'allow',
        conditions: {
          database: { purchaseOrders: { read: true, update: true } },
        },
      }),
    });
    await next();
  };
  const services = new Map<unknown, unknown>([
    [authenticationToken, { required: () => authenticate }],
    [authorizationToken, { middleware: () => authorize }],
    [userAdministrationServiceToken, users],
    [purchaseOrderServiceToken, service],
    [calendarServiceToken, { timeZone: () => 'Asia/Shanghai' }],
    [approvalDirectoryServiceToken, {}],
    [
      databaseManagerToken,
      {
        repository: () => ({
          withPolicy: () => ({ findOne: async () => row }),
        }),
        transaction: async (
          work: (connection: DatabaseConnection) => Promise<unknown>,
        ) => {
          expect(inTransaction).toBe(false);
          inTransaction = true;
          try {
            return await work(tx);
          } finally {
            inTransaction = false;
          }
        },
      },
    ],
  ]);
  const app = {
    container: { resolve: (token: unknown) => services.get(token) },
  } as unknown as Application;
  return { router: await routes.createRouter(app), users, boundGet, tx };
}

it.each(['accept', 'cancel'])(
  'reuses the %s transaction for response user lookups',
  async (action) => {
    const { router, users, boundGet, tx } = await fixture();
    const response = await router.request(`/purchaseOrders/order-1/${action}`, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        version: 1,
        reason: 'Verified goods',
        requestKey: 'receipt-request',
        ...(action === 'accept' ? { receiptDate: '2026-10-20' } : {}),
      }),
    });
    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.data.applicant).toEqual({
      id: 'applicant',
      name: 'Person applicant',
    });
    if (action === 'accept')
      expect(body.data.acceptedBy).toEqual({
        id: 'receiver',
        name: 'Person receiver',
      });
    expect(users.withConnection).toHaveBeenCalledWith(tx);
    expect(boundGet).toHaveBeenCalledWith('applicant');
    expect(users.get).not.toHaveBeenCalled();
  },
);

it('keeps list user lookups outside a transaction for every row', async () => {
  const { router, users, boundGet } = await fixture();
  const response = await router.request('/purchaseOrders?page=1&pageSize=20');
  expect(response.status).toBe(200);
  const body = await response.json();
  expect(body.data).toHaveLength(2);
  for (const row of body.data)
    expect(row.applicant.name).toBe('Person applicant');
  expect(users.get).toHaveBeenCalledTimes(2);
  expect(boundGet).not.toHaveBeenCalled();
});
