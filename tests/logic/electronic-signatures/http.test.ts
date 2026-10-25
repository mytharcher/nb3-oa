import { auditServiceToken } from '../../../server/providers/audit/index.js';
import { sealSignatureSourceToken } from '../../../server/providers/electronic-signatures/contract.js';
// @vitest-environment node
import { expect, vi } from 'vitest';
import { createAppTest } from '@nocobase/app-testing/server';
import { databaseManagerToken } from '@nocobase/db';
import { createStandaloneServer } from '../../../server/standalone.js';
import {
  OA_TEST_DATABASE_ENV,
  OA_TEST_SERVER,
  OA_TEST_ORIGIN,
} from '../oa-test-origin.js';
import { write } from '../platform/helpers.js';
import {
  electronicSealScenario,
  electronicContractScenario,
  signedPdf,
} from './scenarios.js';
import { digest } from '../../../server/providers/electronic-signatures/gateway.js';
vi.setConfig({ testTimeout: 120000 });
const test = createAppTest({
  createServer: createStandaloneServer,
  env: OA_TEST_DATABASE_ENV,
  server: OA_TEST_SERVER,
  config: {
    app: { publicOrigin: OA_TEST_ORIGIN },
    secrets: { keys: [{ version: 1, key: 'g'.repeat(64) }] },
    electronicSignatures: {
      enabled: true,
      instanceId: 'signature-test',
      baseUrl: 'https://sign.example.test/',
      token: 'synthetic',
    },
  },
});
test('real electronic seal approval closes only after verified archive; replay, recovery, guards and bytes', async ({
  testApp,
  request,
}) => {
  const s = await electronicSealScenario(testApp),
    session = await s.keeper.session(),
    outside = await s.stranger.session(),
    url = `/electronicSignatures/seal/${s.id}`,
    db = testApp.application.container.resolve(databaseManagerToken);
  expect((await request(url)).status).toBe(401);
  expect((await outside.fetch(url)).status).toBe(403);
  expect(
    (await s.service.detail(s.id, s.keeper.userId, s.access.requests)).record,
  ).toMatchObject({
    executionMode: 'electronic',
    status: 'stamping',
    copies: 0,
  });
  await expect(
    s.service.perform(
      s.id,
      s.keeper.userId,
      {
        action: 'electronicComplete',
        target: { taskId: 'forged' },
        input: { sealedAt: new Date().toISOString() },
        requestId: 'forged',
      },
      s.access,
    ),
  ).rejects.toThrow('SIGNATURE_EVIDENCE_REQUIRED');
  const adapter = testApp.application.container.resolve(
      sealSignatureSourceToken,
    ),
    finalize = adapter.finalize.bind(adapter);
  await expect(
    db.transaction((tx) =>
      adapter.source(
        s.id,
        s.keeper.userId,
        {
          view: {
            read: { scope: true, fields: ['id', 'number'] },
            create: false,
            update: false,
            delete: false,
          },
        },
        tx,
        false,
      ),
    ),
  ).rejects.toBeDefined();
  await expect(
    db.transaction((tx) =>
      adapter.source(
        s.id,
        s.stranger.userId,
        { view: s.access.view, operate: s.access.requests },
        tx,
        true,
      ),
    ),
  ).rejects.toThrow('SIGNATURE_ACCESS_DENIED');
  let finalizeError: unknown;
  const finishSpy = vi
    .spyOn(adapter, 'finalize')
    .mockImplementation(async (...args) => {
      try {
        return await finalize(...args);
      } catch (error) {
        finalizeError = error;
        throw error;
      }
    });
  let envelope: any,
    posts = 0,
    downloadValid = false;
  const actualFetch = globalThis.fetch;
  const spy = vi
    .spyOn(globalThis, 'fetch')
    .mockImplementation(async (input, init) => {
      if (!String(input).startsWith('https://sign.example.test/'))
        return actualFetch(input, init);
      if (String(input).endsWith('/document'))
        return new Response(
          downloadValid ? signedPdf : Buffer.from('incorrect'),
          { headers: { 'content-type': 'application/pdf' } },
        );
      if (init?.method === 'POST') {
        posts++;
        envelope = JSON.parse(String(init.body));
      }
      return Response.json({
        idempotencyKey: envelope.idempotencyKey,
        payloadHash: envelope.payloadHash,
        state: 'signed',
        externalId: 'verified-envelope',
        signedAt: new Date(Date.now() - 1000).toISOString(),
        signedDocumentSha256: digest(signedPdf),
        verification: 'verified',
      });
    });
  try {
    const first = await session.fetch(url + '/send', write('POST', {}));
    expect(first.status).toBe(200);
    expect((await first.json()).data.state).toBe('archivePending');
    expect(
      (await s.service.detail(s.id, s.keeper.userId, s.access.requests)).record
        .status,
    ).toBe('stamping');
    expect(await db.repository('signatureArchiveFiles').count()).toBe(0);
    downloadValid = true;
    const audit = testApp.application.container.resolve(auditServiceToken),
      originalAudit = audit.record.bind(audit);
    const auditFailure = vi
      .spyOn(audit, 'record')
      .mockImplementation(async (entry, tx) => {
        if (entry.action === 'electronicSignature.archived')
          throw new Error('synthetic archive audit failure');
        return originalAudit(entry, tx);
      });
    try {
      const failed = await session.fetch(url + '/refresh', write('POST', {}));
      expect((await failed.json()).data.state).toBe('archivePending');
      expect(
        (await s.service.detail(s.id, s.keeper.userId, s.access.requests))
          .record.status,
      ).toBe('stamping');
      expect(await db.repository('electronicSealLedger').count()).toBe(0);
      expect(await db.repository('signatureArchiveFiles').count()).toBe(0);
    } finally {
      auditFailure.mockRestore();
    }
    const second = await session.fetch(url + '/refresh', write('POST', {}));
    expect(second.status).toBe(200);
    const body = await second.json();
    if (body.data.state !== 'archived' && finalizeError) throw finalizeError;
    expect(body.data.state).toBe('archived');
    expect(posts).toBe(1);
    const complete = (
      await s.service.detail(s.id, s.keeper.userId, s.access.requests)
    ).record;
    expect(complete).toMatchObject({
      status: 'completed',
      sealId: null,
      actualCopies: null,
      ledgerId: null,
    });
    expect(complete.electronicEvidenceId).toBeTruthy();
    expect(await db.repository('electronicSealLedger').count()).toBe(1);
    expect(await db.repository('sealLedger').count()).toBe(0);
    const download = await session.fetch(url + '/download');
    expect(download.status).toBe(200);
    expect(Buffer.from(await download.arrayBuffer())).toEqual(signedPdf);
    expect((await outside.fetch(url + '/download')).status).toBe(403);
    expect((await session.fetch(url + '/send', write('POST', {}))).status).toBe(
      200,
    );
    expect(posts).toBe(1);
    expect(await db.repository('signatureArchiveFiles').count()).toBe(1);
  } finally {
    spy.mockRestore();
    finishSpy.mockRestore();
  }
});

test('approved current contract PDF signs, archives and activates exactly its published version', async ({
  testApp,
}) => {
  const s = await electronicContractScenario(testApp),
    session = await s.legal.session(),
    url = `/electronicSignatures/contract/${s.id}`,
    db = testApp.application.container.resolve(databaseManagerToken);
  let payload: any,
    posts = 0;
  const actualFetch = globalThis.fetch,
    spy = vi
      .spyOn(globalThis, 'fetch')
      .mockImplementation(async (input, init) => {
        if (!String(input).startsWith('https://sign.example.test/'))
          return actualFetch(input, init);
        if (String(input).endsWith('/document'))
          return new Response(signedPdf, {
            headers: { 'content-type': 'application/pdf' },
          });
        if (init?.method === 'POST') {
          posts++;
          payload = JSON.parse(String(init.body));
        }
        return Response.json({
          idempotencyKey: payload.idempotencyKey,
          payloadHash: payload.payloadHash,
          state: 'signed',
          externalId: 'verified-contract',
          signedAt: new Date(Date.now() - 1000).toISOString(),
          signedDocumentSha256: digest(signedPdf),
          verification: 'verified',
        });
      });
  try {
    const response = await session.fetch(url + '/send', write('POST', {}));
    expect(response.status).toBe(200);
    expect((await response.json()).data.state).toBe('archived');
    expect(
      await db
        .repository('contracts')
        .findOne({ filter: { id: s.contractId } }),
    ).toMatchObject({ status: 'active', version: 1 });
    expect(posts).toBe(1);
    expect((await session.fetch(url + '/download')).status).toBe(200);
  } finally {
    spy.mockRestore();
  }
});
