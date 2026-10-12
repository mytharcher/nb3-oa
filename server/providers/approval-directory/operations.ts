import {
  ACTIONABLE,
  addSignerAction,
  configureAction,
  allActivePeople,
  defineApprovalAction,
  definePeopleScope,
  offered,
  transferAction,
  unavailable,
  type ActionContext,
} from '@nocobase/app-plugin-approval/server';
import type { DatabaseConnection, DatabaseManager } from '@nocobase/db';
import type { OrgService } from '../org/contract.js';
import type { CalendarService } from '../platform/index.js';

/** Shared OA operations use the transaction directory and application work calendar. */
export function createOaApprovalOperations(dependencies: {
  org: OrgService;
  db: DatabaseManager;
  calendar: CalendarService;
}) {
  const active = allActivePeople();
  const recipients = definePeopleScope({
    search: (context, query) => active.search(context, query),
    async contains(context, person) {
      if (!context.directory.isActive(person)) return false;
      const principal = context.task?.assigneeId;
      if (!principal) return false;
      // ActionContext erases host services; this boundary is supplied by the leave store wrapper.
      const { connection } = context.services as unknown as {
        connection?: DatabaseConnection;
      };
      const [from, to] = await Promise.all([
        dependencies.org.primaryDepartmentOf(principal, connection),
        dependencies.org.primaryDepartmentOf(person, connection),
      ]);
      if (from && to && from.id === to.id) return true;
      const roles = await (connection ?? dependencies.db)
        .repository('dutyRoles')
        .findMany({ filter: { active: true } });
      return roles.some(
        (role) =>
          context.directory.hasRole(principal, role.code as string) &&
          context.directory.hasRole(person, role.code as string),
      );
    },
  });
  const urge = defineApprovalAction<
    Record<string, never>,
    Record<string, never>
  >({
    name: 'urge',
    scope: 'run',
    actors: ['applicant'],
    guards: ['runOpen', 'activeActor'],
    defaults: {},
    async available(context) {
      if (!waiting(context).length)
        return unavailable('NOT_ALLOWED', 'Nobody is waiting for a reminder.');
      const hours = Number(
        (
          context.record as unknown as {
            ruleSnapshot?: Record<string, unknown>;
          }
        ).ruleSnapshot?.['sla.urgeCooldownHours'] ?? 4,
      );
      if (!Number.isFinite(hours) || hours <= 0)
        return unavailable('NOT_ALLOWED', 'The reminder policy is invalid.');
      const last = (await context.actions())
        .filter((entry) => entry.name === 'urge')
        .at(-1);
      const next = last
        ? dependencies.calendar.addWorkingHours(new Date(last.at), hours)
        : undefined;
      return next && next.getTime() > context.now.getTime()
        ? unavailable('NOT_ALLOWED', 'Wait before reminding again.')
        : offered();
    },
    plan: (_input, context) =>
      waiting(context).map((task) => ({
        type: 'notify',
        task: task.id,
        reason: 'urged',
      })),
  });
  return [
    configureAction(
      defineApprovalAction({
        ...transferAction,
        // OA delegates may hand over the principal's work; recipient scopes use the task assignee.
        actors: ['assignee', 'delegate'],
      }),
      { recipients, reason: true },
    ),
    configureAction(
      defineApprovalAction({
        ...addSignerAction,
        actors: ['assignee', 'delegate'],
      }),
      {
        recipients: active,
        modes: ['before', 'alongside'],
        maxDepth: 1,
      },
    ),
    urge,
  ];
}
function waiting(context: ActionContext) {
  return context.stay.filter(
    (task) => ACTIONABLE.includes(task.status) && task.role !== 'info',
  );
}
