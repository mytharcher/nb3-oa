import {
  rolesOf,
  workspaceRows,
  useCommonLinks,
  type ContextResource,
  type Workspace,
  type Destination,
} from './role-workspace-data.js';
import { useId, useState } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import { Link, useLocation, useNavigate } from 'react-router';
import { ArrowRight, ClipboardCheck, FolderOpen } from 'lucide-react';
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardFooter,
} from '#components/ui/card';
import { Button } from '#components/ui/button';
import { Skeleton } from '#components/ui/skeleton';
import {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
} from '#components/ui/empty';
import {
  functionalRequestActions,
  type RequestActionAvailability,
} from '#components/request-action-definitions';
import { ErrorState } from '../approvals/states.js';
import type { CenterRecord } from '../approvals/use-center-resource.js';
import { WorkRow } from './work-row.js';
import { byUrgency } from './record-presentation.js';

export function PendingWork({
  context,
  pending,
  loading,
  error,
  total,
  now,
  retry,
  allClear,
  canSubmit,
}: {
  context: ContextResource;
  pending: CenterRecord[];
  loading: boolean;
  error: unknown;
  total: number | undefined;
  now: Date;
  retry: () => void;
  allClear: boolean;
  canSubmit: boolean;
}) {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const roles = rolesOf(context);
  const requested = new URLSearchParams(location.search).get('workbenchRole');
  const selected =
    roles.length > 1 && roles.some((role) => role === requested)
      ? (requested as Workspace)
      : 'all';
  const filtered =
    selected === 'all'
      ? pending
      : workspaceRows(selected, pending, context.data?.teamUserIds ?? []);
  const rows = filtered
    .filter(
      (row, index) =>
        filtered.findIndex(
          (other) => other.kind === row.kind && other.id === row.id,
        ) === index,
    )
    .sort(byUrgency)
    .slice(0, 6);
  const changeRole = (role: string) => {
    const query = new URLSearchParams(location.search);
    if (role === 'all') query.delete('workbenchRole');
    else query.set('workbenchRole', role);
    void navigate(
      {
        pathname: location.pathname,
        search: query.toString(),
        hash: location.hash,
      },
      { replace: true },
    );
  };
  return (
    <Card className='min-w-0'>
      <CardHeader className='flex flex-wrap items-center justify-between gap-2'>
        <CardTitle>
          <h2>{t('workbench.attention')}</h2>
        </CardTitle>
        <Link
          to='/approvals/todo'
          className='inline-flex items-center gap-1 rounded-sm text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-ring'
        >
          {t('workbench.viewPending')}
          <ArrowRight className='size-4' aria-hidden='true' />
        </Link>
      </CardHeader>
      <CardContent className='flex flex-col gap-4'>
        {roles.length > 1 ? (
          <div
            role='group'
            aria-label={t('workbench.roleFilter')}
            className='flex flex-wrap gap-1'
          >
            {(['all', ...roles] as const).map((role) => (
              <Button
                key={role}
                variant={selected === role ? 'secondary' : 'ghost'}
                size='sm'
                aria-pressed={selected === role}
                onClick={() => changeRole(role)}
              >
                {t(
                  role === 'all'
                    ? 'workbench.allRoles'
                    : `workbench.roleLabels.${role}`,
                )}
              </Button>
            ))}
          </div>
        ) : null}
        {context.error ? (
          <ErrorState
            context='query'
            error={context.error}
            retry={context.reload}
          />
        ) : null}
        {error ? (
          <ErrorState context='query' error={error} retry={retry} />
        ) : rows.length ? (
          <ul className='flex flex-col'>
            {rows.map((record) => (
              <WorkRow
                key={`${record.kind}:${record.id}`}
                record={record}
                now={now}
                showInitiator
                showApplicant
              />
            ))}
          </ul>
        ) : loading ? (
          <div
            aria-label={t('workbench.loading')}
            className='flex flex-col gap-3'
          >
            {[0, 1, 2].map((key) => (
              <Skeleton key={key} className='h-12 w-full' />
            ))}
          </div>
        ) : (
          <Empty className='min-h-40 border border-dashed'>
            <EmptyHeader>
              <EmptyMedia variant='icon'>
                <ClipboardCheck />
              </EmptyMedia>
              <EmptyTitle>
                {t(
                  selected !== 'all'
                    ? 'workbench.filteredEmpty'
                    : allClear
                      ? 'workbench.allClear'
                      : 'workbench.emptyAttention',
                )}
              </EmptyTitle>
              <EmptyDescription>
                {t(
                  selected !== 'all'
                    ? 'workbench.previewHint'
                    : canSubmit
                      ? 'workbench.allClearDescription'
                      : 'workbench.emptyMineRestricted',
                )}
              </EmptyDescription>
            </EmptyHeader>
            {selected !== 'all' ? (
              <EmptyContent>
                <Button variant='outline' onClick={() => changeRole('all')}>
                  {t('workbench.allRoles')}
                </Button>
              </EmptyContent>
            ) : null}
          </Empty>
        )}
        {!error &&
        rows.length > 0 &&
        (selected !== 'all' || (total ?? 0) > rows.length) ? (
          <p className='text-xs text-muted-foreground'>
            {t('workbench.previewHint')}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

const shortcutClass =
  'inline-flex min-w-0 items-center gap-2 rounded-md px-2 py-2 text-sm text-foreground underline-offset-4 hover:bg-muted focus-visible:outline-2 focus-visible:outline-ring';

export function CommonWorkLinks({ context }: { context: ContextResource }) {
  const { t } = useTranslation();
  const links = useCommonLinks(context);
  const [expanded, setExpanded] = useState(false);
  const extraId = useId();
  if (!links.length) return null;
  const renderLink = (item: Destination) => (
    <li key={item.to}>
      <Link className={shortcutClass} to={item.to}>
        <FolderOpen
          className='size-4 shrink-0 text-muted-foreground'
          aria-hidden='true'
        />
        <span className='break-words'>{t(item.label)}</span>
      </Link>
    </li>
  );
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{t('workbench.commonLinks')}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent className='flex flex-col gap-2'>
        <ul className='grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6'>
          {links.slice(0, 6).map(renderLink)}
        </ul>
        <ul
          id={extraId}
          hidden={!expanded}
          className={
            expanded
              ? 'grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-6'
              : 'hidden'
          }
        >
          {links.slice(6).map(renderLink)}
        </ul>
      </CardContent>
      {links.length > 6 ? (
        <CardFooter>
          <Button
            variant='ghost'
            size='sm'
            aria-controls={extraId}
            aria-expanded={expanded}
            onClick={() => setExpanded((value) => !value)}
          >
            {t(expanded ? 'workbench.lessLinks' : 'workbench.moreLinks')}
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  );
}

export function FunctionalRequestLinks({
  context,
  available,
}: {
  context: ContextResource;
  available: RequestActionAvailability;
}) {
  const { t } = useTranslation();
  const location = useLocation();
  const roles = rolesOf(context);
  const actions = functionalRequestActions.filter(
    (action) =>
      available[action.key] &&
      (action.key === 'recruitment'
        ? roles.includes('manager') || roles.includes('hr')
        : roles.includes('finance')),
  );
  if (!actions.length) return null;
  return (
    <section
      aria-label={t('workbench.functionalRequests')}
      className='flex flex-col gap-2 border-t pt-4'
    >
      <h3 className='text-sm font-medium text-muted-foreground'>
        {t('workbench.functionalRequests')}
      </h3>
      <ul className='flex flex-wrap gap-2'>
        {actions.map((action) => (
          <li key={action.key}>
            <Link
              className={shortcutClass}
              to={{
                pathname: action.to,
                search: location.search,
                hash: location.hash,
              }}
            >
              <action.icon
                className='size-4 text-muted-foreground'
                aria-hidden='true'
              />
              {t(action.label)}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
