import { Alert, AlertDescription } from '#components/ui/alert';
import { useState, useRef } from 'react';
import {
  Link,
  Outlet,
  useNavigate,
  useOutletContext,
  useParams,
} from 'react-router';
import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useBusinessResource } from '#hooks/use-business-resource';
import { createRequestKey } from '#lib/request-key';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { RouteFormPage } from '#components/route-form-page';
import { FormActions } from '#components/form-actions';
import { Button } from '#components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '#components/ui/card';
import { Input } from '#components/ui/input';
import { Field, FieldLabel, FieldGroup } from '#components/ui/field';
import { Checkbox } from '#components/ui/checkbox';
import { UserMultiPicker } from '#components/user-picker';
import { Failure, Loading } from '../work-items/states.js';
interface Group {
  id: string;
  title: string;
  leaderIds: string[];
  engineerIds: string[];
  categories: string[];
  active: boolean;
  version: number;
}
export default function Groups() {
  const health = useBusinessResource<{
    data: { configured: boolean; needsAttention: boolean };
  }>('itRepairs/diagnostics');
  const { t } = useTranslation(),
    r = useBusinessResource<{ data: Group[] }>('itRepairs/groups'),
    can = useCan({
      resource: { type: 'settings', id: 'oa.itRepairGroups' },
      action: 'update',
    });
  return (
    <>
      <PageContainer>
        <PageHeader
          title={t('itRepairs.groups')}
          actions={
            can.can ? (
              <>
                <Button variant='outline' render={<Link to='calendar' />}>
                  {t('itRepairs.calendar')}
                </Button>
                <Button render={<Link to='new' />}>
                  {t('itRepairs.newGroup')}
                </Button>
              </>
            ) : null
          }
        />
        {health.data &&
        (!health.data.data.configured || health.data.data.needsAttention) ? (
          <Alert variant='destructive'>
            <AlertDescription>
              {t('itRepairs.notificationIssue')}
            </AlertDescription>
          </Alert>
        ) : null}
        {r.loading ? (
          <Loading />
        ) : r.error ? (
          <Failure error={r.error} retry={r.reload} module='itRepairs' />
        ) : (
          r.data?.data.map((g) => (
            <Card key={g.id}>
              <CardHeader>
                <CardTitle>{g.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p>
                  {g.categories
                    .map((c) => t(`itRepairs.options.${c}`))
                    .join(', ')}
                </p>
                {can.can ? (
                  <div className='flex flex-wrap items-start gap-2'>
                    <Button variant='outline' render={<Link to={g.id} />}>
                      {t('itRepairs.edit')}
                    </Button>
                    {g.active && g.categories.length > 0 ? (
                      <RecoverRoutingButton group={g} />
                    ) : null}
                  </div>
                ) : null}
              </CardContent>
            </Card>
          ))
        )}
      </PageContainer>
      <Outlet context={{ groups: r.data?.data, reload: r.reload }} />
    </>
  );
}
export function RecoverRoutingButton({
  group,
}: {
  group: Pick<Group, 'id' | 'version'>;
}) {
  const api = useApiClient(),
    { t } = useTranslation();
  const keyRef = useRef(createRequestKey()),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(),
    [result, setResult] = useState<{ processed: number; hasMore: boolean }>();
  async function recover() {
    setBusy(true);
    setError(undefined);
    try {
      const response = await api.request<{
        data: { processed: number; hasMore: boolean };
      }>({
        method: 'POST',
        path: `itRepairs/groups/${encodeURIComponent(group.id)}/recoverRouting`,
        json: { requestKey: keyRef.current, expectedVersion: group.version },
      });
      setResult(response.data);
      keyRef.current = createRequestKey();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className='flex flex-col gap-2'>
      <Button variant='outline' disabled={busy} onClick={() => void recover()}>
        {t(busy ? 'itRepairs.working' : 'itRepairs.recoverRouting')}
      </Button>
      {result ? (
        <p role='status' className='text-sm text-muted-foreground'>
          {t(
            result.hasMore
              ? 'itRepairs.recoveryMore'
              : 'itRepairs.recoveryDone',
            { count: result.processed },
          )}
        </p>
      ) : null}
      {error ? <Failure error={error} module='itRepairs' /> : null}
    </div>
  );
}
export function GroupForm() {
  const { groupId } = useParams(),
    ctx = useOutletContext<{ groups?: Group[]; reload: () => void }>();
  if (!ctx.groups) return <Loading />;
  const old = ctx.groups.find((g) => g.id === groupId);
  return (
    <GroupEditor key={`${groupId ?? 'new'}:${old?.version ?? 0}`} old={old} />
  );
}
function GroupEditor({ old }: { old?: Group }) {
  const { groupId } = useParams(),
    { t } = useTranslation(),
    api = useApiClient(),
    navigate = useNavigate(),
    ctx = useOutletContext<{ groups?: Group[]; reload: () => void }>();
  const [g, setG] = useState<Group>(
      () =>
        old ?? {
          id: groupId ?? '',
          title: '',
          leaderIds: [],
          engineerIds: [],
          categories: [],
          active: true,
          version: 0,
        },
    ),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(),
    [key, setKey] = useState(createRequestKey);
  const patch = (change: Partial<Group>) => {
    setG({ ...g, ...change });
    setKey(createRequestKey());
  };
  async function save() {
    setBusy(true);
    setError(undefined);
    try {
      const { id, version, title, leaderIds, engineerIds, categories, active } =
        g;
      await api.request({
        method: 'POST',
        path: `itRepairs/groups/${encodeURIComponent(id)}`,
        json: {
          title,
          leaderIds,
          engineerIds,
          categories,
          active,
          requestKey: key,
          expectedVersion: version,
        },
      });
      ctx.reload();
      void navigate('..');
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <RouteFormPage title={t('itRepairs.groups')} beforeClose={() => !busy}>
      <PageContainer>
        {busy ? <p role='status'>{t('itRepairs.working')}</p> : null}
        {error ? <Failure error={error} module='itRepairs' /> : null}
        <form
          id='repair-group-form'
          onSubmit={(event) => {
            event.preventDefault();
            void save();
          }}
        >
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor='group-id'>
                {t('itRepairs.groupCode')}
              </FieldLabel>
              <Input
                id='group-id'
                value={g.id}
                disabled={busy || !!old}
                onChange={(e) => patch({ id: e.target.value })}
              />
            </Field>
            <Field>
              <FieldLabel htmlFor='group-title'>
                {t('itRepairs.titleField')}
              </FieldLabel>
              <Input
                id='group-title'
                value={g.title}
                disabled={busy}
                onChange={(e) => patch({ title: e.target.value })}
              />
            </Field>
            {(['leaderIds', 'engineerIds'] as const).map((field) => (
              <Field key={field}>
                <FieldLabel htmlFor={`group-${field}`}>
                  {t(`itRepairs.${field}`)}
                </FieldLabel>
                <UserMultiPicker
                  searchPath='itRepairs/groupCandidates'
                  id={`group-${field}`}
                  disabled={busy}
                  value={g[field]}
                  onChange={(ids) => patch({ [field]: ids })}
                />
              </Field>
            ))}
            {['device', 'network', 'software', 'account', 'other'].map((c) => (
              <Field key={c} orientation='horizontal'>
                <Checkbox
                  id={`group-${c}`}
                  disabled={busy}
                  checked={g.categories.includes(c)}
                  onCheckedChange={(checked) =>
                    patch({
                      categories: checked
                        ? [...g.categories, c]
                        : g.categories.filter((v) => v !== c),
                    })
                  }
                />
                <FieldLabel htmlFor={`group-${c}`}>
                  {t(`itRepairs.options.${c}`)}
                </FieldLabel>
              </Field>
            ))}
            <Field orientation='horizontal'>
              <Checkbox
                id='group-active'
                checked={g.active}
                disabled={busy}
                onCheckedChange={(active) => patch({ active: !!active })}
              />
              <FieldLabel htmlFor='group-active'>
                {t('itRepairs.active')}
              </FieldLabel>
            </Field>
          </FieldGroup>
        </form>
        <FormActions>
          <Button
            disabled={busy || !g.id || !g.title}
            type='submit'
            form='repair-group-form'
          >
            {t('itRepairs.saveConfiguration')}
          </Button>
        </FormActions>
      </PageContainer>
    </RouteFormPage>
  );
}
