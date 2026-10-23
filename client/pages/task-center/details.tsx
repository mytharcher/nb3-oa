import {
  createElement,
  useState,
  type ComponentType,
  type ReactElement,
} from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import { Button } from '#components/ui/button';
import { Field, FieldError, FieldLabel } from '#components/ui/field';
import { Spinner } from '#components/ui/spinner';
import { Textarea } from '#components/ui/textarea';
import {
  TaskDetailBody,
  TaskDetailFooter,
} from '#extensions/nocobase-task-center-ui/index';
import type { PrototypeTask, TaskStatus } from './prototype-data.js';
import { TaskSummary } from './summaries.js';

export interface TaskDetailProps {
  readonly task: PrototypeTask;
  /** Reports the outcome; the page updates the task, closes the drawer and shows the message. */
  readonly onDone: (message: string, status?: TaskStatus) => void;
  readonly onBusyChange: (busy: boolean) => void;
}

/**
 * Drawer content contributed per source. In production each business module registers its own: it loads the full
 * record, renders its handling form and calls its own API. The prototype only simulates the submission.
 */
const details: Readonly<Record<string, ComponentType<TaskDetailProps>>> = {
  'approval.task': ApprovalDetail,
  'approval.mine': singleAction(
    'taskCenter.detail.withdraw',
    'taskCenter.detail.withdrawn',
    'cancelled',
    'outline',
  ),
  'approval.cc': singleAction(
    'taskCenter.detail.markRead',
    'taskCenter.detail.markedRead',
    'completed',
  ),
  'oa.workItem': singleAction(
    'taskCenter.detail.complete',
    'taskCenter.detail.completed',
    'completed',
  ),
};

/** Renders the drawer content the task's source contributes, or nothing. */
export function TaskDetail(props: TaskDetailProps): ReactElement | null {
  const detail = details[props.task.sourceType];
  return detail ? createElement(detail, props) : null;
}

function simulate(): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, 600));
}

function TaskRecord({ task }: { readonly task: PrototypeTask }): ReactElement {
  const { t } = useTranslation();
  return (
    <>
      <TaskSummary task={task} />
      <p className='text-sm text-muted-foreground'>
        {t('taskCenter.detail.noDetail')}
      </p>
    </>
  );
}

function ApprovalDetail({
  onBusyChange,
  onDone,
  task,
}: TaskDetailProps): ReactElement {
  const { t } = useTranslation();
  const [comment, setComment] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [running, setRunning] = useState<'approve' | 'reject'>();
  const open = task.status === 'pending';
  const run = (kind: 'approve' | 'reject'): void => {
    if (kind === 'reject' && !comment.trim()) {
      setInvalid(true);
      return;
    }
    setRunning(kind);
    onBusyChange(true);
    void simulate().then(() => {
      onBusyChange(false);
      setRunning(undefined);
      onDone(
        t(
          kind === 'approve'
            ? 'taskCenter.detail.approved'
            : 'taskCenter.detail.rejected',
          { name: task.title },
        ),
        'completed',
      );
    });
  };
  return (
    <>
      <TaskDetailBody>
        <TaskRecord task={task} />
        {open ? (
          <Field data-invalid={invalid || undefined}>
            <FieldLabel htmlFor='task-center-comment'>
              {t('taskCenter.detail.comment')}
            </FieldLabel>
            <Textarea
              id='task-center-comment'
              value={comment}
              aria-invalid={invalid || undefined}
              placeholder={t('taskCenter.detail.commentPlaceholder')}
              onChange={(event) => {
                setComment(event.target.value);
                setInvalid(false);
              }}
            />
            {invalid ? (
              <FieldError>{t('taskCenter.detail.commentRequired')}</FieldError>
            ) : null}
          </Field>
        ) : null}
      </TaskDetailBody>
      {open ? (
        <TaskDetailFooter>
          <Button
            variant='outline'
            disabled={Boolean(running)}
            onClick={() => run('reject')}
          >
            {running === 'reject' ? <Spinner data-icon='inline-start' /> : null}
            {t('taskCenter.detail.reject')}
          </Button>
          <Button disabled={Boolean(running)} onClick={() => run('approve')}>
            {running === 'approve' ? (
              <Spinner data-icon='inline-start' />
            ) : null}
            {t('taskCenter.detail.approve')}
          </Button>
        </TaskDetailFooter>
      ) : null}
    </>
  );
}

/** A type whose only action finishes the task, such as withdrawing one's own request. */
function singleAction(
  label: string,
  done: string,
  status: TaskStatus,
  variant: 'default' | 'outline' = 'default',
): ComponentType<TaskDetailProps> {
  return function SingleActionDetail({
    onBusyChange,
    onDone,
    task,
  }: TaskDetailProps): ReactElement {
    const { t } = useTranslation();
    const [running, setRunning] = useState(false);
    return (
      <>
        <TaskDetailBody>
          <TaskRecord task={task} />
        </TaskDetailBody>
        {task.status === 'pending' ? (
          <TaskDetailFooter>
            <Button
              variant={variant}
              disabled={running}
              onClick={() => {
                setRunning(true);
                onBusyChange(true);
                void simulate().then(() => {
                  onBusyChange(false);
                  setRunning(false);
                  onDone(t(done, { name: task.title }), status);
                });
              }}
            >
              {running ? <Spinner data-icon='inline-start' /> : null}
              {t(label)}
            </Button>
          </TaskDetailFooter>
        ) : null}
      </>
    );
  };
}
