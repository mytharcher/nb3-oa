import type { Application } from '@nocobase/app-server/application';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import {
  getTrialAccounts,
  getTrialPrefix,
} from '../../../cli/commands/lib/trial-data/accounts.js';
import type { TrialFacts } from '../../../cli/commands/lib/trial-data/bootstrap.js';
import { scenarios } from '../../../cli/commands/lib/trial-data/scenarios.js';
import { cloneScenario } from '../../../cli/commands/lib/trial-data/follow-ups.js';
import {
  populateScenario,
  transition,
  type ScenarioResult,
  type TrialSessions,
} from '../../../cli/commands/lib/trial-data/engine.js';
import { dataOf, recordOf } from '../../../cli/commands/lib/trial-data/http.js';
import { attendanceServiceToken } from '../attendance/contract.js';

/** Match the workbench's creation actions, including domain eligibility below. */
export const roleCoverageTemplates = [
  ['leave-draft', 'oa.leave', 'submit'],
  ['overtime-manager', 'oa.overtime', 'submit'],
  ['attendance-change', 'oa.attendanceChange', 'submit'],
  ['outing-manager', 'oa.outing', 'submit'],
  ['supply-head', 'oa.supplies', 'submit'],
  ['general-approval', 'oa.general', 'submit'],
  ['certificate-head', 'oa.certificateRequests', 'create'],
  ['seal-head', 'oa.sealRequests', 'create'],
  ['training-review', 'oa.training', 'submit'],
  ['expense-plan-head', 'oa.expensePlan', 'submit'],
  ['travel-head', 'oa.travel', 'submit'],
  ['loan-head', 'oa.loan', 'submit'],
  ['reimbursement-head', 'oa.reimbursement', 'submit'],
  ['purchase-head', 'oa.purchase', 'submit'],
  ['payment-head', 'oa.payment', 'submit'],
  ['budget-head', 'oa.budgetAdjustment', 'submit'],
  ['probation-manager', 'oa.probation', 'delegate'],
  ['contract-review', 'oa.contract', 'submit'],
  ['qualification-review', 'oa.vendorQualification', 'submit'],
  ['asset-use', 'oa.assetRequests', 'create'],
  ['vehicle-head', 'oa.vehicleRequests', 'submit'],
  ['departure-review', 'oa.departure', 'submit'],
  ['recruitment-review', 'oa.recruitment', 'submit'],
  ['transfer-review', 'oa.transfer', 'submit'],
] as const;

/** Supplement only missing actor/process pairs. All writes use the actor's real HTTP session.
 * General/off-site requests enter approval; loan drafts are withdrawn. Other drafts
 * preserve scarce stock/budgets alongside the existing completed stories.
 * A domain error is a failed scenario, never evidence that the user has no permission. */
export async function roleCoverage(
  app: Application,
  sessions: TrialSessions,
  facts: TrialFacts,
  saved: Record<string, ScenarioResult>,
  checkpoint: (row: ScenarioResult) => Promise<void>,
  failure: (key: string, error: unknown) => void,
) {
  const authz = app.container.resolve(authorizationToken);
  const catalog = scenarios(facts);
  for (const person of getTrialAccounts()) {
    if (person.key === 'system') continue;
    const actor = person.key;
    const session = sessions[actor];
    const principal = { type: 'user', id: session.userId };
    // These sessions have authenticated through trialSession. Match the HTTP
    // middleware: authenticated:* is a literal subject, not a membership resolver.
    const subjects = [
      { type: 'authenticated', id: '*' },
      ...(await authz.subjects.resolveFor(principal)),
    ];
    const authorization = authz.for({ principal, subjects });
    for (const [template, resource, action] of roleCoverageTemplates) {
      const base = catalog.find((s) => s.key === template)!;
      // Existing stories already satisfy this user's process coverage, at any status.
      if (
        Object.values(saved).some(
          (r) => r.actor === actor && r.path === base.path,
        )
      )
        continue;
      const decision = await authorization.authorize({
        resource: { type: 'composite', id: resource },
        action,
      });
      if (decision.effect === 'deny') continue;
      const key = `role-${actor}-${template}`;
      try {
        // Match domain capabilities as well as action grants. For example regular
        // employees can submit their probation review but only HR can create one.
        if (resource === 'oa.probation') {
          const options = dataOf(
            await session.request('/probationRequests/options'),
          );
          if (!options.canCreateManualDraft) continue;
        }
        if (resource === 'oa.transfer') {
          const options = dataOf(
            await session.request('/transferRequests/capabilities'),
          );
          if (!options.canCreateAsHR) continue;
        }
        if (resource === 'oa.assetRequests') {
          const options = dataOf(
            await session.request('/assetRequests/options'),
          );
          if (!options.eligible) continue;
        }
        if (resource === 'oa.vehicleRequests') {
          const options = dataOf(
            await session.request('/vehicleBrowser/options'),
          );
          if (!options.canCreate) continue;
        }
        if (resource === 'oa.contract') {
          const options = dataOf(
            await session.request('/contractRequests/options'),
          );
          if (!options.eligible) continue;
        }
        if (resource === 'oa.vendorQualification') {
          const options = dataOf(
            await session.request('/vendorQualifications/options'),
          );
          if (!options.canCreateQualification) continue;
        }
        if (resource === 'oa.departure') {
          const options = dataOf(
            await session.request('/departureRequests/options'),
          );
          if (!options.canCreateSelfDraft) continue;
        }
        const scenario = cloneScenario(base, key, {
          actor,
          draft:
            actor === 'gm' || !['oa.general', 'oa.outing'].includes(resource),
        });
        // Titles identify the process and owner in both supported content languages.
        const inner = scenario.body.input as
          Record<string, unknown> | undefined;
        const proposal = (scenario.body.proposal ?? inner?.proposal) as
          Record<string, unknown> | undefined;
        const target = proposal ?? inner ?? scenario.body;
        target[scenario.markerField] =
          `${person.name} · ${base.title} · ${String(target[scenario.markerField])}`;
        if (resource === 'oa.recruitment') {
          const options = dataOf(
            await session.request('/recruitmentRequests/createOptions'),
          );
          const departments = options.departments as { id: string }[];
          if (!options.canCreate || !departments?.length) continue;
          proposal!.departmentId = departments[0].id;
          const departmentKey = Object.keys(facts.departments).find(
            (key) => facts.departments[key] === departments[0].id,
          )!;
          proposal!.accountId = facts.headcountAccountIds[departmentKey];
        }
        if (resource === 'oa.general')
          scenario.body.extraApproverIds = [
            facts.users.legal,
            facts.users.hr,
          ].filter((id) => id !== session.userId);
        if (resource === 'oa.budgetAdjustment')
          scenario.body.departmentId = facts.departments[person.department];
        if (resource === 'oa.departure') {
          scenario.body.departureType = 'resignation';
          scenario.body.handoverUserId =
            facts.users[actor === 'employee2' ? 'employee' : 'employee2'];
        }
        if (resource === 'oa.leave')
          scenario.body.handoverUserId =
            facts.users[actor === 'employee2' ? 'employee' : 'employee2'];
        if (resource === 'oa.assetRequests') scenario.body.assetIds = [];
        if (resource === 'oa.attendanceChange') {
          const attendance = await app.container
            .resolve(attendanceServiceToken)
            .ingest(
              {
                userId: session.userId,
                date: facts.attendanceDate,
                punchKind: 'in',
                punchedAt: null,
                source: getTrialPrefix(),
                sourceKey: `${getTrialPrefix()}-${key}`,
                sourceData: { fictional: true },
              },
              { actorId: facts.users.system },
            );
          scenario.body.originalAttendanceId = attendance.id;
          scenario.body.originalVersion = attendance.version;
        }
        // Attachment-bearing drafts stay editable without generating duplicate
        // invoice numbers or borrowing a file owned by a different applicant.
        scenario.attachment = undefined;
        let row = await populateScenario(
          app,
          sessions,
          facts,
          scenario,
          saved[key],
        );
        if (!saved[key] && resource === 'oa.loan' && row.status === 'draft') {
          const record = recordOf(
            await session.request(`${scenario.path}/${row.id}`),
          );
          await transition(session, scenario, row.id, record, 'withdraw');
          row = {
            ...row,
            status: String(
              recordOf(await session.request(`${scenario.path}/${row.id}`))
                .status,
            ),
          };
        }
        await checkpoint(row);
      } catch (error) {
        failure(key, error);
      }
    }
  }
}
