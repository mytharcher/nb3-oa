import { randomUUID } from 'node:crypto';
import { databaseManagerToken } from '@nocobase/db';
import { loanRequestServiceToken } from '../../../server/providers/loan-requests/contract.js';
import type { LoanRequestService } from '../../../server/providers/loan-requests/service.js';
import { vendorServiceToken } from '../../../server/providers/vendors/contract.js';
import {
  createEmployee,
  employees,
  ALL,
} from '../../logic/employees/helpers.js';
import { organizationServiceToken } from '../../../server/providers/org/index.js';
import { budgetServiceToken } from '../../../server/providers/budgets/contract.js';
import { leaveServiceToken } from '../../../server/providers/leave/service.js';
import { expensePlanServiceToken } from '../../../server/providers/expense-plan/service.js';
import { supplyServiceToken } from '../../../server/providers/supplies/index.js';
import { purchaseServiceToken } from '../../../server/providers/purchases/service.js';
import type { startIsolatedBrowserApp } from '../browser/harness.js';

export async function prepareWorkspaceQueues(
  h: Awaited<ReturnType<typeof startIsolatedBrowserApp>>,
  operatorId: string,
) {
  const c = h.testApp.application.container,
    org = c.resolve(organizationServiceToken),
    db = c.resolve(databaseManagerToken);
  const manager = await createEmployee(h.testApp, 'Workspace reviewer');
  const applicant = await createEmployee(h.testApp, 'Workspace requester', {
    managerId: manager.employeeId,
  });
  const department = await org.createDepartment(
    { title: 'Workspace workflow team', managerId: manager.userId },
    { actorId: manager.userId },
  );
  await org.addMember(
    { departmentId: department.id, userId: applicant.userId, primary: true },
    { actorId: manager.userId },
  );
  await db.transaction((tx) =>
    c.resolve(budgetServiceToken).allocate(
      {
        departmentId: department.id,
        year: 2026,
        subject: 'office',
        deltaCents: 100000000,
        reference: 'workspace-acceptance',
        requestKey: randomUUID(),
        actorId: operatorId,
        reason: 'Synthetic workflow setup',
      },
      tx,
    ),
  );
  const vendors = [];
  for (let i = 0; i < 3; i++)
    vendors.push(
      await db.transaction((tx) =>
        c
          .resolve(vendorServiceToken)
          .create(
            {
              code: `WS-V-${i}`,
              name: `Workspace supplier ${i + 1}`,
              category: 'Office',
              contactName: '',
              contactPhone: '',
              contactEmail: '',
              bankName: '',
              bankAccount: '',
              bankAccountName: '',
              actorId: operatorId,
              reason: 'Synthetic procurement acceptance',
            },
            tx,
          ),
      ),
    );
  await employees(h.testApp).updateProfile(
    applicant.employeeId,
    {
      bankName: 'Synthetic bank',
      bankAccount: '6222000000000000001',
      bankAccountName: 'Workspace requester',
    },
    ALL,
    applicant.userId,
  );
  const loan = c.resolve(loanRequestServiceToken) as LoanRequestService;
  const leave = c.resolve(leaveServiceToken),
    expense = c.resolve(expensePlanServiceToken),
    supply = c.resolve(supplyServiceToken),
    purchase = c.resolve(purchaseServiceToken);
  const requests = [
    {
      service: leave,
      draft: await leave.create(
        {
          leaveType: 'personal',
          startDate: '2026-11-02',
          endDate: '2026-11-13',
          startHalf: 'am',
          endHalf: 'pm',
          reason: 'Workspace HR review',
          attachments: [],
          handoverUserId: null,
          enableDelegation: false,
        },
        applicant.userId,
      ),
      endpoint: 'leaveRequests',
      role: 'HR operations',
      action: 'Approve',
      finalStatus: 'approved',
    },
    {
      service: expense,
      draft: await expense.create(
        {
          matterType: 'teamBuilding',
          reason: 'Workspace finance review',
          amountCents: 10001,
          subject: 'office',
          participants: 5,
          eventDate: '2026-11-12',
        },
        applicant.userId,
      ),
      endpoint: 'expensePlans',
      role: 'Finance operations',
      action: 'Approve',
      finalStatus: 'authorized',
    },
    {
      service: supply,
      draft: await supply.create(
        {
          items: [{ code: 'stationery', quantity: 3 }],
          purpose: 'Workspace administrative issuance',
        },
        applicant.userId,
      ),
      endpoint: 'supplyRequests',
      role: 'Office operations',
      action: 'Claim issuance',
      finalStatus: 'issuing',
    },
    {
      service: purchase,
      draft: await purchase.create(
        {
          items: [
            {
              id: 'workspace-item',
              name: 'Paper',
              specification: 'A4',
              quantity: '1',
              unit: 'box',
            },
          ],
          purpose: 'Workspace procurement handling',
          estimatedCents: 10000,
          subject: 'office',
          expectedDate: '2026-11-12',
          suggestedVendorId: null,
        },
        applicant.userId,
      ),
      endpoint: 'purchaseRequests',
      role: 'Procurement and contracts',
      action: 'Claim',
      finalStatus: 'purchasing',
    },
    {
      service: loan,
      draft: await loan.create(
        {
          reason: 'Workspace cashier payment',
          amountCents: 10000,
          dueDate: '2026-12-01',
          travelId: null,
        },
        applicant.userId,
      ),
      endpoint: 'loanRequests',
      role: 'Finance operations',
      action: 'Claim handling',
      finalStatus: 'paid',
    },
  ];
  for (const request of requests) {
    const id = String(request.draft.record.id);
    await request.service.transition(
      id,
      'submit',
      applicant.userId,
      Number(request.draft.record.lifecycleVersion),
      randomUUID(),
    );
    // Bring each real workflow to its specialist's task using the manager's public action service.
    for (let i = 0; i < 3; i++) {
      const detail = await request.service.detail(id, manager.userId);
      const entry = detail.taskActions.find((row) =>
        row.actions.some((action) => action.name === 'approve'),
      );
      if (!entry) break;
      const run = detail.runs.find((row) => row.run.id === entry.task.runId)!;
      await request.service.action(
        id,
        {
          target: { taskId: entry.task.id },
          action: 'approve',
          contentHash: run.run.contentHash,
          requestId: randomUUID(),
          comment: 'Synthetic manager review',
        },
        manager.userId,
      );
    }
  }
  const loanRequest = requests.find(
    (request) => request.endpoint === 'loanRequests',
  )!;
  const loanDetail = await loan.detail(
    String(loanRequest.draft.record.id),
    operatorId,
  );
  const financeTask = loanDetail.taskActions.find((row) =>
    row.actions.some((action) => action.name === 'approve'),
  )!;
  const loanRun = loanDetail.runs.find(
    (row) => row.run.id === financeTask.task.runId,
  )!;
  await loan.action(
    String(loanRequest.draft.record.id),
    {
      target: { taskId: financeTask.task.id },
      action: 'approve',
      contentHash: loanRun.run.contentHash,
      requestId: randomUUID(),
      comment: 'Finance verified loan',
    },
    operatorId,
  );
  return requests.map((request) => ({
    vendors,
    applicantId: applicant.userId,
    ...request,
    id: String(request.draft.record.id),
  }));
}
