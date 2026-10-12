import type { UserAdministrationService } from '@nocobase/app-plugin-authentication';
import type { DatabaseManager, RepositoryPolicy } from '@nocobase/db';
import type { I18nRuntime } from '@nocobase/i18n';
import type {
  ApprovalTimeline,
  RunView,
} from '@nocobase/app-plugin-approval/client';
import type { PrintDataSource, PrintSourceName } from './contract.js';
import { TemplatePrintError } from './validation.js';
import { projectPrintTimeline } from './timeline.js';
interface PublicDetail {
  record: object;
  users: readonly { id: string; name: string }[];
  runs: readonly RunView[];
  timeline: ApprovalTimeline;
}
const common = {
  id: ['id'],
  number: ['number'],
  'applicant.name': ['applicantId'],
  'status.value': ['status'],
  'status.label': ['status'],
  reason: ['reason'],
  createdAt: ['createdAt'],
  'timeline[].entryId': ['id'],
  'timeline[].runId': ['id'],
  'timeline[].type': ['id'],
  'timeline[].parentActionId': ['id'],
  'timeline[].actorRole': ['id'],
  'timeline[].onBehalfOf': ['id'],
  'timeline[].actor': ['id'],
  'timeline[].assignee': ['id'],
  'timeline[].stage': ['id'],
  'timeline[].action': ['id'],
  'timeline[].actionValue': ['id'],
  'timeline[].opinion': ['id'],
  'timeline[].at': ['id'],
} as const;
export const sourceFields: Record<
  PrintSourceName,
  Readonly<Record<string, readonly string[]>>
> = {
  leave: {
    ...common,
    leaveType: ['leaveType'],
    startDate: ['startDate'],
    endDate: ['endDate'],
    startHalf: ['startHalf'],
    endHalf: ['endHalf'],
    days: ['days'],
    enableDelegation: ['enableDelegation'],
  },
  reimbursement: {
    ...common,
    totalCents: ['totalCents'],
    offsetCents: ['offsetCents'],
    'lines[].category': ['lines'],
    'lines[].date': ['lines'],
    'lines[].amountCents': ['lines'],
    'lines[].invoiceNumber': ['lines'],
  },
  payment: {
    ...common,
    amountCents: ['amountCents'],
    invoiceNumber: ['invoiceNumber'],
    paymentMethod: ['paymentMethod'],
    sourceMode: ['sourceMode'],
  },
  contracts: {
    ...common,
    operation: ['operation'],
    contractType: ['contractType'],
    'counterparty.name': ['counterparty'],
    amountCents: ['amountCents'],
    startsOn: ['startsOn'],
    endsOn: ['endsOn'],
    paymentTerms: ['paymentTerms'],
    standardTemplate: ['standardTemplate'],
    nonStandard: ['nonStandard'],
    textVersionId: ['textVersionId'],
    baseVersion: ['baseVersion'],
  },
  sealRegistration: {
    number: ['requestId'],
    'applicant.id': ['applicantId'],
    'applicant.name': ['applicantId'],
    'department.id': ['departmentId'],
    'department.name': ['departmentId'],
    'seal.id': ['sealId'],
    'seal.type': ['sealId'],
    approvedCopies: ['approvedCopies'],
    actualCopies: ['actualCopies'],
    external: ['external'],
    borrowedAt: ['borrowedAt'],
    sealedAt: ['sealedAt'],
    returnedAt: ['id'],
    registeredAt: ['registeredAt'],
    'registeredBy.id': ['registeredById'],
    'registeredBy.name': ['registeredById'],
    'confirmedBy.id': ['id'],
    'confirmedBy.name': ['id'],
  },
  certificates: {
    number: ['preparationId'],
    issueDate: ['preparationId'],
    'employee.id': ['employeeId'],
    'employee.name': ['employeeId'],
    'department.id': ['departmentId'],
    'department.name': ['departmentId'],
    certificateType: ['certificateType'],
    purpose: ['purpose'],
    copies: ['copies'],
    deliveryMethod: ['deliveryMethod'],
    'income.monthlyCents': ['certificateType'],
    'income.currency': ['certificateType'],
    'income.monthlyFormatted': ['certificateType'],
  },
};
/** Public complete-detail facades currently cannot project fields; refuse partial grants BEFORE invoking them. */
export async function authorizeCompleteDetail(
  db: DatabaseManager,
  collection: string,
  id: string,
  policy: RepositoryPolicy,
) {
  if (policy.read === false)
    throw new TemplatePrintError('PRINT_RECORD_DENIED');
  const metadata = await db.collections().get(collection);
  if (!metadata) throw new TemplatePrintError('PRINT_SOURCE_UNAVAILABLE');
  const fields = (metadata.fields ?? [])
    .filter(
      (f) =>
        !['belongsTo', 'hasOne', 'hasMany', 'belongsToMany'].includes(f.type),
    )
    .map((f) => f.name);
  if (
    policy.read !== true &&
    (!Array.isArray(policy.read.fields) ||
      !fields.every(
        (field) =>
          policy.read !== true &&
          policy.read !== false &&
          policy.read.fields !== false &&
          policy.read.fields?.includes(field),
      ))
  )
    throw new TemplatePrintError('PRINT_FIELDS_DENIED');
  const row = await db
    .repository(collection)
    .withPolicy(policy)
    .findOne({ filter: { id }, select: (s) => s.fields('id') });
  if (!row) throw new TemplatePrintError('PRINT_RECORD_DENIED');
}
export function createPublicDetailSource(input: {
  name: 'leave' | 'reimbursement' | 'payment' | 'contracts';
  collection: string;
  viewResource: string;
  db: DatabaseManager;
  i18n: I18nRuntime;
  users: Pick<UserAdministrationService, 'get'>;
  detail: (
    id: string,
    actorId: string,
    policy: RepositoryPolicy,
  ) => Promise<PublicDetail>;
}): PrintDataSource {
  return {
    name: input.name,
    collection: input.collection,
    viewResource: input.viewResource,
    schemaVersion: 1,
    fields: sourceFields[input.name],
    async load({ recordId, actorId, policy, paths, locale, timeZone }) {
      if (paths.some((p) => !(p in sourceFields[input.name])))
        throw new TemplatePrintError('PRINT_FIELDS_DENIED');
      await authorizeCompleteDetail(
        input.db,
        input.collection,
        recordId,
        policy,
      );
      const detail = await input.detail(recordId, actorId, policy);
      const record = detail.record as Record<string, unknown>;
      const names = new Map(detail.users.map((p) => [p.id, p.name]));
      // Resolve only the already authorized public fact identities, never arbitrary SDK payloads.
      const missing = new Set<string>();
      projectPrintTimeline({
        timeline: detail.timeline,
        runs: detail.runs,
        person: (id) => {
          if (typeof id === 'string' && id && !names.has(id)) missing.add(id);
          return '';
        },
        label: (_, value) => value,
        formatDate: (at) => at,
      });
      for (const id of missing) {
        const user = await input.users.get(id);
        if (user) names.set(id, user.name);
      }

      const person = (id: unknown) =>
        typeof id === 'string' ? (names.get(id) ?? id) : '';
      await input.i18n.ensureLocaleLoaded(locale);
      const t = input.i18n.getFixedT('nb3-oa', locale);
      const status = String(record.status);
      const formatDate = (at: string) =>
        new Intl.DateTimeFormat(locale, {
          timeZone,
          dateStyle: 'medium',
          timeStyle: 'short',
        }).format(new Date(at));
      const timeline = projectPrintTimeline({
        timeline: detail.timeline,
        runs: detail.runs,
        person,
        formatDate,
        label: (kind, value) =>
          t(
            kind === 'stage'
              ? `templatePrint.status.${value}`
              : kind === 'action'
                ? `templatePrint.actions.${value}`
                : `templatePrint.events.${value}`,
            { defaultValue: value },
          ),
      });
      const data: Record<string, unknown> = {
        id: record.id,
        number: record.number ?? '',
        applicant: { name: person(record.applicantId) },
        status: {
          value: status,
          label: t(`templatePrint.status.${status}`, { defaultValue: status }),
        },
        reason: record.reason ?? '',
        createdAt:
          typeof record.createdAt === 'string'
            ? formatDate(record.createdAt)
            : record.createdAt instanceof Date
              ? formatDate(record.createdAt.toISOString())
              : '',
        timeline,
      };
      const direct =
        input.name === 'leave'
          ? [
              'leaveType',
              'startDate',
              'endDate',
              'startHalf',
              'endHalf',
              'days',
              'enableDelegation',
            ]
          : input.name === 'contracts'
            ? [
                'operation',
                'contractType',
                'amountCents',
                'startsOn',
                'endsOn',
                'paymentTerms',
                'standardTemplate',
                'nonStandard',
                'textVersionId',
                'baseVersion',
              ]
            : input.name === 'payment'
              ? ['amountCents', 'invoiceNumber', 'paymentMethod', 'sourceMode']
              : ['totalCents', 'offsetCents'];
      for (const key of direct) data[key] = record[key] ?? '';
      if (input.name === 'contracts') {
        const counterparty = record.counterparty as { name?: unknown } | null;
        data.counterparty = {
          name: typeof counterparty?.name === 'string' ? counterparty.name : '',
        };
      }
      if (input.name === 'reimbursement') {
        if (!Array.isArray(record.lines) || record.lines.length > 2000)
          throw new TemplatePrintError('PRINT_DATA_LIMIT');
        data.lines = record.lines.map((line) => {
          const item = line as Record<string, unknown>;
          return {
            category: item.category,
            date: item.date,
            amountCents: item.amountCents,
            invoiceNumber: item.invoiceNumber,
          };
        });
      }
      return data;
    },
  };
}
