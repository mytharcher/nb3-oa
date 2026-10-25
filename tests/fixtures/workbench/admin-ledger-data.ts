import { randomUUID } from 'node:crypto';
import { databaseManagerToken } from '@nocobase/db';
import type { startIsolatedBrowserApp } from '../browser/harness.js';
import { createEmployee } from '../../logic/employees/helpers.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';

/** Historical synthetic ledger facts test export projection, not issuance/signing lifecycle. */
export async function seedAdministrativeLedgers(
  h: Awaited<ReturnType<typeof startIsolatedBrowserApp>>,
  actorId: string,
) {
  const c = h.testApp.application.container,
    db = c.resolve(databaseManagerToken),
    org = c.resolve(organizationServiceToken);
  const recipient = await createEmployee(
    h.testApp,
    'Synthetic ledger recipient',
  );
  const department = await org.createDepartment(
    { title: 'Synthetic ledger department' },
    { actorId },
  );
  await org.addMember(
    { departmentId: department.id, userId: recipient.userId, primary: true },
    { actorId },
  );
  for (let index = 0; index < 105; index++)
    await db
      .repository('supplyIssueLedger')
      .createOne({
        values: {
          id: randomUUID(),
          applicationId: randomUUID(),
          line: 0,
          number: `SUPPLY-${index}`,
          itemLabel: {
            'en-US': 'Synthetic stationery',
            'zh-CN': '合成办公用品',
          },
          itemCode: index === 0 ? '=1+1' : 'stationery',
          requestedQuantity: 3,
          actualQuantity: 2,
          recipientId: recipient.userId,
          recipientName: 'Synthetic ledger recipient',
          issuerId: actorId,
          issuerName: 'Office handler',
          outcome: 'issued',
          createdAt: new Date(),
          reason: 'PRIVATE-EXPORT-REASON',
        },
      });
  const sealId = randomUUID(),
    requestId = randomUUID(),
    ledgerId = randomUUID(),
    now = new Date();
  await db
    .repository('seals')
    .createOne({
      values: {
        id: sealId,
        code: 'REPORT-SEAL',
        name: 'Synthetic report seal',
        sealType: 'company',
        active: true,
        version: 1,
      },
    });
  await db
    .repository('sealRequests')
    .createOne({
      values: {
        id: requestId,
        applicantId: recipient.userId,
        createdById: recipient.userId,
        departmentId: department.id,
        number: 'SEAL-EXPORT-001',
        copies: 2,
        actualCopies: 2,
        external: false,
        executionMode: 'physical',
        sealType: 'company',
        sealId,
        ledgerId,
        fileIds: [],
        purpose: 'PRIVATE-EXPORT-PURPOSE',
        contact: 'PRIVATE-EXPORT-CONTACT',
        ruleSnapshot: {},
        status: 'completed',
        lifecycleVersion: 1,
        createdAt: now,
        statusChangedAt: now,
        approvedAt: now,
        sealedAt: now,
      },
    });
  await db
    .repository('sealLedger')
    .createOne({
      values: {
        id: ledgerId,
        requestId,
        sealId,
        applicantId: recipient.userId,
        departmentId: department.id,
        approvedCopies: 2,
        actualCopies: 2,
        external: false,
        registeredById: actorId,
        registeredAt: now,
        sealedAt: now,
      },
    });
}
