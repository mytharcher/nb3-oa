// @vitest-environment node
import { it, expect } from 'vitest';
import { startOrgTestApp } from '../org/helpers.js';
import { createEmployee } from '../employees/helpers.js';
import { leaveServiceToken } from '../../../server/providers/leave/index.js';
import { calendarServiceToken } from '../../../server/providers/platform/index.js';
it('finishes concurrent employee permissions and manager detail refreshes after an approval', async () => {
  const app = await startOrgTestApp();
  try {
    const manager = await createEmployee(app.testApp, 'Concurrent Manager'),
      employee = await createEmployee(app.testApp, 'Concurrent Employee', {
        managerId: manager.employeeId,
      });
    const department = await app.organization.createDepartment(
      { title: 'Concurrent review', managerId: manager.userId },
      { actorId: manager.userId },
    );
    await app.organization.addMember(
      { departmentId: department.id, userId: employee.userId, primary: true },
      { actorId: manager.userId },
    );
    const c = app.testApp.application.container,
      service = c.resolve(leaveServiceToken),
      calendar = c.resolve(calendarServiceToken);
    let date = calendar.addCalendarDays(calendar.localDate(new Date()), 2);
    while (!calendar.isWorkday(date)) date = calendar.addCalendarDays(date, 1);
    const draft = await service.create(
      {
        leaveType: 'personal',
        startDate: date,
        endDate: date,
        startHalf: 'am',
        endHalf: 'pm',
        reason: 'Synthetic concurrent approval',
        attachments: [],
        handoverUserId: null,
        enableDelegation: false,
      },
      employee.userId,
    );
    const id = String(draft.record.id);
    await service.transition(
      id,
      'submit',
      employee.userId,
      draft.record.lifecycleVersion,
      'concurrent-submit',
    );
    const detail = await service.detail(id, manager.userId),
      run = detail.runs.at(-1)!;
    await service.action(
      id,
      {
        target: {
          taskId: run.tasks.find((task) => task.assigneeId === manager.userId)!
            .id,
        },
        action: 'approve',
        contentHash: run.run.contentHash,
        requestId: 'concurrent-approve',
      },
      manager.userId,
    );
    const employeeSession = await employee.session(),
      managerSession = await manager.session();
    const requests = Array.from({ length: 12 }, () => [
      employeeSession.fetch('/authorization/permissions'),
      managerSession.fetch(`/leaveRequests/${id}`),
      managerSession.fetch(
        '/taskCenter?source=approval.task&status=pending&page=1&pageSize=10',
      ),
    ]).flat();
    const responses = await Promise.all(requests);
    expect(responses.map((response) => response.status)).toEqual(
      Array(36).fill(200),
    );
  } finally {
    await app.close();
  }
}, 120000);
