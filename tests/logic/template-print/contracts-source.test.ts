// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { zipSync, strToU8, unzipSync, strFromU8 } from 'fflate';
import { renderValidatedDocx } from '../../../server/providers/template-print/renderer.js';
import { expect } from 'vitest';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { i18nToken } from '@nocobase/app-server/i18n';
import { createPublicDetailSource } from '../../../server/providers/template-print/sources.js';
import { contractServiceToken } from '../../../server/providers/contracts/contract.js';
import type { ApprovalTimeline } from '@nocobase/app-plugin-approval/client';
import { databaseManagerToken, type RepositoryPolicy } from '@nocobase/db';
import { createPlatformAppTest, createUser } from '../platform/helpers.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { contractHttpServiceToken } from '../../../server/providers/contracts/service.js';
import { printSourceRegistryToken } from '../../../server/providers/template-print/contract.js';
import { installContractPrintScope } from '../../../database/main/seeds/202610103815_contract_print_scope.js';
const test = createPlatformAppTest();
const read: RepositoryPolicy = {
  read: true,
  create: false,
  update: false,
  delete: false,
};
test('loads registered contract print DTO through the real public owner and rejects fields or scope before loading', async ({
  app,
  testApp,
}) => {
  const c = app.container,
    db = c.resolve(databaseManagerToken);
  const person = await createUser(testApp, 'contract-print-owner');
  await db.repository('employees').createOne({
    values: {
      id: randomUUID(),
      code: randomUUID(),
      name: 'Print owner',
      userId: person.user.id,
      status: 'regular',
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  });
  const org = c.resolve(organizationServiceToken);
  const department = await org.createDepartment(
    { title: 'Contract print department', managerId: person.user.id },
    { actorId: person.user.id },
  );
  await org.addMember(
    { departmentId: department.id, userId: person.user.id, primary: true },
    { actorId: person.user.id },
  );
  const created = await c.resolve(contractHttpServiceToken).create(
    {
      operation: 'new',
      contractId: null,
      baseVersion: 0,
      proposal: {
        contractType: 'purchase',
        counterparty: { kind: 'customer', name: 'Printable customer' },
        amountCents: 12001,
        startsOn: '2026-10-01',
        endsOn: '2027-10-01',
        paymentTerms: 'Net 30',
        standardTemplate: true,
        textVersionId: null,
        attachments: [],
        reason: 'Contract approval print',
      },
    },
    person.user.id,
    randomUUID(),
  );
  const source = c.resolve(printSourceRegistryToken).get('contracts')!;
  expect(source.collection).toBe('contractRequests');
  const input = {
    recordId: String(created.record.id),
    actorId: person.user.id,
    policy: read,
    paths: [
      'counterparty.name',
      'amountCents',
      'createdAt',
      'timeline[].actor',
    ],
    locale: 'en-US' as const,
    timeZone: 'Asia/Singapore',
  };
  const dto = await source.load(input);
  expect(dto).toMatchObject({
    counterparty: { name: 'Printable customer' },
    amountCents: 12001,
    reason: 'Contract approval print',
    status: { value: 'draft' },
  });
  expect(dto.createdAt).not.toBe('');
  expect(dto.timeline).toEqual([]);
  const administrator = await createUser(
    testApp,
    'Print administrator without task',
  );
  const delegate = await createUser(testApp, 'Print represented person');
  const unknownId = randomUUID();
  const namedSource = createPublicDetailSource({
    name: 'contracts',
    collection: 'contractRequests',
    viewResource: 'oa.contract',
    db,
    i18n: c.resolve(i18nToken),
    users: c.resolve(userAdministrationServiceToken),
    detail: async (id, actor, policy) => {
      const publicDetail = await c
        .resolve(contractServiceToken)
        .printDetail(id, actor, policy);
      expect(
        publicDetail.users.some(
          (user) =>
            user.id === administrator.user.id || user.id === delegate.user.id,
        ),
      ).toBe(false);
      // Authorized public-fact fixture; identities resolve through the real Authentication API.
      return {
        ...publicDetail,
        timeline: {
          runs: [
            {
              run: { id: 'synthetic-authorized-run' },
              entries: [
                {
                  type: 'action',
                  action: {
                    id: 'no-task-action',
                    name: 'terminate',
                    actorId: administrator.user.id,
                    onBehalfOf: delegate.user.id,
                    at: '2026-10-11T00:00:00Z',
                    stage: '',
                    taskId: null,
                    comment: '已确认',
                  },
                  events: [
                    {
                      id: 'nested-fact',
                      kind: 'task.reused',
                      actorId: unknownId,
                      at: '2026-10-11T00:01:00Z',
                      actionId: 'no-task-action',
                      stage: null,
                    },
                  ],
                },
                {
                  type: 'system',
                  event: {
                    id: 'run-started-fact',
                    kind: 'run.started',
                    actorId: administrator.user.id,
                    at: '2026-10-11T00:02:00Z',
                    actionId: null,
                    stage: null,
                  },
                },
              ],
              stages: [],
            },
          ],
        } as unknown as ApprovalTimeline,
      };
    },
  });
  const namedDto = await namedSource.load(input);
  const namedDtoZh = await namedSource.load({ ...input, locale: 'zh-CN' });
  expect(namedDtoZh.timeline).toMatchObject([
    { actionValue: 'terminate', action: '终止' },
    { actionValue: 'task.reused', action: '沿用了之前的意见' },
    { actionValue: 'run.started', action: '发起了审批' },
  ]);
  expect(namedDto.timeline).toMatchObject([
    {
      actor: 'Print administrator without task',
      onBehalfOf: 'Print represented person',
      assignee: 'Print represented person',
    },
    { actor: unknownId, actionValue: 'task.reused' },
    { actor: 'Print administrator without task', actionValue: 'run.started' },
  ]);
  await expect(
    namedSource.load({ ...input, policy: { ...read, read: false } }),
  ).rejects.toMatchObject({ code: 'PRINT_RECORD_DENIED' });

  const template = zipSync({
    '[Content_Types].xml': strToU8(
      '<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/></Types>',
    ),
    '_rels/.rels': strToU8(
      '<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="r1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>',
    ),
    'word/document.xml': strToU8(
      '<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body><w:p><w:r><w:t>{d.counterparty.name} / {d.amountCents} / {d.status.label} / {d.timeline[0].actor} / {d.timeline[0].onBehalfOf} / {d.timeline[1].action} / {d.timeline[2].action}</w:t></w:r></w:p></w:body></w:document>',
    ),
  });
  const rendered = await renderValidatedDocx({
    template,
    data: namedDto,
    locale: 'en-US',
    timeZone: 'Asia/Singapore',
  });
  const xml = strFromU8(unzipSync(rendered.bytes)['word/document.xml']!);
  expect(xml).toContain('Printable customer / 12001 / Draft');
  expect(xml).toContain(
    'Print administrator without task / Print represented person',
  );
  expect(xml).not.toContain(administrator.user.id);
  expect(xml).not.toContain(delegate.user.id);
  const chineseOutput = await renderValidatedDocx({
    template,
    data: namedDtoZh,
    locale: 'zh-CN',
    timeZone: 'Asia/Singapore',
  });
  const chineseXml = strFromU8(
    unzipSync(chineseOutput.bytes)['word/document.xml']!,
  );
  expect(chineseXml).toContain('沿用了之前的意见 / 发起了审批');
  expect(chineseXml).not.toMatch(/task.reused|run.started/);
  expect(xml).not.toContain('{d.');
  expect(dto).not.toHaveProperty('ruleSnapshot');
  expect(dto).not.toHaveProperty('attachments');
  expect(dto).not.toHaveProperty('bankAccount');
  await expect(
    source.load({ ...input, paths: ['counterparty.bankAccount'] }),
  ).rejects.toMatchObject({ code: 'PRINT_FIELDS_DENIED' });
  await expect(
    source.load({
      ...input,
      policy: {
        ...read,
        read: { scope: true, fields: ['id', 'counterparty', 'amountCents'] },
      },
    }),
  ).rejects.toMatchObject({ code: 'PRINT_FIELDS_DENIED' });
  await expect(
    source.load({
      ...input,
      policy: {
        ...read,
        read: {
          scope: { id: randomUUID() },
          fields: (await db.collections().get('contractRequests'))!.fields.map(
            (field) => field.name,
          ),
        },
      },
    }),
  ).rejects.toMatchObject({ code: 'PRINT_RECORD_DENIED' });
});
test('repairs only the former default print scope and preserves administrator-customized or removed actions', async ({
  app,
}) => {
  const db = app.container.resolve(databaseManagerToken),
    query = db.connection().query;
  const repo = db.repository('authorizationPermissionSets');
  const row = await repo.findOne({ filter: { key: 'oa-document-print' } });
  const grants = JSON.parse(String(row!.grants));
  const action = grants
    .find(
      (g: { resource: { id: string } }) => g.resource.id === 'oa.templatePrint',
    )
    .actions.find((a: { action: string }) => a.action === 'printContracts');
  expect(action.policy.scopes.contractRequests).toBe('allRecords');
  action.policy = {
    type: 'composite',
    scopes: { printTemplates: 'allRecords' },
  };
  await repo.updateMany({
    filter: { id: row!.id },
    values: { grants: JSON.stringify(grants) },
  });
  await installContractPrintScope(query);
  expect(
    JSON.parse(
      String((await repo.findOne({ filter: { id: row!.id } }))!.grants),
    )
      .find(
        (g: { resource: { id: string } }) =>
          g.resource.id === 'oa.templatePrint',
      )
      .actions.find((a: { action: string }) => a.action === 'printContracts')
      .policy.scopes.contractRequests,
  ).toBe('allRecords');
  action.policy = {
    type: 'composite',
    scopes: {
      printTemplates: 'allRecords',
      contractRequests: 'oa.contractReadable',
    },
  };
  await repo.updateMany({
    filter: { id: row!.id },
    values: { grants: JSON.stringify(grants) },
  });
  await installContractPrintScope(query);
  expect(
    String((await repo.findOne({ filter: { id: row!.id } }))!.grants),
  ).toContain('oa.contractReadable');
});
