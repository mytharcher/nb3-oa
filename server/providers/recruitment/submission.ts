import type { DatabaseConnection } from '@nocobase/db';
import type { OrgService } from '../org/contract.js';
import type { EmployeeService } from '../employees/contract.js';
import type {
  HeadcountService,
  HeadcountReservation,
} from '../headcounts/contract.js';
import type {
  SalaryGradeService,
  SalaryGradeSelection,
} from '../job-grades/contract.js';
import { assertSalaryRange } from '../job-grades/ranges.js';
import type { RuleService } from '../platform/rules.js';

export class RecruitmentSubmissionError extends Error {
  constructor(public readonly reason: string) {
    super(reason);
  }
}
export interface RecruitmentProposal {
  id: string;
  departmentId: string;
  positionId: string;
  gradeId: string;
  accountId: string;
  year: number;
  quantity: number;
  kind: 'additional' | 'replacement';
  replacementEmployeeIds: readonly string[];
  minimumCents: number;
  maximumCents: number;
}
/** Safe to place in approval records. Salary values belong in a separately guarded private revision. */
export interface RecruitmentSubmissionSnapshot {
  privateSalaryRevisionId?: string;
  departmentId: string;
  positionId: string;
  gradeId: string;
  rank: number;
  quantity: number;
  kind: RecruitmentProposal['kind'];
  replacementEmployeeIds: string[];
  accountId: string;
  year: number;
  gradeTableVersion: number;
  gradeRevisionId: string;
  directorRank: number;
  headId: string | null;
  headRequired: boolean;
  executiveId: string | null;
  executiveRequired: boolean;
  gmId: string | null;
  gmRequired: boolean;
  hrDirectorId: string | null;
  hrbpIds: string[];
}
export interface RecruitmentPrivateSalarySnapshot {
  minimumCents: number;
  maximumCents: number;
  band: SalaryGradeSelection;
}
export interface RecruitmentSubmissionDependencies {
  org: OrgService;
  employees: Pick<EmployeeService, 'getById'>;
  headcounts: HeadcountService;
  grades: SalaryGradeService;
  rules: Pick<RuleService, 'snapshot'>;
}
export interface RecruitmentSubmissionCommand {
  actorId: string;
  requestKey: string;
  reason: string;
  resubmission: boolean;
  /** Reviewer modifications route the initial head check by the original applicant. */
  applicantId?: string;
  now: Date;
  /** Must enforce submit permission and its scoped target department in this transaction. */
  authorizeTarget: (
    departmentId: string,
    tx: DatabaseConnection,
  ) => Promise<boolean>;
}
function refuse(reason: string): never {
  throw new RecruitmentSubmissionError(reason);
}
/**
 * The headcount guard is acquired before employee reads and before SDK writes. The host's write callback
 * persists the safe approval proposal and private salary revision in this same transaction. It must never
 * place `salary` in an SDK record, journal, notification or audit payload.
 */
export function createRecruitmentSubmissionCoordinator(
  d: RecruitmentSubmissionDependencies,
) {
  return {
    async submit<T>(
      proposal: RecruitmentProposal,
      command: RecruitmentSubmissionCommand,
      connection: DatabaseConnection,
      write: (
        snapshot: RecruitmentSubmissionSnapshot,
        salary: RecruitmentPrivateSalarySnapshot,
        reservation: HeadcountReservation,
        tx: DatabaseConnection,
      ) => Promise<T>,
    ): Promise<T> {
      return d.headcounts.within(connection, async (tx) => {
        if (!(await command.authorizeTarget(proposal.departmentId, tx)))
          refuse('RECRUITMENT_FORBIDDEN');
        if (
          !proposal.id ||
          !command.actorId ||
          !command.requestKey ||
          !command.reason.trim()
        )
          refuse('RECRUITMENT_INVALID_COMMAND');
        if (
          !Number.isSafeInteger(proposal.quantity) ||
          proposal.quantity < 1 ||
          !Number.isSafeInteger(proposal.year) ||
          proposal.year < 1900 ||
          proposal.year > 9999
        )
          refuse('RECRUITMENT_INVALID_QUANTITY');
        const chain = await d.org.activeChain(proposal.departmentId, tx);
        if (!chain?.length) refuse('RECRUITMENT_DEPARTMENT_UNAVAILABLE');
        const position = (await d.org.listPositions(tx)).find(
          (row) => row.id === proposal.positionId,
        );
        if (!position?.active) refuse('RECRUITMENT_POSITION_UNAVAILABLE');
        const grade = (await d.org.listGrades(tx)).find(
          (row) => row.id === proposal.gradeId,
        );
        if (!grade?.active) refuse('RECRUITMENT_GRADE_UNAVAILABLE');
        const account = await d.headcounts.balance(proposal.accountId, tx);
        if (
          !account?.initialized ||
          account.departmentId !== proposal.departmentId ||
          account.positionId !== proposal.positionId ||
          account.year !== proposal.year
        )
          refuse('RECRUITMENT_ACCOUNT_MISMATCH');
        const replacements = [...proposal.replacementEmployeeIds];
        if (
          new Set(replacements).size !== replacements.length ||
          (proposal.kind === 'additional' && replacements.length !== 0) ||
          (proposal.kind === 'replacement' &&
            replacements.length !== proposal.quantity)
        )
          refuse('RECRUITMENT_INVALID_REPLACEMENTS');
        for (const id of replacements) {
          const employee = await d.employees.getById(id, tx);
          if (
            !employee ||
            !['leaving', 'left'].includes(employee.status) ||
            employee.positionId !== proposal.positionId
          )
            refuse('RECRUITMENT_REPLACEMENT_UNAVAILABLE');
          // Historical left occupancy is authoritatively validated by headcounts.hold, not inferred from
          // present membership (departure may already have removed it).
        }
        const band = await d.grades.snapshotForGrade(proposal.gradeId, tx);
        assertSalaryRange(band, proposal.minimumCents, proposal.maximumCents);
        const rules = await d.rules.snapshot(
          ['grade.directorRank', 'sla.remindHours', 'sla.escalateHours'],
          command.now,
          tx,
        );
        const directorRank = Number(rules['grade.directorRank']);
        if (!Number.isSafeInteger(directorRank) || directorRank < 0)
          refuse('RECRUITMENT_INVALID_RULES');
        if (
          rules['sla.remindHours'] !== 24 ||
          rules['sla.escalateHours'] !== 48
        )
          refuse('RECRUITMENT_UNSUPPORTED_SLA');
        const head = await d.org.headOf(proposal.departmentId, tx);
        const executive = await d.org.executiveOf(proposal.departmentId, tx);
        const gm = await d.org.dutyRoleMembers('gm', tx);
        const hrDirector = await d.org.dutyRoleMembers('hrDirector', tx);
        // Single-person roles may be empty (SDK hold/appoint) but ambiguous roles must not silently pick one.
        if (gm.length > 1 || hrDirector.length > 1)
          refuse('RECRUITMENT_AMBIGUOUS_SINGLE_ROLE');
        const hrbp = await d.org.dutyRoleMembers('hrbp', tx);
        const snapshot: RecruitmentSubmissionSnapshot = {
          departmentId: proposal.departmentId,
          positionId: proposal.positionId,
          gradeId: proposal.gradeId,
          rank: band.rank,
          quantity: proposal.quantity,
          kind: proposal.kind,
          replacementEmployeeIds: replacements,
          accountId: proposal.accountId,
          year: proposal.year,
          gradeTableVersion: band.tableVersion,
          gradeRevisionId: band.revisionId,
          directorRank,
          headId: head ?? null,
          headRequired:
            !head || (command.applicantId ?? command.actorId) !== head,
          executiveId: executive ?? null,
          executiveRequired: proposal.kind === 'additional',
          gmId: gm[0] ?? null,
          gmRequired:
            proposal.kind === 'additional' || band.rank >= directorRank,
          hrDirectorId: hrDirector[0] ?? null,
          hrbpIds: [...new Set(hrbp)],
        };
        const hold = {
          actorId: command.actorId,
          requestKey: command.requestKey,
          reason: command.reason,
          sourceKind: 'oa.recruitment',
          sourceId: proposal.id,
          accountId: proposal.accountId,
          quantity: proposal.quantity,
          replacementEmployeeIds: replacements,
        };
        const reservation = command.resubmission
          ? await d.headcounts.reviseHold(hold, tx)
          : await d.headcounts.hold(hold, tx);
        return write(
          snapshot,
          {
            minimumCents: proposal.minimumCents,
            maximumCents: proposal.maximumCents,
            band: { ...band },
          },
          reservation,
          tx,
        );
      });
    },
  };
}
