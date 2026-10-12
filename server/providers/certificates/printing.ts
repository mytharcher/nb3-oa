import { CertificateError } from './errors.js';
import { createHash } from 'node:crypto';
import type { DatabaseConnection, DatabaseManager } from '@nocobase/db';
import type { ApprovalDirectoryService } from '../approval-directory/contract.js';
import type {
  CertificatePreparation,
  CertificatePrintService,
  CertificateRenderData,
  CertificateRequest,
} from './contract.js';

export const certificateDigest = (value: unknown) =>
  createHash('sha256').update(JSON.stringify(value)).digest('hex');
export const certificateFingerprint = (
  r: Pick<
    CertificateRequest,
    | 'employeeId'
    | 'departmentId'
    | 'certificateType'
    | 'purpose'
    | 'copies'
    | 'deliveryMethod'
  >,
) =>
  certificateDigest([
    r.employeeId,
    r.departmentId,
    r.certificateType,
    r.purpose,
    r.copies,
    r.deliveryMethod,
  ]);
export const CERTIFICATE_VIEW_FIELDS = [
  'id',
  'applicantId',
  'employeeId',
  'departmentId',
  'certificateType',
  'purpose',
  'copies',
  'deliveryMethod',
  'preparationId',
  'issueId',
  'status',
  'lifecycleVersion',
  'createdById',
  'createdAt',
  'statusChangedAt',
  'submittedAt',
  'exceptionReason',
  'administrativeReason',
] as const;
interface FrozenPreparation extends CertificatePreparation {
  safeFacts: Omit<CertificateRenderData, 'income'>;
}
interface IncomeFacts {
  id: string;
  monthlyCents: string;
  currency: string;
}

/** Owner-only frozen source. Shared registry must pass all three current policies. */
export function createCertificatePrintService(dependencies: {
  db: DatabaseManager;
  directory: ApprovalDirectoryService;
}): CertificatePrintService {
  return {
    async source(preparationId, actorId, access, locale, connection) {
      const load = async (tx: DatabaseConnection) => {
        if (access.view.read === false || access.issue.update === false)
          throw new CertificateError('CERTIFICATE_ACCESS_DENIED');
        const directory = await dependencies.directory.snapshot(tx);
        if (!directory.isActive(actorId) || !directory.hasRole(actorId, 'hr'))
          throw new CertificateError('CERTIFICATE_HR_REQUIRED');
        const preparation = await tx
          .repository<FrozenPreparation>('certificatePreparations')
          .findOne({ filter: { id: preparationId } });
        if (!preparation)
          throw new CertificateError('CERTIFICATE_PREPARATION_MISSING');
        const request = await tx
          .repository<CertificateRequest>('certificateRequests')
          .withPolicy(access.view)
          .findOne({ filter: { id: preparation.requestId } });
        if (
          !request ||
          CERTIFICATE_VIEW_FIELDS.some((field) => !(field in request))
        )
          throw new CertificateError('CERTIFICATE_ACCESS_DENIED');
        if (request.preparationId !== preparation.id)
          throw new CertificateError('CERTIFICATE_PREPARATION_STALE');
        const allowed = await tx
          .repository('certificateRequests')
          .withPolicy(access.issue)
          .validateMutation({
            operation: 'updateOne',
            filter: { id: request.id },
            values: { preparationId: preparation.id },
          });
        if (!allowed.valid)
          throw new CertificateError('CERTIFICATE_ACCESS_DENIED');
        // Explicit properties prevent private preparation metadata or raw employee snapshots escaping.
        const facts = preparation.safeFacts;
        if (
          !facts ||
          facts.employee?.id !== preparation.employeeId ||
          facts.department?.id !== request.departmentId ||
          !facts.employee.name ||
          !facts.department.name ||
          !Number.isSafeInteger(facts.copies) ||
          facts.copies < 1 ||
          !facts.certificateType ||
          !facts.purpose ||
          !facts.deliveryMethod
        )
          throw new CertificateError('CERTIFICATE_PREPARATION_INVALID');
        const data: CertificateRenderData = {
          number: preparation.number,
          issueDate: preparation.issueDate,
          employee: { id: facts.employee.id, name: facts.employee.name },
          department: { id: facts.department.id, name: facts.department.name },
          certificateType: facts.certificateType,
          purpose: facts.purpose,
          copies: facts.copies,
          deliveryMethod: facts.deliveryMethod,
        };
        if (preparation.sensitivity === 'income') {
          if (!access.income || access.income.read === false)
            throw new CertificateError('CERTIFICATE_INCOME_DENIED');
          // Current ordinary request scope and private field policy are independent requirements.
          const income = await tx
            .repository<IncomeFacts>('certificatePreparationPrivate')
            .withPolicy(access.income)
            .findOne({ filter: { id: preparation.id } });
          if (
            !income ||
            !('monthlyCents' in income) ||
            !('currency' in income) ||
            typeof income.monthlyCents !== 'string' ||
            income.currency !== 'CNY' ||
            !/^(0|[1-9]\d*)$/.test(income.monthlyCents)
          )
            throw new CertificateError('CERTIFICATE_INCOME_DENIED');
          const cents = Number(income.monthlyCents);
          if (!Number.isSafeInteger(cents))
            throw new CertificateError('CERTIFICATE_INCOME_INVALID');
          data.income = {
            monthlyCents: cents,
            currency: 'CNY',
            monthlyFormatted: new Intl.NumberFormat(locale, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            }).format(cents / 100),
          };
        }
        return data;
      };
      return connection ? load(connection) : dependencies.db.transaction(load);
    },
  };
}
