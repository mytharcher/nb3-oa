import { ApplicationRefreshButton } from '#components/application-refresh-button';
import { UserName } from '#components/user-name';
import { useEffect, useReducer } from 'react';
import {
  Link,
  Outlet,
  useLocation,
  useOutletContext,
  useParams,
} from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import { RecordDetailDrawer } from '#components/record-detail-drawer';
import { Button } from '#components/ui/button';
import { StatusBadge } from '#components/status-badge';
import { statusTone } from './status-tone.js';
import { useAnnouncementResource } from './resource.js';
import { Failure, Loading } from './states.js';
import { Attachments } from './files.js';
import {
  currentActions,
  effective,
  dateLabel,
  type Context,
  type Detail,
  type Options,
} from './types.js';
export default function AnnouncementDetail() {
  const { announcementId } = useParams(),
    { t, i18n } = useTranslation(),
    location = useLocation(),
    parent = useOutletContext<Context>();
  const r = useAnnouncementResource<{ data: Detail }>(
      `announcements/${encodeURIComponent(announcementId!)}`,
    ),
    o = useAnnouncementResource<{ data: Options }>('announcements/context');
  const [, tick] = useReducer((n: number) => n + 1, 0);
  useEffect(() => {
    const timer = setInterval(tick, 15000);
    return () => clearInterval(timer);
  }, []);
  const row = r.data?.data,
    actions = row && !r.loading && !r.error ? currentActions(row) : [];
  const refresh = () => {
      r.reload();
      o.reload();
    },
    saved = () => {
      refresh();
      parent.reload();
    };
  const link = (path: string) => ({
    pathname: path,
    search: location.search,
    hash: location.hash,
  });
  return (
    <RecordDetailDrawer
      headerStatus={
        row?.requiresConfirmation && row.capabilities.ownReceipt ? (
          <StatusBadge tone={statusTone(row.capabilities.ownReceipt.status)}>
            {t(`announcements.${row.capabilities.ownReceipt.status}`)}
          </StatusBadge>
        ) : null
      }
      title={row?.title ?? t('announcements.detail')}
      closeTo={link('..')}
      footer={
        <>
          {actions
            .filter((a) => a !== 'receipts')
            .map((a) => (
              <Button
                key={a}
                variant={
                  a === 'revoke'
                    ? 'destructive'
                    : a === 'confirm' || a === 'publish'
                      ? 'default'
                      : 'outline'
                }
                nativeButton={false}
                render={
                  <Link to={link(a === 'edit' ? 'edit' : `actions/${a}`)} />
                }
              >
                {t(`announcements.actions.${a}`)}
              </Button>
            ))}
          {actions.includes('receipts') ? (
            <Button
              variant='outline'
              nativeButton={false}
              render={<Link to={link('receipts')} />}
            >
              {t('announcements.receipts')}
            </Button>
          ) : null}
          <ApplicationRefreshButton
            label={t('announcements.refresh')}
            loading={r.loading || o.loading}
            onClick={refresh}
          />
        </>
      }
    >
      {r.error ? <Failure error={r.error} retry={refresh} /> : null}
      {o.error ? <Failure error={o.error} retry={refresh} /> : null}
      {!row ? (
        r.loading ? (
          <Loading />
        ) : null
      ) : (
        <div className='flex flex-col gap-4'>
          <dl className='grid grid-cols-[minmax(0,1fr)_minmax(0,2fr)] gap-3'>
            <dt className='text-muted-foreground'>
              {t('announcements.publicationStatus')}
            </dt>
            <dd>{t(`announcements.status.${row.status}`)}</dd>
            <dt className='text-muted-foreground'>
              {t('announcements.publisher')}
            </dt>
            <dd className='break-words'>
              <UserName name={row.publisher.name} />
            </dd>
            {o.data ? (
              <>
                <dt className='text-muted-foreground'>
                  {t('announcements.timeZone')}
                </dt>
                <dd>{o.data.data.timeZone}</dd>
                {row.requiresConfirmation &&
                row.capabilities.ownReceipt?.confirmedAt ? (
                  <>
                    <dt className='text-muted-foreground'>
                      {t('announcements.confirmedAt')}
                    </dt>
                    <dd>
                      {dateLabel(
                        row.capabilities.ownReceipt.confirmedAt,
                        i18n.language,
                        o.data.data.timeZone,
                      )}
                    </dd>
                  </>
                ) : null}
                {(['validFrom', 'validUntil'] as const).map((k) => (
                  <div className='contents' key={k}>
                    <dt className='text-muted-foreground'>
                      {t(`announcements.fields.${k}`)}
                    </dt>
                    <dd>
                      {dateLabel(row[k], i18n.language, o.data!.data.timeZone)}
                    </dd>
                  </div>
                ))}
              </>
            ) : null}
          </dl>
          {row.status === 'scheduled' ||
          row.status === 'revoked' ||
          (row.status === 'published' && !effective(row)) ? (
            <p className='text-muted-foreground'>
              {t(
                `announcements.notice.${row.status === 'published' ? 'expired' : row.status}`,
              )}
            </p>
          ) : null}
          <div className='whitespace-pre-wrap break-words'>{row.body}</div>
          {row.knowledgeLink ? (
            <div className='rounded-lg border p-4'>
              <p>
                {t('announcements.linkedKnowledge', {
                  title: row.knowledgeLink.title,
                  version: row.knowledgeLink.version,
                })}
              </p>
              {row.hasNewVersion ? (
                <p className='mt-2 text-muted-foreground'>
                  {t('announcements.newVersion')}
                </p>
              ) : null}
            </div>
          ) : null}
          {row.attachments.length ? (
            <Attachments announcementId={row.id} selected={row.attachments} />
          ) : null}
          {!row.requiresConfirmation || !row.capabilities.ownReceipt ? (
            <p>
              {t(
                !row.requiresConfirmation
                  ? 'announcements.noConfirmation'
                  : 'announcements.noOwnReceipt',
              )}
            </p>
          ) : null}
        </div>
      )}
      <Outlet
        context={{
          ...parent,
          reload: saved,
          updateDetail: (data: Detail) => r.update({ data }),
        }}
      />
    </RecordDetailDrawer>
  );
}
