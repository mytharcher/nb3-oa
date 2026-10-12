import { UserName } from '#components/user-name';
import {
  renderTimelineEntry,
  approvalStepsOf,
  approvalWord,
  type ApprovalText,
} from '@nocobase/app-plugin-approval/client';
import { useTranslation } from '@nocobase/i18n/client';
import { StatusBadge } from '#components/status-badge';
import type { ContractDetail } from './types.js';
import { dateLabel } from './model.js';
export function ContractHistory({ detail }: { detail: ContractDetail }) {
  const { t, i18n } = useTranslation();
  const text: ApprovalText = {
    t: (key, values) => t(key, values),
    name: (id) =>
      detail.knownUsers.find((p) => p.id === id)?.name ??
      t('approvals.unknownPerson'),
    stage: (key) =>
      t(`contracts.statuses.${key}`, { defaultValue: t('contracts.progress') }),
  };
  const steps = approvalStepsOf(detail.runs, detail.upcoming);
  const entries = detail.timeline.runs
    .flatMap((run) => [
      ...run.entries,
      ...run.stages.flatMap((stage) => stage.entries),
    ])
    .map((entry) => renderTimelineEntry(entry, text));
  return (
    <>
      <section className='flex flex-col gap-4'>
        <h2 className='text-base font-medium'>{t('contracts.progress')}</h2>
        <ol className='flex flex-col gap-4'>
          {steps.map((step) => (
            <li key={step.key} className='flex flex-col gap-2'>
              <p>
                {text.stage(step.stage, step.title)} ·{' '}
                <StatusBadge tone='neutral'>
                  {approvalWord(
                    text,
                    `stageState.${step.state}`,
                    t('contracts.progress'),
                  )}
                </StatusBadge>
              </p>
              <ul>
                {step.tasks.map((task) => (
                  <li key={task.id}>
                    <UserName name={text.name(task.assigneeId)} /> ·{' '}
                    {approvalWord(
                      text,
                      `taskStatus.${task.status}`,
                      t('contracts.progress'),
                    )}
                    {task.comment ? (
                      <p className='whitespace-pre-wrap break-words'>
                        {task.comment}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </section>
      <section className='flex flex-col gap-4'>
        <h2 className='text-base font-medium'>{t('contracts.timeline')}</h2>
        <ol className='flex flex-col gap-4'>
          {entries.map((line) => (
            <li key={line.key} className='flex flex-col gap-2'>
              <p>{line.title}</p>
              <time className='text-sm text-muted-foreground'>
                {dateLabel(line.at, i18n.language, detail.timeZone)}
              </time>
              {line.comment ? (
                <p className='whitespace-pre-wrap break-words'>
                  {line.comment}
                </p>
              ) : null}
              {line.details.map((d) => (
                <p
                  key={`${d.label}:${d.value}`}
                  className='text-sm text-muted-foreground'
                >
                  {d.label}: {d.value}
                </p>
              ))}
            </li>
          ))}
        </ol>
      </section>
    </>
  );
}
