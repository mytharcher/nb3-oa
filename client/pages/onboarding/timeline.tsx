import { useTranslation } from '@nocobase/i18n/client';
import { UserName } from '#components/user-name';
import { Badge } from '#components/ui/badge';
import type { TimelineEntry } from './types.js';

export function Timeline({
  entries,
  timeZone,
}: {
  entries: TimelineEntry[];
  timeZone: string;
}) {
  const { t, i18n } = useTranslation();
  const format = new Intl.DateTimeFormat(i18n.language, {
    timeZone,
    dateStyle: 'medium',
    timeStyle: 'short',
  });
  return (
    <section
      className='min-w-0 flex flex-col gap-3'
      aria-label={t('onboarding.timeline.title')}
    >
      <h3 className='font-medium'>{t('onboarding.timeline.title')}</h3>
      <p className='text-sm text-muted-foreground'>
        {t('onboarding.timeline.historyNotice')}
      </p>
      {entries.length ? (
        <ol className='flex flex-col gap-3'>
          {entries.map((entry) => (
            <li
              key={entry.id}
              className='min-w-0 rounded-lg border p-3 flex flex-col gap-1'
            >
              <time
                className='text-sm text-muted-foreground break-words'
                dateTime={entry.at}
              >
                {format.format(new Date(entry.at))} · {timeZone}
              </time>
              <p>
                {t(`onboarding.timeline.${entry.action.split('.').at(-1)}`)}
              </p>
              {entry.kind ? (
                <p>
                  {t(
                    `onboarding.kinds.${entry.kind.startsWith('recovery:') ? 'recovery' : entry.kind}`,
                  )}
                </p>
              ) : null}
              <UserName
                name={
                  entry.actor?.name ??
                  t(
                    entry.action.startsWith('onboarding.reminder.')
                      ? 'onboarding.timeline.system'
                      : 'onboarding.timeline.unknownActor',
                  )
                }
              />
              {entry.from ? (
                <p>
                  {t('onboarding.timeline.from')}:{' '}
                  <UserName name={entry.from.name} />
                </p>
              ) : null}
              {entry.to ? (
                <p>
                  {t('onboarding.timeline.to')}:{' '}
                  <UserName name={entry.to.name} />
                </p>
              ) : null}
              {entry.forced ? (
                <Badge variant='destructive'>{t('onboarding.forced')}</Badge>
              ) : null}
              {entry.parentCompleted ? (
                <p>{t('onboarding.timeline.parentCompleted')}</p>
              ) : null}
              {entry.accountEnabled ? (
                <p>{t('onboarding.timeline.accountEnabled')}</p>
              ) : null}
              {entry.assetReceiptId ? (
                <p className='break-all'>
                  {t('onboarding.fields.assetReceiptId')}:{' '}
                  {entry.assetReceiptId}
                </p>
              ) : null}
            </li>
          ))}
        </ol>
      ) : (
        <p>{t('onboarding.timeline.empty')}</p>
      )}
    </section>
  );
}
