import { UserName } from '#components/user-name';
import { StatusBadge } from '#components/status-badge';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useTranslation } from '@nocobase/i18n/client';
import { cn } from 'cn';
import { createElement } from 'react';
import { Link, useLocation } from 'react-router';
import { approvalStatusTone } from '../approvals/status-tone.js';
import {
  approvalBusiness,
  approvalStateLabel,
  formatApprovalPeriodValue,
} from '../approvals/business-metadata.js';
import type { CenterRecord } from '../approvals/use-center-resource.js';
import {
  dueState,
  kindPresentation,
  relativeTime,
} from './record-presentation.js';

/** One task or request row in a workbench card; the record opens over the current page. */
export function WorkRow({
  record,
  showInitiator = false,
  showApplicant = false,
  source,
  now,
}: {
  record: CenterRecord;
  showInitiator?: boolean;
  showApplicant?: boolean;
  /** Where the row comes from, shown as text ahead of the business type. */
  source?: string;
  now: Date;
}) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const date = (value: string) =>
    formatApprovalPeriodValue(value, i18n.language);
  const tone = approvalStatusTone(record.status, record.kind);
  const business = t(
    `approvalCenter.kinds.${approvalBusiness(record.kind).label}`,
  );
  const title =
    record.title?.trim() ||
    t(
      record.status === 'draft'
        ? 'workbench.draftWithoutSummary'
        : 'workbench.requestWithoutSummary',
      { type: business },
    );
  const to = {
    pathname: `${approvalBusiness(record.kind).detail}/${record.id}`,
    search: location.search,
    hash: location.hash,
  };
  const { session } = useAuthentication();
  const isApproval = !['oa.workItem', 'oa.announcementReceipt'].includes(
    record.kind,
  );
  const showPerson =
    !!record.applicant &&
    showInitiator &&
    ((showApplicant && isApproval) || record.applicantId !== session?.user?.id);
  const relevantDate = record.dueAt || record.updatedAt || record.createdAt;
  const dateLabel = record.dueAt
    ? 'workbench.dueAt'
    : record.updatedAt
      ? 'workbench.updatedAt'
      : 'workbench.createdAt';
  const relative = relativeTime(relevantDate ?? '', now, i18n.language);
  const due = dueState(record.dueAt, now);
  const kind = kindPresentation(record.kind);
  const linkClass =
    'rounded-sm text-sm font-medium text-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:outline-ring focus-visible:outline-2';
  return (
    <li className='grid min-w-0 grid-cols-[auto_minmax(0,1fr)_auto] items-start gap-x-3 gap-y-1 border-b border-border py-3 first:pt-0 last:border-0 last:pb-0'>
      <span
        aria-hidden='true'
        className='row-span-2 flex size-8 items-center justify-center rounded-lg bg-muted'
      >
        {createElement(kind.icon, { className: cn('size-4', kind.className) })}
      </span>
      <div className='min-w-0 break-words'>
        <Link className={linkClass} to={to}>
          {title}
        </Link>
      </div>
      <StatusBadge tone={tone} className='justify-self-end'>
        {approvalStateLabel(record.status, t, record.kind)}
      </StatusBadge>
      {showPerson ||
      title !== business ||
      (record.startDate && record.endDate) ||
      relevantDate ? (
        <div className='col-span-2 col-start-2 flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground'>
          {due ? (
            <StatusBadge tone={due === 'overdue' ? 'destructive' : 'warning'}>
              {t(
                due === 'overdue'
                  ? 'workbench.overdueBadge'
                  : 'workbench.dueToday',
              )}
            </StatusBadge>
          ) : null}
          {showPerson ? (
            <span className='inline-flex min-w-0 items-center gap-1'>
              <span>
                {t(isApproval ? 'approvals.applicant' : 'workbench.initiator')}:
              </span>
              <UserName
                name={record.applicant?.name ?? t('approvals.unknownPerson')}
              />
            </span>
          ) : null}
          <span>{source ? `${source} · ${business}` : business}</span>
          {record.unit === 'cents' && record.amount !== null ? (
            <span>
              {new Intl.NumberFormat(i18n.language, {
                style: 'currency',
                currency: 'CNY',
              }).format(record.amount / 100)}
            </span>
          ) : null}
          {relevantDate ? (
            <time dateTime={relevantDate} title={date(relevantDate)}>
              {t(dateLabel, { date: relative ?? date(relevantDate) })}
            </time>
          ) : null}
          {!(record.unit === 'cents' && record.amount !== null) &&
          record.startDate &&
          record.endDate ? (
            <span>
              {date(record.startDate)}–{date(record.endDate)}
            </span>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}
