// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { zipSync, strToU8, unzipSync, strFromU8 } from 'fflate';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import { printSourceRegistryToken } from '../../../server/providers/template-print/contract.js';
import { OA_TEST_ORIGIN } from '../oa-test-origin.js';
import { OPEN } from '@nocobase/app-plugin-approval/server';
import { expect, vi } from 'vitest';
import {
  DEFAULT_ADMIN_CREDENTIALS,
  signIn,
} from '@nocobase/app-plugin-authentication/testing';
import {
  departureCustodyClearanceToken,
  departureApprovalReassignmentToken,
} from '../../../server/providers/departure/contract.js';
import { databaseManagerToken } from '@nocobase/db';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import {
  contractLedgerServiceToken,
  type ContractFacts,
} from '../../../server/providers/contracts/contract.js';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
import {
  sealRequestServiceToken,
  sealServiceToken,
  SEAL_KIND,
  SEAL_PRINT_RECEIPT_FIELDS,
  SEAL_PRINT_REQUEST_FIELDS,
} from '../../../server/providers/seals/contract.js';
import {
  createEmployee,
  employees,
  ALL,
  grantToUser,
  composite,
} from '../employees/helpers.js';
import { test } from './helpers.js';
test('real SDK approval, keeper claim and actual use register an immutable receipt and activate exact contract with same-TX audit rollback', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    org = c.resolve(organizationServiceToken),
    service = c.resolve(sealRequestServiceToken),
    seals = c.resolve(sealServiceToken),
    contracts = c.resolve(contractLedgerServiceToken),
    audit = c.resolve(auditServiceToken);
  const owner = await createEmployee(testApp, 'Seal owner'),
    head = await createEmployee(testApp, 'Seal head'),
    legal = await createEmployee(testApp, 'Seal legal'),
    keeper = await createEmployee(testApp, 'Seal keeper');
  const department = await org.createDepartment(
    { title: 'Seal department', managerId: head.userId },
    { actorId: head.userId },
  );
  await org.addMember(
    { departmentId: department.id, userId: owner.userId, primary: true },
    { actorId: head.userId },
  );
  await org.addDutyRoleMember('legal', legal.userId, { actorId: head.userId });
  await org.addDutyRoleMember('sealKeeper', keeper.userId, {
    actorId: head.userId,
  });
  await org.addDutyRoleMember('admin', keeper.userId, { actorId: head.userId });
  const contractId = randomUUID(),
    requestId = randomUUID(),
    facts: ContractFacts = {
      contractType: 'sale',
      counterparty: { kind: 'customer', name: 'Actual party' },
      startsOn: '2026-10-01',
      endsOn: '2027-10-01',
      paymentTerms: 'net30',
      standardTemplate: true,
      textVersionId: randomUUID(),
      attachments: [],
    };
  const command = () => ({
    actorId: owner.userId,
    requestKey: randomUUID(),
    reason: 'Actual contract fixture',
  });
  await db.transaction((tx) =>
    contracts.createCandidate(
      {
        ...command(),
        id: contractId,
        requestId,
        applicantId: owner.userId,
        departmentId: department.id,
        amountCents: 98765,
        facts,
      },
      tx,
    ),
  );
  await db.transaction((tx) =>
    contracts.publish(
      {
        ...command(),
        contractId,
        requestId,
        baseVersion: 0,
        number: 'SEAL-REAL-1',
        amountCents: 98765,
        facts,
      },
      tx,
    ),
  );

  const seal = await db.transaction((tx) =>
    seals.saveInstance(
      {
        actorId: keeper.userId,
        requestKey: randomUUID(),
        code: 'ACTUAL-1',
        name: 'Actual official seal',
        sealType: 'official',
        active: true,
        reason: 'Physical receipt',
      },
      tx,
      ALL,
    ),
  );
  const access = { requests: ALL, view: ALL, contract: ALL };

  const record = await service.create(
    owner.userId,
    {
      contractId,
      fileIds: [],
      sealType: 'official',
      copies: 3,
      external: false,
      returnDueAt: null,
      purpose: 'Real approved contract stamping',
      contact: 'Protected contact',
    },
    'create-real',
    access,
  );
  expect(
    (
      await service.create(
        owner.userId,
        {
          contractId,
          fileIds: [],
          sealType: 'official',
          copies: 3,
          external: false,
          returnDueAt: null,
          purpose: 'Real approved contract stamping',
          contact: 'Protected contact',
        },
        'create-real',
        access,
      )
    ).id,
  ).toBe(record.id);

  await service.change(
    record.id,
    owner.userId,
    'submit',
    {},
    'submit-real',
    record.lifecycleVersion,
    access,
  );
  async function perform(
    actorId: string,
    name: string,
    key: string,
    input?: Record<string, string | number | null>,
    targetId = record.id,
  ) {
    const offers = await service.approvals.actionsFor(SEAL_KIND, targetId, {
      id: actorId,
    });
    const task = offers.find((offer) =>
      offer.actions.some((a) => a.name === name),
    )?.task;
    expect(task, `${name} offered to ${actorId}`).toBeTruthy();
    const view = (await service.approvals.runViewsFor(SEAL_KIND, targetId)).at(
      -1,
    )!;
    return service.perform(
      targetId,
      actorId,
      {
        action: name,
        target: { taskId: task!.id },
        requestId: key,
        contentHash: view.run.contentHash,
        input,
      },
      access,
    );
  }

  await perform(head.userId, 'approve', 'head-approve');

  const legalOffer = (
    await service.approvals.actionsFor(SEAL_KIND, record.id, {
      id: legal.userId,
    })
  ).find((o) => o.actions.some((a) => a.name === 'approve'))!.task;
  const legalView = (
    await service.approvals.runViewsFor(SEAL_KIND, record.id)
  ).at(-1)!;
  await org.removeDutyRoleMember('legal', legal.userId, {
    actorId: head.userId,
  });
  await expect(
    service.perform(
      record.id,
      legal.userId,
      {
        action: 'approve',
        target: { taskId: legalOffer.id },
        requestId: 'revoked-legal-approve',
        contentHash: legalView.run.contentHash,
      },
      access,
    ),
  ).rejects.toMatchObject({ code: 'REVIEWER_REQUIRED' });
  await org.addDutyRoleMember('legal', legal.userId, { actorId: head.userId });
  await perform(legal.userId, 'approve', 'legal-approve');
  expect(
    (await service.detail(record.id, owner.userId, ALL)).record.status,
  ).toBe('stamping');
  await perform(keeper.userId, 'claim', 'keeper-claim');
  const sealedAt = new Date(Date.now() - 5000).toISOString(),
    output = {
      sealId: seal.id,
      actualCopies: 3,
      sealedAt,
      borrowedAt: null,
      returnedAt: null,
    };
  const original = audit.record.bind(audit);
  const spy = vi
    .spyOn(audit, 'record')
    .mockImplementation(async (entry, tx) => {
      if (entry.action === 'contract.sealed')
        throw new Error('Seal audit failure');
      return original(entry, tx);
    });
  await expect(
    perform(keeper.userId, 'complete', 'actual-complete', output),
  ).rejects.toThrow('Seal audit failure');
  spy.mockRestore();
  expect(await db.repository('sealLedger').count()).toBe(0);
  expect(
    (await db.transaction((tx) => contracts.source(contractId, tx)))?.status,
  ).toBe('activePendingSeal');
  expect(
    (await service.detail(record.id, owner.userId, ALL)).record.status,
  ).toBe('stamping');
  const duplicateOffers = await service.approvals.actionsFor(
      SEAL_KIND,
      record.id,
      { id: keeper.userId },
    ),
    duplicateTask = duplicateOffers.find((o) =>
      o.actions.some((a) => a.name === 'complete'),
    )!.task;
  const duplicateView = (
    await service.approvals.runViewsFor(SEAL_KIND, record.id)
  ).at(-1)!;
  const completionInput = {
    action: 'complete',
    target: { taskId: duplicateTask.id },
    requestId: 'actual-complete',
    contentHash: duplicateView.run.contentHash,
    input: output,
  };
  const concurrent = await Promise.all([
    service.perform(record.id, keeper.userId, completionInput, access),
    service.perform(record.id, keeper.userId, completionInput, access),
  ]);
  expect(concurrent[0].actionId).toBe(concurrent[1].actionId);
  await expect(
    service.perform(
      record.id,
      keeper.userId,
      { ...completionInput, input: { ...output, actualCopies: 2 } },
      access,
    ),
  ).rejects.toMatchObject({ code: 'COMMAND_CONFLICT' });
  await expect(
    service.perform(record.id, keeper.userId, completionInput, {
      ...access,
      requests: { ...ALL, update: false },
    }),
  ).rejects.toMatchObject({ code: 'ACCESS_DENIED' });
  await org.removeDutyRoleMember('sealKeeper', keeper.userId, {
    actorId: head.userId,
  });
  await expect(
    service.perform(record.id, keeper.userId, completionInput, access),
  ).rejects.toMatchObject({ code: 'KEEPER_REQUIRED' });
  await org.addDutyRoleMember('sealKeeper', keeper.userId, {
    actorId: head.userId,
  });

  const completed = (await service.detail(record.id, owner.userId, ALL)).record;
  expect(completed.status).toBe('completed');
  const printAccess = { ledger: ALL, receipts: ALL, requests: ALL };
  const stamped = await db.transaction((tx) =>
    seals.printRegistration(
      completed.ledgerId!,
      keeper.userId,
      tx,
      printAccess,
    ),
  );
  expect(stamped).toMatchObject({
    number: completed.number,
    actualCopies: 3,
    approvedCopies: 3,
    external: false,
    borrowedAt: null,
    returnedAt: null,
    seal: { id: seal.id, type: 'official' },
    applicant: { id: owner.userId, name: 'Seal owner' },
    department: { id: department.id, name: 'Seal department' },
  });
  expect(Object.keys(stamped).sort()).toEqual(
    [
      'number',
      'applicant',
      'department',
      'seal',
      'approvedCopies',
      'actualCopies',
      'external',
      'borrowedAt',
      'sealedAt',
      'returnedAt',
      'registeredAt',
      'registeredBy',
      'confirmedBy',
    ].sort(),
  );
  await expect(
    db.transaction((tx) =>
      seals.printRegistration(completed.ledgerId!, keeper.userId, tx, {
        ...printAccess,
        requests: { ...ALL, read: { scope: true, fields: ['id', 'status'] } },
      }),
    ),
  ).rejects.toMatchObject({ code: 'ACCESS_DENIED' });
  await expect(
    db.transaction((tx) =>
      seals.printRegistration(completed.ledgerId!, keeper.userId, tx, {
        ...printAccess,
        ledger: {
          ...ALL,
          read: false,
        },
      }),
    ),
  ).rejects.toMatchObject({ code: 'ACCESS_DENIED' });
  const printGrants = [
    composite('oa.templatePrint', {
      use: {
        printTemplates: 'allRecords',
        printTemplateRevisions: 'allRecords',
      },
      printSealRegistration: {
        printTemplates: 'allRecords',
        printTemplateRevisions: 'allRecords',
        sealLedger: 'allRecords',
        sealReceipts: 'allRecords',
        sealRequests: 'allRecords',
      },
    }),
    composite('oa.sealLedger', {
      view: { sealLedger: 'allRecords', sealReceipts: 'allRecords' },
    }),
  ];
  await grantToUser(
    testApp,
    'seal-proof-print-test',
    printGrants,
    keeper.userId,
  );
  const printSource = c
    .resolve(printSourceRegistryToken)
    .get('sealRegistration')!;
  expect(printSource.collection).toBe('sealLedger');
  expect(
    await printSource.load({
      recordId: completed.ledgerId!,
      actorId: keeper.userId,
      policy: ALL,
      paths: ['number', 'sealedAt', 'actualCopies'],
      locale: 'en-US',
      timeZone: 'Asia/Singapore',
    }),
  ).toMatchObject({ number: completed.number, actualCopies: 3 });
  const keeperSession = await keeper.session(),
    headers = { origin: OA_TEST_ORIGIN, 'content-type': 'application/json' };
  const templateResponse = await keeperSession.fetch('/printTemplates', {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: 'Actual seal registration',
      source: 'sealRegistration',
      requestKey: 'create-real-seal-template',
    }),
  });
  expect(templateResponse.status).toBe(201);
  const templateId = (await templateResponse.json()).data.record.id as string;
  const template = zipSync({
    '[Content_Types].xml': strToU8(
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
    ),
    '_rels/.rels': strToU8(
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    ),
    'word/document.xml': strToU8(
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>{d.number} / {d.actualCopies} / {d.sealedAt}</w:t></w:r></w:p></w:body></w:document>',
    ),
  });
  const upload = new FormData();
  upload.append(
    'file',
    new File([template], 'seal-registration.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }),
  );
  upload.append('version', '1');
  upload.append('requestKey', 'real-seal-revision');
  const revisionResponse = await keeperSession.fetch(
    `/printTemplates/${templateId}/revisions`,
    { method: 'POST', headers: { origin: OA_TEST_ORIGIN }, body: upload },
  );
  expect(revisionResponse.status).toBe(200);
  const revisionId = (await revisionResponse.json()).data.revision.id as string,
    renderBody = { recordId: completed.ledgerId!, revisionId, locale: 'en-US' },
    render = () =>
      keeperSession.fetch(`/printTemplates/${templateId}/render`, {
        method: 'POST',
        headers,
        body: JSON.stringify(renderBody),
      });
  // A dedicated non-candidate reader isolates these grants from keeper/admin defaults.
  const authz = c.resolve(authorizationToken);
  const printReader = await createEmployee(testApp, 'Seal print reader');
  const printReaderSession = await printReader.session();
  const requestView = composite('oa.sealRequests', {
    view: { sealRequests: 'allRecords' },
  });
  const readerGrants = [...printGrants, requestView];
  const defaultPrint = (await authz.permissionSets.get('oa-document-print'))!;
  await authz.permissionSets.update('oa-document-print', {
    key: 'oa-document-print',
    grants: [],
  });
  await grantToUser(
    testApp,
    'seal-independent-print-reader',
    readerGrants,
    printReader.userId,
  );
  const readerRender = () =>
    printReaderSession.fetch(`/printTemplates/${templateId}/render`, {
      method: 'POST',
      headers,
      body: JSON.stringify(renderBody),
    });
  expect((await readerRender()).status).toBe(200);
  const useOnly = composite('oa.templatePrint', {
    use: {
      printTemplates: 'allRecords',
      printTemplateRevisions: 'allRecords',
    },
  });
  for (const grants of [
    [useOnly, printGrants[1]!, requestView],
    [printGrants[0]!, requestView],
    [printGrants[0]!, printGrants[1]!],
    [
      composite('oa.templatePrint', {
        printSealRegistration: {
          printTemplates: 'allRecords',
          printTemplateRevisions: 'allRecords',
          sealLedger: 'allRecords',
          sealReceipts: 'allRecords',
          sealRequests: 'allRecords',
        },
      }),
      printGrants[1]!,
      requestView,
    ],
  ]) {
    await authz.permissionSets.update('seal-independent-print-reader', {
      key: 'seal-independent-print-reader',
      grants,
    });
    expect((await readerRender()).status).toBe(403);
  }
  await authz.permissionSets.update('seal-independent-print-reader', {
    key: 'seal-independent-print-reader',
    grants: readerGrants,
  });
  expect((await readerRender()).status).toBe(200);
  await authz.permissionSets.update('oa-document-print', {
    key: 'oa-document-print',
    grants: defaultPrint.grants,
  });
  await expect(
    printSource.load({
      recordId: completed.ledgerId!,
      actorId: keeper.userId,
      policy: ALL,
      paths: ['request.ruleSnapshot'],
      locale: 'en-US',
      timeZone: 'Asia/Singapore',
    }),
  ).rejects.toMatchObject({ code: 'PRINT_FIELDS_DENIED' });
  await expect(
    printSource.load({
      recordId: completed.ledgerId!,
      actorId: keeper.userId,
      policy: { ...ALL, read: false },
      paths: ['number'],
      locale: 'en-US',
      timeZone: 'Asia/Singapore',
    }),
  ).rejects.toMatchObject({ code: 'PRINT_RECORD_DENIED' });
  const rendered = await render();
  expect(rendered.status).toBe(200);
  expect(rendered.headers.get('cache-control')).toBe('private, no-store');
  const printedZip = unzipSync(new Uint8Array(await rendered.arrayBuffer()));
  expect(strFromU8(printedZip['word/document.xml']!)).toContain(
    completed.number!,
  );
  await c
    .resolve(authorizationToken)
    .permissionSets.update('seal-proof-print-test', {
      key: 'seal-proof-print-test',
      grants: [],
    });
  // The shipped default now grants this source too: revoke every inherited print source,
  // rather than assuming removing one special grant removes effective access.
  await authz.permissionSets.update(defaultPrint.key, {
    ...defaultPrint,
    grants: defaultPrint.grants.map((g) => ({
      ...g,
      actions: g.actions.filter((a) => a.action !== 'printSealRegistration'),
    })),
  });
  expect((await render()).status).toBe(403);
  await expect(
    printSource.load({
      recordId: completed.ledgerId!,
      actorId: keeper.userId,
      policy: ALL,
      paths: ['number'],
      locale: 'en-US',
      timeZone: 'Asia/Singapore',
    }),
  ).rejects.toMatchObject({ code: 'PRINT_RECORD_DENIED' });
  await c
    .resolve(authorizationToken)
    .permissionSets.update('seal-proof-print-test', {
      key: 'seal-proof-print-test',
      grants: printGrants,
    });
  await authz.permissionSets.update(defaultPrint.key, defaultPrint);
  expect(await db.repository('sealLedger').count()).toBe(1);
  expect(await db.repository('contractSealLinks').count()).toBe(1);
  expect(
    await db.transaction((tx) => contracts.source(contractId, tx)),
  ).toMatchObject({ status: 'active', version: 1, amountCents: 98765 });
  await expect(
    service.change(
      record.id,
      owner.userId,
      'withdraw',
      {},
      'withdraw-real',
      completed.lifecycleVersion,
      access,
    ),
  ).rejects.toBeDefined();
  await expect(
    service.detail(record.id, owner.userId, {
      ...ALL,
      read: { scope: true, fields: ['id', 'status'] },
    }),
  ).rejects.toMatchObject({ code: 'ACCESS_DENIED' });
  await org.addDutyRoleMember('gm', head.userId, { actorId: head.userId });
  const external = await service.create(
    owner.userId,
    {
      contractId,
      fileIds: [],
      sealType: 'official',
      copies: 2,
      external: true,
      returnDueAt: new Date(Date.now() + 86400_000).toISOString(),
      purpose: 'Approved external seal checkout',
      contact: '',
    },
    'external-create',
    access,
  );
  await service.change(
    external.id,
    owner.userId,
    'submit',
    {},
    'external-submit',
    external.lifecycleVersion,
    access,
  );
  await perform(
    head.userId,
    'approve',
    'external-head',
    undefined,
    external.id,
  );
  await perform(
    legal.userId,
    'approve',
    'external-legal',
    undefined,
    external.id,
  );
  await perform(head.userId, 'approve', 'external-gm', undefined, external.id);
  await perform(
    keeper.userId,
    'claim',
    'external-claim',
    undefined,
    external.id,
  );
  const borrowedAt = new Date(Date.now() - 10_000).toISOString();
  await perform(
    keeper.userId,
    'complete',
    'external-checkout',
    {
      sealId: seal.id,
      borrowedAt,
      sealedAt: null,
      actualCopies: null,
      returnedAt: null,
    },
    external.id,
  );
  const borrowed = (await service.detail(external.id, owner.userId, ALL))
    .record;
  expect(borrowed.status).toBe('returning');
  const custody = c.resolve(departureCustodyClearanceToken);
  await expect(
    db.transaction((tx) => custody.assertCleared(owner.employeeId, tx)),
  ).rejects.toThrow('SEAL_CUSTODY_OUTSTANDING');
  const borrowedDetail = await db.transaction((tx) =>
    seals.ledgerDetail(borrowed.ledgerId!, owner.userId, tx, printAccess),
  );
  expect(borrowedDetail).toMatchObject({
    printable: false,
    receipt: null,
    request: { status: 'returning' },
    record: { applicant: { name: 'Seal owner' } },
  });
  const page = await db.transaction((tx) =>
    seals.ledgerPage(owner.userId, tx, printAccess, { page: 1, pageSize: 10 }),
  );
  expect(page.meta.total).toBe(2);
  expect(page.data).toHaveLength(2);
  const nextPage = await db.transaction((tx) =>
    seals.ledgerPage(owner.userId, tx, printAccess, { page: 2, pageSize: 10 }),
  );
  expect(nextPage).toMatchObject({
    data: [],
    meta: { total: 2, page: 2, pageSize: 10 },
  });
  const requestScoped = await db.transaction((tx) =>
    seals.ledgerPage(
      owner.userId,
      tx,
      {
        ...printAccess,
        requests: {
          ...ALL,
          read: {
            scope: { id: external.id },
            fields: SEAL_PRINT_REQUEST_FIELDS,
          },
        },
      },
      { page: 1, pageSize: 10 },
    ),
  );
  expect(requestScoped.meta.total).toBe(1);
  expect(requestScoped.data[0].id).toBe(borrowed.ledgerId);
  const headSession = await head.session();
  expect(
    (await headSession.fetch(`/sealLedger/${borrowed.ledgerId}`)).status,
  ).toBe(403);
  expect((await headSession.fetch(`/sealLedger/${randomUUID()}`)).status).toBe(
    403,
  );

  const ownerSession = await owner.session();
  expect(
    (await testApp.request(`/sealLedger/${borrowed.ledgerId}`)).status,
  ).toBe(401);
  expect((await ownerSession.fetch('/sealLedger?pageSize=11')).status).toBe(
    400,
  );
  expect((await ownerSession.fetch(`/sealLedger/${randomUUID()}`)).status).toBe(
    403,
  );
  expect(
    (await ownerSession.fetch(`/sealLedger/${borrowed.ledgerId}`)).status,
  ).toBe(200);

  await expect(
    db.transaction((tx) =>
      seals.printRegistration(
        borrowed.ledgerId!,
        keeper.userId,
        tx,
        printAccess,
      ),
    ),
  ).rejects.toMatchObject({ code: 'SEAL_EVIDENCE_REQUIRED' });
  expect(
    await db.transaction((tx) => seals.outstandingFor(owner.userId, tx)),
  ).toHaveLength(1);
  expect(await db.repository('contractSealLinks').count()).toBe(1);
  expect(
    await db
      .repository('sealLedger')
      .findOne({ filter: { requestId: external.id } }),
  ).toMatchObject({
    actualCopies: null,
    sealedAt: null,
    contractVersion: 1,
    contractTextVersionId: facts.textVersionId,
  });
  // A real version change after custody cannot falsify current contract confirmation.
  const changedFacts = { ...facts, textVersionId: randomUUID() };
  await db.transaction((tx) =>
    contracts.publish(
      {
        ...command(),
        contractId,
        requestId: randomUUID(),
        baseVersion: 1,
        number: 'SEAL-REAL-1',
        amountCents: 98765,
        facts: changedFacts,
      },
      tx,
    ),
  );
  await perform(keeper.userId, 'claim', 'return-claim', undefined, external.id);
  const returnedAt = new Date().toISOString(),
    physical = {
      sealId: seal.id,
      actualCopies: 2,
      sealedAt: new Date(Date.now() - 3000).toISOString(),
      borrowedAt,
      returnedAt,
    };
  await expect(
    perform(keeper.userId, 'complete', 'return-stale', physical, external.id),
  ).rejects.toMatchObject({ code: 'CONTRACT_VERSION_CONFLICT' });
  expect(await db.repository('sealReceipts').count()).toBe(0);
  expect(
    await db.transaction((tx) => seals.outstandingFor(owner.userId, tx)),
  ).toHaveLength(1);
  const beforeClose = (await service.detail(external.id, keeper.userId, ALL))
    .record;
  const closed = await service.change(
    external.id,
    keeper.userId,
    'forceComplete',
    { reason: 'Contract was amended while physically checked out' },
    'external-close',
    beforeClose.lifecycleVersion,
    access,
  );
  expect(closed.status).toBe('administrativelyClosed');
  await expect(
    db.transaction((tx) => custody.assertCleared(owner.employeeId, tx)),
  ).rejects.toThrow('SEAL_CUSTODY_OUTSTANDING');
  expect(
    await db.transaction((tx) => seals.outstandingFor(owner.userId, tx)),
  ).toHaveLength(1);
  const returnInput = {
    requestKey: 'late-actual-return',
    expectedVersion: closed.lifecycleVersion,
    actualCopies: 2,
    sealedAt: physical.sealedAt,
    returnedAt,
    reason:
      'Actual old-version stamping and physical return; current amended contract remains unconfirmed',
  };
  await expect(
    service.actualReturn(external.id, head.userId, returnInput, access),
  ).rejects.toMatchObject({ code: 'ADMIN_KEEPER_REQUIRED' });
  const returnSpy = vi
    .spyOn(audit, 'record')
    .mockImplementation(async (entry, tx) => {
      if (entry.action === 'seal.return')
        throw new Error('Physical return audit rollback');
      return original(entry, tx);
    });
  await expect(
    service.actualReturn(external.id, keeper.userId, returnInput, access),
  ).rejects.toThrow('Physical return audit rollback');
  returnSpy.mockRestore();
  expect(await db.repository('sealReceipts').count()).toBe(0);
  await expect(
    db.transaction((tx) => custody.assertCleared(owner.employeeId, tx)),
  ).rejects.toThrow('SEAL_CUSTODY_OUTSTANDING');
  const receipt = await service.actualReturn(
    external.id,
    keeper.userId,
    returnInput,
    access,
  );
  expect(receipt.contractConfirmation).toBe('unconfirmed');
  await db.transaction((tx) => custody.assertCleared(owner.employeeId, tx));
  const receiptDetail = await db.transaction((tx) =>
    seals.ledgerDetail(closed.ledgerId!, owner.userId, tx, printAccess),
  );
  expect(receiptDetail).toMatchObject({
    printable: false,
    receipt: { id: receipt.id, confirmedBy: { name: 'Seal keeper' } },
  });
  await expect(
    db.transaction((tx) =>
      seals.ledgerDetail(closed.ledgerId!, owner.userId, tx, {
        ...printAccess,
        receipts: { ...ALL, read: { fields: ['id'], scope: true } },
      }),
    ),
  ).rejects.toMatchObject({ code: 'ACCESS_DENIED' });
  await expect(
    db.transaction((tx) =>
      seals.ledgerDetail(closed.ledgerId!, owner.userId, tx, {
        ...printAccess,
        receipts: {
          ...ALL,
          read: {
            scope: { id: randomUUID() },
            fields: [...SEAL_PRINT_RECEIPT_FIELDS, 'reason'],
          },
        },
      }),
    ),
  ).rejects.toMatchObject({ code: 'ACCESS_DENIED' });
  await expect(
    db.transaction((tx) =>
      seals.ledgerDetail(closed.ledgerId!, owner.userId, tx, {
        ...printAccess,
        requests: { ...ALL, read: false },
      }),
    ),
  ).rejects.toMatchObject({ code: 'ACCESS_DENIED' });

  expect(
    await service.actualReturn(external.id, keeper.userId, returnInput, access),
  ).toMatchObject({ id: receipt.id });
  expect(
    await db.transaction((tx) => seals.outstandingFor(owner.userId, tx)),
  ).toHaveLength(0);
  expect(await db.repository('contractSealLinks').count()).toBe(1);
  expect(
    await db.transaction((tx) => contracts.source(contractId, tx)),
  ).toMatchObject({
    version: 2,
    status: 'activePendingSeal',
    facts: changedFacts,
  });
  await expect(
    db.transaction((tx) => seals.proof(borrowed.ledgerId!, tx)),
  ).rejects.toMatchObject({ code: 'SEAL_EVIDENCE_REQUIRED' });
  await expect(
    db.transaction((tx) =>
      seals.printRegistration(
        borrowed.ledgerId!,
        keeper.userId,
        tx,
        printAccess,
      ),
    ),
  ).rejects.toMatchObject({ code: 'SEAL_EVIDENCE_REQUIRED' });
  async function checkout(key: string) {
    const request = await service.create(
      owner.userId,
      {
        contractId,
        fileIds: [],
        sealType: 'official',
        copies: 1,
        external: true,
        returnDueAt: new Date(Date.now() + 86400_000).toISOString(),
        purpose: key,
        contact: '',
      },
      `${key}-create`,
      access,
    );
    await service.change(
      request.id,
      owner.userId,
      'submit',
      {},
      `${key}-submit`,
      request.lifecycleVersion,
      access,
    );
    await perform(head.userId, 'approve', `${key}-head`, undefined, request.id);
    await perform(
      legal.userId,
      'approve',
      `${key}-legal`,
      undefined,
      request.id,
    );
    await perform(head.userId, 'approve', `${key}-gm`, undefined, request.id);
    await perform(
      keeper.userId,
      'claim',
      `${key}-claim`,
      undefined,
      request.id,
    );
    const borrowedAt = new Date(Date.now() - 10_000).toISOString();
    await perform(
      keeper.userId,
      'complete',
      `${key}-checkout`,
      {
        sealId: seal.id,
        borrowedAt,
        sealedAt: null,
        actualCopies: null,
        returnedAt: null,
      },
      request.id,
    );
    await perform(
      keeper.userId,
      'claim',
      `${key}-return-claim`,
      undefined,
      request.id,
    );
    return { request, borrowedAt };
  }
  const normal = await checkout('normal-return');
  const normalOutput = {
    sealId: seal.id,
    actualCopies: 1,
    sealedAt: new Date(Date.now() - 3000).toISOString(),
    borrowedAt: normal.borrowedAt,
    returnedAt: new Date().toISOString(),
  };
  await perform(
    keeper.userId,
    'complete',
    'normal-actual-return',
    normalOutput,
    normal.request.id,
  );
  expect(
    (await service.detail(normal.request.id, owner.userId, ALL)).record.status,
  ).toBe('completed');
  const normalRecord = (
    await service.detail(normal.request.id, owner.userId, ALL)
  ).record;
  expect(
    await db.transaction((tx) =>
      seals.printRegistration(
        normalRecord.ledgerId!,
        keeper.userId,
        tx,
        printAccess,
      ),
    ),
  ).toMatchObject({
    external: true,
    actualCopies: 1,
    borrowedAt: normal.borrowedAt,
    sealedAt: normalOutput.sealedAt,
    returnedAt: normalOutput.returnedAt,
  });
  await expect(
    db.transaction((tx) =>
      seals.printRegistration(normalRecord.ledgerId!, keeper.userId, tx, {
        ...printAccess,
        receipts: { ...ALL, read: { scope: true, fields: ['id', 'ledgerId'] } },
      }),
    ),
  ).rejects.toMatchObject({ code: 'ACCESS_DENIED' });
  expect(
    await db
      .repository('sealReceipts')
      .findOne({ filter: { requestId: normal.request.id } }),
  ).toMatchObject({ contractConfirmation: 'confirmed' });
  expect(
    await db.transaction((tx) => contracts.source(contractId, tx)),
  ).toMatchObject({ version: 2, status: 'active' });
  const terminated = await checkout('terminated-return');
  const systemAdmin = await signIn(testApp, DEFAULT_ADMIN_CREDENTIALS);
  await employees(testApp).createEmployee(
    {
      userId: systemAdmin.user.id,
      code: 'SEAL-MAINTENANCE-ROOT',
      name: 'Actual system maintenance employee',
      status: 'regular',
      hireDate: '2025-01-01',
    },
    ALL,
    systemAdmin.user.id,
  );
  const replacement = await createEmployee(
    testApp,
    'Actual replacement seal keeper',
  );
  await org.addDutyRoleMember('sealKeeper', replacement.userId, {
    actorId: head.userId,
  });
  const reassignment = c.resolve(departureApprovalReassignmentToken),
    reassignInput = {
      from: keeper.userId,
      to: replacement.userId,
      reason: 'Keeper departure handover of actual outstanding return task',
      requestKey: 'seal-departure-reassignment',
    };
  const beforeReassign = (
    await service.approvals.tasksOf(keeper.userId)
  ).filter(
    (t) => t.recordId === terminated.request.id && OPEN.includes(t.status),
  );
  expect(beforeReassign.length).toBeGreaterThan(0);
  const reserveOriginal = audit.record.bind(audit),
    reserveFailure = vi
      .spyOn(audit, 'record')
      .mockImplementation(async (entry, tx) => {
        if (entry.action === 'departure.reassignmentReserved')
          throw new Error('Reassignment audit outage');
        return reserveOriginal(entry, tx);
      });
  await expect(reassignment.reassign(reassignInput)).rejects.toThrow(
    'Reassignment audit outage',
  );
  reserveFailure.mockRestore();
  expect(
    await db.transaction((tx) => seals.outstandingFor(owner.userId, tx)),
  ).toHaveLength(1);
  expect(await reassignment.reassign(reassignInput)).toEqual({ remaining: 0 });
  expect(await reassignment.reassign(reassignInput)).toEqual({ remaining: 0 });
  const replacementActions = await service.approvals.actionsOf(
    SEAL_KIND,
    terminated.request.id,
  );
  expect(replacementActions.filter((a) => a.name === 'reassign')).toHaveLength(
    1,
  );
  expect(
    await db
      .repository('sealReceipts')
      .count({ filter: { requestId: terminated.request.id } }),
  ).toBe(0);
  expect(
    await db.transaction((tx) => seals.outstandingFor(owner.userId, tx)),
  ).toHaveLength(1);

  await db.transaction((tx) =>
    contracts.publish(
      {
        ...command(),
        contractId,
        requestId: randomUUID(),
        baseVersion: 2,
        number: 'SEAL-REAL-1',
        amountCents: 98765,
        facts: changedFacts,
        terminate: true,
      },
      tx,
    ),
  );
  const terminationOutput = {
    sealId: seal.id,
    actualCopies: 1,
    sealedAt: new Date(Date.now() - 3000).toISOString(),
    borrowedAt: terminated.borrowedAt,
    returnedAt: new Date().toISOString(),
  };
  await expect(
    perform(
      replacement.userId,
      'complete',
      'terminated-normal-return',
      terminationOutput,
      terminated.request.id,
    ),
  ).rejects.toMatchObject({ code: 'CONTRACT_NOT_EFFECTIVE' });
  const awaiting = (
    await service.detail(terminated.request.id, keeper.userId, ALL)
  ).record;
  const administrative = await service.change(
    terminated.request.id,
    keeper.userId,
    'forceComplete',
    { reason: 'Current contract terminated during actual custody' },
    'terminated-admin-close',
    awaiting.lifecycleVersion,
    access,
  );
  await service.actualReturn(
    terminated.request.id,
    keeper.userId,
    {
      requestKey: 'terminated-actual-return',
      expectedVersion: administrative.lifecycleVersion,
      actualCopies: 1,
      sealedAt: terminationOutput.sealedAt,
      returnedAt: terminationOutput.returnedAt,
      reason: 'Physical seal returned; terminated contract is never restored',
    },
    access,
  );
  expect(
    await db.transaction((tx) => seals.outstandingFor(owner.userId, tx)),
  ).toHaveLength(0);
  expect(
    await db.transaction((tx) => contracts.source(contractId, tx)),
  ).toMatchObject({ version: 3, status: 'terminated', amountCents: 98765 });
}, 90_000);
