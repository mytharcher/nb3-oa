import { UserName } from '#components/user-name';
import { Link, Outlet, useLocation, useParams } from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import { RecordDetailDrawer } from '#components/record-detail-drawer';
import { Button } from '#components/ui/button';
import { PrintEntry } from '../template-print/entry.js';
import { useSealResource } from './resource.js';
import { SealError, SealSkeleton } from './states.js';
import type { LedgerDetail } from './types.js';
export default function SealLedgerDetail() {
  const { sealLedgerId } = useParams(),
    { t, i18n } = useTranslation(),
    location = useLocation();
  const r = useSealResource<{ data: LedgerDetail }>(
      `sealLedger/${encodeURIComponent(sealLedgerId!)}`,
    ),
    d = r.data?.data;
  const ready = !!d && !r.loading && !r.error;
  return (
    <RecordDetailDrawer
      title={d?.request.number ?? t('seals.ledger')}
      footer={
        <div className='flex flex-wrap gap-2'>
          <PrintEntry
            source='sealRegistration'
            readable={ready && d.printable}
          />
          <Button variant='outline' onClick={r.reload} disabled={r.loading}>
            {t('seals.refresh')}
          </Button>
        </div>
      }
    >
      {r.error ? <SealError error={r.error} retry={r.reload} /> : null}
      {r.loading && !d ? <SealSkeleton /> : null}
      {d ? (
        <div className='flex flex-col gap-6'>
          <p className='text-muted-foreground'>{t('seals.physicalNotice')}</p>
          <dl className='grid grid-cols-1 gap-4 sm:grid-cols-2'>
            {Object.entries({
              ledgerId: d.record.id,
              applicant: d.record.applicant.name,
              sealId: d.record.sealId,
              copies: d.record.approvedCopies,
              actualCopies: d.receipt?.actualCopies ?? d.record.actualCopies,
              borrowedAt: d.record.borrowedAt,
              sealedAt: d.receipt?.sealedAt ?? d.record.sealedAt,
              returnedAt: d.receipt?.returnedAt,
              registeredBy: d.record.registeredBy.name,
              confirmedBy: d.receipt?.confirmedBy.name,
              contractConfirmation: d.receipt?.contractConfirmation,
              reason: d.receipt?.reason,
            }).map(([key, value]) => (
              <div key={key}>
                <dt className='text-muted-foreground'>{t(`seals.${key}`)}</dt>
                <dd className='mt-1 whitespace-pre-wrap break-words'>
                  {['applicant', 'registeredBy', 'confirmedBy'].includes(
                    key,
                  ) ? (
                    <UserName
                      name={typeof value === 'string' ? value : undefined}
                    />
                  ) : key === 'contractConfirmation' && value ? (
                    t(`seals.confirmations.${value}`)
                  ) : ['borrowedAt', 'sealedAt', 'returnedAt'].includes(key) &&
                    typeof value === 'string' ? (
                    new Date(value).toLocaleString(i18n.language, {
                      timeZone: d.timeZone,
                    })
                  ) : (
                    (value ?? '—')
                  )}
                </dd>
              </div>
            ))}
          </dl>
          <Link
            className='text-primary underline'
            to={{
              pathname: `/seal-requests/${d.request.id}`,
              search: location.search,
              hash: location.hash,
            }}
          >
            {t('seals.detail')}
          </Link>
        </div>
      ) : null}
      <Outlet
        context={{
          printSource: 'sealRegistration',
          printRecordId: ready && d.printable ? d.record.id : undefined,
          printRecordName: d?.request.number ?? t('seals.ledger'),
          printRefresh: r.invalidate,
        }}
      />
    </RecordDetailDrawer>
  );
}
