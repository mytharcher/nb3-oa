import { FormActions } from '#components/form-actions';
import { useRouteFormCloseGuard } from '#hooks/use-route-form-close-guard';
import { useState, useRef, useMemo } from 'react';
import {
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
} from 'react-router';
import {
  useApiClient,
  useToaster,
  useNavigationGuard,
} from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { RouteFormPage } from '#components/route-form-page';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { Button } from '#components/ui/button';
import { Badge } from '#components/ui/badge';
import { Checkbox } from '#components/ui/checkbox';
import { Card, CardContent } from '#components/ui/card';
import { Spinner } from '#components/ui/spinner';
import { Input } from '#components/ui/input';
import { Field, FieldLabel } from '#components/ui/field';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import { permissionModules } from '../administration/authorization/pages/permission-sets/permission-modules.js';
import { ConfirmDialog } from '../administration/authorization/components/confirm-dialog.js';
import { titleText } from '../administration/authorization/i18n.js';
import { useCatalog, useSnapshot } from './hooks.js';
import { operationSummary, sensitiveSummary } from './model.js';
import { Blank, ErrorState, Loading } from './ui.js';
import type { AccessSnapshot, AuthorizationOptions } from './types.js';
export default function AssignPage() {
  const { t: drawerTitle } = useTranslation();
  const location = useLocation();
  const parent = useOutletContext<{ reload: () => void }>();
  const snapshot = useSnapshot(true);
  const catalog = useCatalog();
  return (
    <RouteFormPage
      className='sm:max-w-4xl'
      title={drawerTitle('access.assign')}
    >
      {snapshot.error || catalog.error ? (
        <ErrorState
          error={snapshot.error ?? catalog.error}
          backTo={`${location.pathname.replace(/\/assign$/, '')}${location.search}`}
          onBack={parent?.reload}
          retry={() => {
            snapshot.reload();
            catalog.reload();
          }}
        />
      ) : snapshot.data && catalog.options ? (
        <AssignmentForm
          key={snapshot.data.revision}
          snapshot={snapshot.data}
          options={catalog.options}
          reloadSnapshot={snapshot.reload}
        />
      ) : (
        <Loading />
      )}
    </RouteFormPage>
  );
}
function AssignmentForm({
  snapshot,
  options,
  reloadSnapshot,
}: {
  snapshot: AccessSnapshot;
  options: AuthorizationOptions;
  reloadSnapshot: () => void;
}) {
  const { type, id, userId } = useParams();
  const subject = {
    type: userId ? 'user' : (type ?? ''),
    id: userId ?? id ?? '',
  };
  const { name, reload, assignmentsSaved } = useOutletContext<{
    name: string;
    reload: () => void;
    assignmentsSaved?: (data: AccessSnapshot) => void | Promise<void>;
  }>();
  const { t, i18n } = useTranslation();
  const api = useApiClient();
  const toaster = useToaster();
  const navigate = useNavigate();
  const location = useLocation();
  const before = snapshot.assignments
    .filter(
      (entry) =>
        entry.subject.type === subject.type && entry.subject.id === subject.id,
    )
    .map((entry) => entry.permissionSet);
  const choices = snapshot.sets.filter(
    (set) =>
      (!set.protection ||
        (set.protection.allow.includes('assign') &&
          set.protection.allow.includes('revoke'))) &&
      (!set.protection?.assignableTo ||
        set.protection.assignableTo.includes(subject.type)),
  );
  const managed = choices.map((set) => set.key);
  const [selected, setSelected] = useState(
    before.filter((key) => managed.includes(key)),
  );
  const [query, setQuery] = useState('');
  const [module, setModule] = useState('all');
  const [onlySelected, setOnlySelected] = useState(false);
  const modules = options.sections.flatMap((section) =>
    section.subsections.flatMap((subsection) => {
      const groups = permissionModules(
        subsection.groups,
        subsection.resources,
        () => t('access.otherModules'),
      );
      return (
        groups.length
          ? groups.filter((group) => group.value !== 'all')
          : [
              {
                value: 'section',
                label: subsection.label,
                resources: subsection.resources,
              },
            ]
      ).map((group) => ({
        ...group,
        value: JSON.stringify([section.value, subsection.value, group.value]),
      }));
    }),
  );
  const belongsTo = (
    set: (typeof choices)[number],
    group: (typeof modules)[number],
  ) =>
    set.grants.some((grant) =>
      group.resources.some(
        (resource) =>
          grant.resource.type === resource.type &&
          (grant.resource.id === '*' || grant.resource.id === resource.value),
      ),
    );
  const moduleChoices = [
    { value: 'all', label: t('access.allModules') },
    ...modules.filter((group) => choices.some((set) => belongsTo(set, group))),
    { value: 'other', label: t('access.otherModules') },
  ];
  const summaries = useMemo(
    () =>
      new Map(
        snapshot.sets.map((set) => [
          set.key,
          operationSummary(options, set, (label, value) =>
            t('access.labelValue', { label, value }),
          ),
        ]),
      ),
    [snapshot.sets, options, t],
  );
  const visible = choices.filter((set) => {
    const inModule =
      module === 'all' ||
      (module === 'other'
        ? !modules.some((group) => belongsTo(set, group))
        : modules.some(
            (group) => group.value === module && belongsTo(set, group),
          ));
    return (
      inModule &&
      (!onlySelected || selected.includes(set.key)) &&
      [titleText(set.title, t), ...(summaries.get(set.key) ?? [])]
        .join(' ')
        .toLocaleLowerCase()
        .includes(query.trim().toLocaleLowerCase())
    );
  });
  const changed = managed.filter(
    (key) => before.includes(key) !== selected.includes(key),
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [confirm, setConfirm] = useState(false);
  const [discard, setDiscard] = useState(false);
  const allowLeaveRef = useRef(false);
  useRouteFormCloseGuard(() => {
    if (busy) return false;
    if (allowLeaveRef.current || !changed.length) return true;
    setDiscard(true);
    return false;
  });
  useNavigationGuard(
    () =>
      allowLeaveRef.current ||
      (!busy && (!changed.length || window.confirm(t('access.discardHelp')))),
  );
  const close = () => {
    allowLeaveRef.current = true;
    void navigate(`..${location.search}`, { relative: 'path' });
  };
  async function save() {
    setBusy(true);
    setError(undefined);
    try {
      const saved = await api.request<{ data: AccessSnapshot }>({
        path: `access/subjects/${encodeURIComponent(subject.type)}/${encodeURIComponent(subject.id)}/assignments`,
        method: 'PUT',
        json: {
          expectedRevision: snapshot.revision,
          managedPermissionSets: managed,
          permissionSets: selected,
        },
      });
      if (assignmentsSaved) await assignmentsSaved(saved.data);
      else reload();
      close();
      toaster.show({ type: 'success', title: t('access.saved', { name }) });
    } catch (cause) {
      setError(cause);
      setConfirm(false);
    } finally {
      setBusy(false);
    }
  }
  return (
    <PageContainer>
      <PageHeader
        title={t('access.assignTitle', { name })}
        description={t('access.assignHelp')}
      />
      <p className='text-sm text-muted-foreground'>
        {t('access.assignmentChoicesHelp')}
      </p>
      <div className='flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end'>
        <Field className='flex-1'>
          <FieldLabel htmlFor='assignment-search'>
            {t('access.assignmentSearch')}
          </FieldLabel>
          <Input
            id='assignment-search'
            value={query}
            onChange={(event) => setQuery(event.target.value)}
          />
        </Field>
        <Field className='sm:w-56'>
          <FieldLabel htmlFor='assignment-module'>
            {t('access.businessModules')}
          </FieldLabel>
          <Select
            items={moduleChoices}
            value={module}
            onValueChange={(value) => {
              if (value) setModule(value);
            }}
          >
            <SelectTrigger id='assignment-module' className='w-full'>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectGroup>
                {moduleChoices.map((group) => (
                  <SelectItem key={group.value} value={group.value}>
                    {group.label}
                  </SelectItem>
                ))}
              </SelectGroup>
            </SelectContent>
          </Select>
        </Field>
        <Field orientation='horizontal' className='w-auto'>
          <Checkbox
            id='assignment-selected'
            checked={onlySelected}
            onCheckedChange={(checked) => setOnlySelected(checked === true)}
          />
          <FieldLabel htmlFor='assignment-selected'>
            {t('access.assignmentOnlySelected')}
          </FieldLabel>
        </Field>
        {query || module !== 'all' || onlySelected ? (
          <Button
            variant='ghost'
            onClick={() => {
              setQuery('');
              setModule('all');
              setOnlySelected(false);
            }}
          >
            {t('access.clear')}
          </Button>
        ) : null}
      </div>
      <p className='text-sm text-muted-foreground' role='status'>
        {t('access.assignmentCount', {
          visible: visible.length,
          total: choices.length,
          selected: selected.length,
        })}
      </p>
      {error ? (
        <ErrorState
          error={error}
          retry={reloadSnapshot}
          backTo={`${location.pathname.replace(/\/assign$/, '')}${location.search}`}
          onBack={reload}
        />
      ) : null}
      {visible.length ? (
        <div className='flex flex-col gap-4'>
          {visible.map((set) => (
            <Card key={set.key}>
              <CardContent className='flex gap-3'>
                <Checkbox
                  id={`assign-${set.key}`}
                  checked={selected.includes(set.key)}
                  disabled={busy}
                  onCheckedChange={(checked) =>
                    setSelected((value) =>
                      checked
                        ? [...value, set.key]
                        : value.filter((key) => key !== set.key),
                    )
                  }
                />
                <label
                  htmlFor={`assign-${set.key}`}
                  className='flex min-w-0 flex-col gap-2'
                >
                  <span className='font-medium'>
                    {titleText(set.title, t, t('access.permissions'))}
                  </span>
                  <span className='flex flex-wrap gap-2'>
                    {[
                      ...new Set(
                        set.grants.map((grant) =>
                          grant.resource.type === 'page'
                            ? 'pageAccess'
                            : grant.resource.type === 'composite'
                              ? 'assignmentBusiness'
                              : 'assignmentOther',
                        ),
                      ),
                    ].map((kind) => (
                      <Badge key={kind} variant='secondary'>
                        {t(`access.${kind}`)}
                      </Badge>
                    ))}
                  </span>
                  {sensitiveSummary(options, set).length ? (
                    <span className='text-sm'>
                      <Badge variant='outline'>{t('access.sensitive')}</Badge>{' '}
                      {sensitiveSummary(options, set).join(
                        i18n.language.startsWith('zh') ? '、' : ', ',
                      )}
                    </span>
                  ) : null}
                  <span className='text-sm text-muted-foreground'>
                    {set.unrestricted
                      ? t('access.unrestricted')
                      : summaries
                          .get(set.key)
                          ?.join(
                            i18n.language.startsWith('zh') ? '、' : ', ',
                          ) || t('access.special')}
                  </span>
                </label>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Blank
          title={t(choices.length ? 'access.noResults' : 'access.noAssignable')}
          description={t(
            choices.length ? 'access.clearHelp' : 'access.noneHelp',
          )}
        />
      )}
      <p className='text-sm text-muted-foreground'>
        {t('access.preserveInherited')}
      </p>
      <FormActions>
        <Button
          variant='outline'
          disabled={busy}
          onClick={() => (changed.length ? setDiscard(true) : close())}
        >
          {t('access.cancel')}
        </Button>
        <Button
          disabled={busy || !changed.length}
          onClick={() => setConfirm(true)}
        >
          {busy ? <Spinner /> : null}
          {t('access.save')}
        </Button>
      </FormActions>
      <ConfirmDialog
        open={confirm}
        title={t('access.confirmTitle', { name })}
        variant='default'
        confirmLabel={t('access.save')}
        cancelLabel={t('access.cancel')}
        busy={busy}
        onCancel={() => setConfirm(false)}
        onConfirm={() => void save()}
      >
        {subject.type === 'user' ? (
          <span className='block'>{t('access.preferRoles')}</span>
        ) : null}
        {t('access.assignmentImpact')}
        <span className='block mt-2'>
          {changed
            .map((key) =>
              t('access.labelValue', {
                label: `${selected.includes(key) ? '+' : '−'} ${titleText(snapshot.sets.find((set) => set.key === key)?.title, t)}`,
                value: operationSummary(
                  options,
                  snapshot.sets.find((set) => set.key === key)!,
                  (label, value) => t('access.labelValue', { label, value }),
                ).join(i18n.language.startsWith('zh') ? '、' : ', '),
              }),
            )
            .join(i18n.language.startsWith('zh') ? '；' : '; ')}
        </span>
      </ConfirmDialog>
      <ConfirmDialog
        open={discard}
        title={t('access.discardTitle')}
        confirmLabel={t('access.discard')}
        cancelLabel={t('access.cancel')}
        onCancel={() => setDiscard(false)}
        onConfirm={close}
      >
        {t('access.discardHelp')}
      </ConfirmDialog>
    </PageContainer>
  );
}
