// @vitest-environment node
import path from 'node:path';
import { randomUUID } from 'node:crypto';
import { expect, vi } from 'vitest';
import { strToU8, zipSync, unzipSync, strFromU8 } from 'fflate';
import { databaseManagerToken } from '@nocobase/db';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { auditServiceToken } from '../../../server/providers/audit/index.js';
import {
  certificateRequestServiceToken,
  certificatePrintServiceToken,
  CERTIFICATE_KIND,
} from '../../../server/providers/certificates/contract.js';
import {
  printSourceRegistryToken,
  templatePrintServiceToken,
} from '../../../server/providers/template-print/contract.js';
import { CERTIFICATE_VIEW_FIELDS } from '../../../server/providers/certificates/printing.js';
import { DOCX_MIME } from '../../../server/providers/template-print/renderer.js';
import { createEmployee, ALL } from '../employees/helpers.js';
import { test } from './helpers.js';
import { installCertificatePermissions } from '../../fixtures/certificates/202610104711_certificate_permissions.js';

test('real manager and HR claim, frozen income DOCX, failed generation and audit rollback never create false archive', async ({
  testApp,
}) => {
  const c = testApp.application.container,
    db = c.resolve(databaseManagerToken),
    org = c.resolve(organizationServiceToken),
    service = c.resolve(certificateRequestServiceToken),
    printing = c.resolve(certificatePrintServiceToken),
    templates = c.resolve(templatePrintServiceToken),
    registry = c.resolve(printSourceRegistryToken),
    audit = c.resolve(auditServiceToken);
  if (!(await db.collections().get('certificateRequests'))) {
    await db
      .createMigrator({
        sources: [
          {
            packageName: 'certificates-candidate',
            directory: path.resolve(
              import.meta.dirname,
              '../../fixtures/certificates/migrations',
            ),
          },
        ],
        tableName: 'certificateCandidateMigrations',
      })
      .latest();
  }
  const owner = await createEmployee(testApp, 'Certificate owner'),
    head = await createEmployee(testApp, 'Certificate head'),
    hr = await createEmployee(testApp, 'Certificate HR');
  const department = await org.createDepartment(
    { title: 'Certificate department', managerId: head.userId },
    { actorId: head.userId },
  );
  await org.addMember(
    { departmentId: department.id, userId: owner.userId, primary: true },
    { actorId: head.userId },
  );
  await org.addDutyRoleMember('hr', hr.userId, { actorId: head.userId });
  const access = {
    requests: ALL,
    view: ALL,
    issue: ALL,
    income: ALL,
    template: ALL,
    templateRevision: ALL,
    printSource: ALL,
  };
  await installCertificatePermissions(db.connection().query);
  expect(registry.get('certificates')).toBeTruthy();
  const createdTemplate = await templates.create(
    hr.userId,
    {
      requestKey: randomUUID(),
      name: 'Income proof',
      source: 'certificates',
    },
    ALL,
  );
  const templateId = createdTemplate.record.id;
  const bytes = zipSync({
    '[Content_Types].xml': strToU8(
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
    ),
    '_rels/.rels': strToU8(
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="r1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    ),
    'word/document.xml': strToU8(
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>{d.number} {d.employee.name} {d.income.monthlyFormatted}</w:t></w:r></w:p></w:body></w:document>',
    ),
  });
  const uploaded = await templates.upload(
    templateId,
    hr.userId,
    {
      requestKey: randomUUID(),
      version: 1,
      file: new File([bytes], 'income.docx', { type: DOCX_MIME }),
    },
    ALL,
  );
  const revisionId = uploaded.revision.id;
  await expect(
    db.transaction((tx) =>
      templates.revisionSnapshot(
        templateId,
        revisionId,
        {
          ...ALL,
          read: {
            scope: { id: 'another-template' },
            fields: ['id', 'source', 'active'],
          },
        },
        tx,
        ALL,
      ),
    ),
  ).rejects.toThrow('PRINT_TEMPLATE_DENIED');
  await expect(
    db.transaction((tx) =>
      templates.revisionSnapshot(templateId, revisionId, ALL, tx, {
        ...ALL,
        read: { scope: true, fields: ['id', 'templateId'] },
      }),
    ),
  ).rejects.toThrow('PRINT_TEMPLATE_DENIED');
  expect(
    await db.transaction((tx) =>
      templates.revisionSnapshot(
        templateId,
        revisionId,
        {
          ...ALL,
          read: {
            scope: { id: templateId },
            fields: ['id', 'source', 'active'],
          },
        },
        tx,
        {
          ...ALL,
          read: {
            scope: { id: revisionId },
            fields: ['id', 'templateId', 'contentHash', 'schemaVersion'],
          },
        },
      ),
    ),
  ).toMatchObject({ templateId, revisionId });
  const request = await service.create(
    owner.userId,
    {
      certificateType: 'income',
      purpose: 'Actual bank evidence',
      copies: 2,
      deliveryMethod: 'pickup',
    },
    randomUUID(),
    access,
  );
  await service.change(
    request.id,
    owner.userId,
    'submit',
    {},
    randomUUID(),
    request.lifecycleVersion,
    access,
  );
  async function action(
    actorId: string,
    name: string,
    key = randomUUID(),
    input?: Record<string, string | string[]>,
  ) {
    const offer = (
      await service.approvals.actionsFor(CERTIFICATE_KIND, request.id, {
        id: actorId,
      })
    ).find((o) => o.actions.some((a) => a.name === name));
    const runOffer = offer
      ? undefined
      : (
          await service.approvals.runActionsFor(CERTIFICATE_KIND, request.id, {
            id: actorId,
          })
        ).find((o) => o.actions.some((a) => a.name === name));
    expect(offer ?? runOffer).toBeTruthy();
    const run = (
      await service.approvals.runViewsFor(CERTIFICATE_KIND, request.id)
    ).at(-1)!;
    return service.perform(
      request.id,
      actorId,
      {
        action: name,
        target: offer ? { taskId: offer.task.id } : { runId: runOffer!.run.id },
        requestId: key,
        contentHash: run.run.contentHash,
        input,
      },
      access,
    );
  }
  expect(await service.listForCenter(owner.userId, 'mine', ALL)).toMatchObject([
    {
      id: request.id,
      kind: CERTIFICATE_KIND,
      number: null,
      amount: null,
      unit: null,
    },
  ]);
  expect(
    (await service.listForCenter(head.userId, 'pending', ALL)).map(
      (row) => row.id,
    ),
  ).toContain(request.id);
  expect(await service.listForCenter(hr.userId, 'pending', ALL)).toEqual([]);
  const copied = await createEmployee(testApp, 'Certificate copied reader');
  await action(head.userId, 'cc', randomUUID(), { to: [copied.userId] });
  await action(head.userId, 'approve');
  expect(
    (await service.listForCenter(head.userId, 'done', ALL)).map(
      (row) => row.id,
    ),
  ).toContain(request.id);
  expect(
    (await service.listForCenter(hr.userId, 'pending', ALL)).map(
      (row) => row.id,
    ),
  ).toContain(request.id);
  await org.removeDutyRoleMember('hr', hr.userId, { actorId: head.userId });
  expect(await service.listForCenter(hr.userId, 'pending', ALL)).toEqual([]);
  await org.addDutyRoleMember('hr', hr.userId, { actorId: head.userId });
  await action(hr.userId, 'claim');
  expect(
    (await service.listForCenter(copied.userId, 'copied', ALL)).map(
      (row) => row.id,
    ),
  ).toContain(request.id);
  expect(await service.listForCenter(owner.userId, 'copied', ALL)).toEqual([]);
  expect(
    await service.listForCenter(owner.userId, 'mine', {
      ...ALL,
      read: { scope: { id: 'outside' }, fields: [...CERTIFICATE_VIEW_FIELDS] },
    }),
  ).toEqual([]);
  await expect(
    service.listForCenter(owner.userId, 'mine', { ...ALL, read: false }),
  ).rejects.toThrow('CERTIFICATE_ACCESS_DENIED');
  await expect(
    service.listForCenter(owner.userId, 'mine', {
      ...ALL,
      read: {
        scope: true,
        fields: ['id', 'applicantId', 'status', 'createdAt'],
      },
    }),
  ).rejects.toThrow('CERTIFICATE_ACCESS_DENIED');

  await expect(
    action(hr.userId, 'transfer', randomUUID(), { to: owner.userId }),
  ).rejects.toThrow('CERTIFICATE_HR_REQUIRED');
  const handlerSession = await hr.session();
  const optionsResponse = await handlerSession.fetch(
    `/certificateRequests/${request.id}`,
  );
  expect(optionsResponse.status).toBe(200);
  expect(await optionsResponse.json()).toMatchObject({
    data: {
      capabilities: {
        canIssue: true,
        taskActions: [
          {
            taskId: expect.any(String),
            contentHash: expect.any(String),
            actions: expect.arrayContaining([
              expect.objectContaining({ name: 'complete' }),
            ]),
          },
        ],
      },
    },
  });
  const prepInput = {
    templateId,
    revisionId,
    issueDate: '2026-10-11',
    monthlyCents: 1234567,
    requestKey: randomUUID(),
  };
  const p = await service.prepare(request.id, hr.userId, prepInput, access);
  expect(
    (await service.prepare(request.id, hr.userId, prepInput, access)).number,
  ).toBe(p.number);
  expect(await db.repository('certificateIssues').count()).toBe(0);
  await expect(
    printing.source(
      p.id,
      hr.userId,
      { ...access, view: { ...ALL, read: false } },
      'zh-CN',
    ),
  ).rejects.toThrow('CERTIFICATE_ACCESS_DENIED');
  await expect(
    printing.source(
      p.id,
      hr.userId,
      { ...access, income: { ...ALL, read: false } },
      'zh-CN',
    ),
  ).rejects.toThrow('CERTIFICATE_INCOME_DENIED');
  await expect(
    printing.source(p.id, owner.userId, access, 'zh-CN'),
  ).rejects.toThrow('CERTIFICATE_HR_REQUIRED');
  const productionSource = registry.get('certificates')!;
  const sourceInput = {
    recordId: p.id,
    actorId: hr.userId,
    policy: ALL,
    paths: ['number', 'income.monthlyFormatted'],
    locale: 'zh-CN' as const,
    timeZone: 'Asia/Shanghai',
  };
  expect(await productionSource.load(sourceInput)).toMatchObject({
    number: p.number,
    income: { monthlyCents: 1234567 },
  });
  await expect(
    productionSource.load({
      ...sourceInput,
      policy: { ...ALL, read: { scope: true, fields: ['id'] } },
    }),
  ).rejects.toThrow('CERTIFICATE_ACCESS_DENIED');
  await expect(
    productionSource.load({
      ...sourceInput,
      policy: {
        ...ALL,
        read: { scope: { id: 'absent' }, fields: [...Object.keys(request)] },
      },
    }),
  ).rejects.toThrow('CERTIFICATE_ACCESS_DENIED');
  await expect(
    productionSource.load({ ...sourceInput, paths: ['rawSalary'] }),
  ).rejects.toThrow('CERTIFICATE_ACCESS_DENIED');
  const renderer = vi
    .spyOn(templates, 'render')
    .mockRejectedValueOnce(new Error('worker fixture failure'));
  await expect(service.generate(p.id, hr.userId, access)).rejects.toThrow(
    'worker fixture failure',
  );
  renderer.mockRestore();
  expect(await db.repository('certificateIssues').count()).toBe(0);
  expect(await db.repository('employeeArchiveReferences').count()).toBe(0);
  await service.generate(p.id, hr.userId, access);
  await expect(service.content(p.id, hr.userId, access)).rejects.toThrow(
    'CERTIFICATE_ARTIFACT_MISSING',
  );
  const original = audit.record.bind(audit),
    spy = vi.spyOn(audit, 'record');
  spy.mockImplementation(async (entry, tx) => {
    if (entry.action === 'certificate.issued')
      throw new Error('audit fixture failure');
    return original(entry, tx);
  });
  const key = randomUUID();
  const completeOffer = (
    await service.approvals.actionsFor(CERTIFICATE_KIND, request.id, {
      id: hr.userId,
    })
  ).find((o) => o.actions.some((a) => a.name === 'complete'))!;
  const completeRun = (
    await service.approvals.runViewsFor(CERTIFICATE_KIND, request.id)
  ).at(-1)!;
  const completeInput = {
    action: 'complete',
    target: { taskId: completeOffer.task.id },
    requestId: key,
    contentHash: completeRun.run.contentHash,
    input: { preparationId: p.id },
  };
  await expect(
    service.perform(request.id, hr.userId, completeInput, access),
  ).rejects.toThrow('audit fixture failure');
  spy.mockRestore();
  expect(await db.repository('certificateIssues').count()).toBe(0);
  expect(await db.repository('employeeArchiveReferences').count()).toBe(0);
  const repeated = await Promise.all([
    service.perform(request.id, hr.userId, completeInput, access),
    service.perform(request.id, hr.userId, completeInput, access),
  ]);
  expect(repeated[0]).toEqual(repeated[1]);
  await expect(
    service.perform(
      request.id,
      hr.userId,
      { ...completeInput, comment: 'changed key payload' },
      access,
    ),
  ).rejects.toThrow('CERTIFICATE_COMMAND_CONFLICT');
  await expect(
    service.perform(request.id, hr.userId, completeInput, {
      ...access,
      issue: { ...ALL, update: false },
    }),
  ).rejects.toThrow('CERTIFICATE_ACCESS_DENIED');
  await expect(
    service.perform(request.id, hr.userId, completeInput, {
      ...access,
      income: { ...ALL, read: false },
    }),
  ).rejects.toThrow('CERTIFICATE_INCOME_DENIED');
  await expect(
    service.perform(request.id, hr.userId, completeInput, {
      ...access,
      printSource: { ...ALL, read: false },
    }),
  ).rejects.toThrow('CERTIFICATE_ACCESS_DENIED');
  const detail = await service.detail(request.id, owner.userId, ALL);
  expect(detail.record.status).toBe('issued');
  const result = await service.content(
      detail.record.issueId!,
      hr.userId,
      access,
    ),
    xml = strFromU8(unzipSync(result.bytes)['word/document.xml']);
  expect(xml).toContain('12,345.67');
  expect(xml).toContain(p.number);
  expect(await db.repository('certificateIssues').count()).toBe(1);
  const center = (await service.listForCenter(hr.userId, 'done', ALL)).find(
    (row) => row.id === request.id,
  );
  expect(center).toMatchObject({
    kind: CERTIFICATE_KIND,
    number: p.number,
    amount: null,
    unit: null,
  });
  expect(Object.keys(center!).sort()).toEqual(
    [
      'id',
      'kind',
      'number',
      'title',
      'applicantId',
      'applicant',
      'status',
      'createdAt',
      'startDate',
      'endDate',
      'amount',
      'unit',
    ].sort(),
  );
  expect(await db.repository('employeeArchiveReferences').count()).toBe(1);
  await expect(
    service.content(detail.record.issueId!, owner.userId, access),
  ).rejects.toThrow('CERTIFICATE_HR_REQUIRED');
  await expect(
    service.content(detail.record.issueId!, hr.userId, {
      ...access,
      income: { ...ALL, read: false },
    }),
  ).rejects.toThrow('CERTIFICATE_INCOME_DENIED');
  await expect(
    service.content(detail.record.issueId!, hr.userId, {
      ...access,
      income: { ...ALL, read: { scope: true, fields: ['id', 'monthlyCents'] } },
    }),
  ).rejects.toThrow('CERTIFICATE_INCOME_DENIED');
  const hrSession = await hr.session(),
    ownerSession = await owner.session();
  const downloadUrl = `/certificateIssues/${detail.record.issueId}/content`;
  const hrDownload = await hrSession.fetch(downloadUrl);
  expect(hrDownload.status).toBe(200);
  expect(hrDownload.headers.get('cache-control')).toContain('no-store');
  expect(
    strFromU8(
      unzipSync(new Uint8Array(await hrDownload.arrayBuffer()))[
        'word/document.xml'
      ],
    ),
  ).toContain(p.number);
  expect((await ownerSession.fetch(downloadUrl)).status).toBe(403);
  await db
    .connection()
    .query.deleteFrom('authorizationPermissionSetAssignments')
    .where('permissionSetKey', '=', 'oa-certificates-hr')
    .execute();
  await expect(productionSource.load(sourceInput)).rejects.toThrow(
    'CERTIFICATE_ACCESS_DENIED',
  );
  expect((await hrSession.fetch(downloadUrl)).status).toBe(403);
  await org.removeDutyRoleMember('hr', hr.userId, { actorId: head.userId });
  await expect(
    service.prepare(request.id, hr.userId, prepInput, access),
  ).rejects.toThrow('CERTIFICATE_HR_REQUIRED');
  expect(JSON.stringify(detail.record)).not.toContain('1234567');
  expect(JSON.stringify(detail.actions)).not.toContain('1234567');
}, 90_000);
