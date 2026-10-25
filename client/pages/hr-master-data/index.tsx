import { useState } from 'react';
import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import type { ColumnDef } from '@tanstack/react-table';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { DataTableServer } from '#components/data-table/server-table';
import { UserPicker } from '#components/user-picker';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import { Label } from '#components/ui/label';
import { Textarea } from '#components/ui/textarea';
import { Alert, AlertDescription } from '#components/ui/alert';
import { Dialog, DialogTitle } from '#components/ui/dialog';
import {
  FormDrawerContent,
  FormDrawerHeader,
  FormDrawerBody,
  FormDrawerFooter,
} from '#components/form-drawer';
import { useResource } from '../approvals/use-resource.js';
import { ErrorState } from '../approvals/states.js';
type Source = {
  id: string;
  name: string;
  principalId: string;
  active: boolean;
};
type Run = {
  id: string;
  source: string;
  eventId: string;
  state: string;
  reasonCode: string | null;
  itemCount: number;
  updatedAt: string;
};
type Mapping = {
  id: string;
  entity: string;
  externalId: string;
  localId: string;
  revision: number;
};
export default function HrMasterDataPage() {
  const { t } = useTranslation(),
    api = useApiClient();
  const manage = useCan({
    resource: { type: 'settings', id: 'oa.hrMasterData' },
    action: 'manage',
  }).can;
  const sync = useCan({
    resource: { type: 'settings', id: 'oa.hrMasterData' },
    action: 'sync',
  }).can;
  const sources = useResource<Source[]>('hrMasterData/sources');
  const [selected, setSelected] = useState(''),
    [editing, setEditing] = useState<Source | null>(),
    [reclaim, setReclaim] = useState<Mapping>(),
    [reason, setReason] = useState(''),
    [mappingSearch, setMappingSearch] = useState(''),
    [error, setError] = useState<unknown>(),
    [busy, setBusy] = useState(false),
    [page, setPage] = useState(0);
  const active =
    sources.data?.find((row) => row.id === selected) ?? sources.data?.[0];
  const runs = useResource<Run[]>(active ? 'hrMasterData/batches' : null, {
    source: active?.id ?? '',
  });
  const mappings = useResource<Mapping[]>(
    active && manage ? 'hrMasterData/mappings' : null,
    {
      source: active?.id ?? '',
      ...(mappingSearch ? { externalId: mappingSearch } : {}),
    },
  );
  async function mutate(
    path: string,
    json: unknown,
    method: 'POST' | 'PUT' = 'POST',
  ) {
    setBusy(true);
    setError(undefined);
    try {
      await api.request({ path, method, json });
      sources.reload();
      runs.reload();
      mappings.reload();
      return true;
    } catch (error) {
      setError(error);
      return false;
    } finally {
      setBusy(false);
    }
  }
  const failure =
    error instanceof ApiClientError && error.reason === 'LOCAL_CHANGE_CONFLICT'
      ? t('hrMasterData.localConflict')
      : t('hrMasterData.failed');
  const columns: ColumnDef<Run>[] = [
    {
      id: 'summary',
      header: t('hrMasterData.recent'),
      cell: ({ row }) => (
        <div className='flex min-w-0 flex-col gap-1'>
          <span className='font-medium break-all'>{row.original.eventId}</span>
          <span>
            {t(`hrMasterData.states.${row.original.state}`)} ·{' '}
            {t('hrMasterData.items', { count: row.original.itemCount })}
          </span>
          <span className='text-sm text-muted-foreground'>
            {new Date(row.original.updatedAt).toLocaleString()}
          </span>
          {row.original.reasonCode ? (
            <p className='text-sm text-destructive'>
              {row.original.reasonCode === 'LOCAL_CHANGE_CONFLICT'
                ? t('hrMasterData.localConflict')
                : t('hrMasterData.businessConflict')}
            </p>
          ) : null}
        </div>
      ),
    },
    {
      id: 'actions',
      header: t('hrMasterData.actions'),
      cell: ({ row }) =>
        row.original.state === 'failed' && sync ? (
          <Button
            size='sm'
            variant='outline'
            disabled={busy}
            onClick={() =>
              void mutate(`hrMasterData/batches/${row.original.id}/replay`, {})
            }
          >
            {t('hrMasterData.replay')}
          </Button>
        ) : null,
    },
  ];
  return (
    <PageContainer>
      <PageHeader
        title={t('hrMasterData.title')}
        description={t('hrMasterData.description')}
        actions={
          manage ? (
            <Button onClick={() => setEditing(null)}>
              {t('hrMasterData.addSource')}
            </Button>
          ) : undefined
        }
      />
      {sources.error ? (
        <ErrorState error={sources.error} retry={sources.reload} />
      ) : null}
      {error ? (
        <Alert variant='destructive'>
          <AlertDescription>{failure}</AlertDescription>
        </Alert>
      ) : null}
      <div className='flex flex-wrap gap-2'>
        {sources.data?.map((row) => (
          <Button
            key={row.id}
            variant={active?.id === row.id ? 'default' : 'outline'}
            onClick={() => {
              setSelected(row.id);
              setPage(0);
              setError(undefined);
            }}
          >
            {row.name} ·{' '}
            {t(row.active ? 'hrMasterData.enabled' : 'hrMasterData.disabled')}
          </Button>
        ))}
      </div>
      {!sources.loading && !sources.data?.length ? (
        <p className='text-muted-foreground'>{t('hrMasterData.noSources')}</p>
      ) : null}
      {active ? (
        <>
          <div className='flex flex-wrap items-center gap-2'>
            <h2 className='text-lg font-semibold'>{active.name}</h2>
            <Button
              variant='outline'
              onClick={() => {
                sources.reload();
                runs.reload();
                mappings.reload();
              }}
            >
              {t('hrMasterData.refresh')}
            </Button>
            {manage ? (
              <Button variant='outline' onClick={() => setEditing(active)}>
                {t('hrMasterData.editSource')}
              </Button>
            ) : null}
          </div>
          <p className='text-sm text-muted-foreground'>
            {t('hrMasterData.latest')}
          </p>
          {runs.error ? (
            <ErrorState error={runs.error} retry={runs.reload} />
          ) : null}
          <DataTableServer
            columns={columns}
            rows={(runs.data ?? []).slice(page * 10, page * 10 + 10)}
            total={runs.data?.length ?? 0}
            getRowId={(row) => row.id}
            pagination={{ pageIndex: page, pageSize: 10 }}
            pageSizeOptions={[10]}
            onPaginationChange={(value) => setPage(value.pageIndex)}
            emptyMessage={t('hrMasterData.noRuns')}
          />
          {manage ? (
            <section className='flex flex-col gap-3'>
              <h2 className='text-lg font-semibold'>
                {t('hrMasterData.mappings')}
              </h2>
              <p className='text-sm text-muted-foreground'>
                {t('hrMasterData.reclaimHelp')}
              </p>
              <Label htmlFor='hr-mapping-search'>
                {t('hrMasterData.mappingSearch')}
              </Label>
              <Input
                id='hr-mapping-search'
                value={mappingSearch}
                onChange={(e) => setMappingSearch(e.target.value)}
              />
              {mappings.error ? (
                <ErrorState error={mappings.error} retry={mappings.reload} />
              ) : null}
              {mappings.data?.map((row) => (
                <div
                  key={row.id}
                  className='flex flex-wrap items-center justify-between gap-2 rounded-lg border p-3'
                >
                  <span className='min-w-0 break-all'>
                    {t(`hrMasterData.entities.${row.entity}`)} ·{' '}
                    {row.externalId} ·{' '}
                    {t('hrMasterData.revision', { revision: row.revision })}
                  </span>
                  {sync ? (
                    <Button
                      size='sm'
                      variant='outline'
                      disabled={busy}
                      onClick={() => {
                        setReclaim(row);
                        setReason('');
                        setError(undefined);
                      }}
                    >
                      {t('hrMasterData.reclaim')}
                    </Button>
                  ) : null}
                </div>
              ))}
            </section>
          ) : null}
        </>
      ) : null}
      {editing !== undefined ? (
        <SourceDrawer
          initial={editing}
          busy={busy}
          error={error ? failure : undefined}
          onClose={() => setEditing(undefined)}
          onSave={async (source) => {
            if (
              await mutate(
                'hrMasterData/sources',
                {
                  id: source.id,
                  name: source.name,
                  principalId: source.principalId,
                  active: source.active,
                },
                'PUT',
              )
            ) {
              setEditing(undefined);
              setSelected(source.id);
            }
          }}
        />
      ) : null}
      <Dialog
        open={!!reclaim}
        onOpenChange={(open) => {
          if (!busy && !open) setReclaim(undefined);
        }}
      >
        <FormDrawerContent>
          <FormDrawerHeader>
            <DialogTitle>{t('hrMasterData.reclaim')}</DialogTitle>
          </FormDrawerHeader>
          <FormDrawerBody>
            <p>{t('hrMasterData.reclaimHelp')}</p>
            <Label htmlFor='hr-reclaim-reason'>
              {t('hrMasterData.reason')}
            </Label>
            <Textarea
              id='hr-reclaim-reason'
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            />
            {error ? (
              <p role='alert' className='text-destructive'>
                {failure}
              </p>
            ) : null}
          </FormDrawerBody>
          <FormDrawerFooter>
            <Button
              variant='outline'
              disabled={busy}
              onClick={() => setReclaim(undefined)}
            >
              {t('hrMasterData.cancel')}
            </Button>
            <Button
              disabled={busy || !reason.trim()}
              onClick={() => {
                void (async () => {
                  if (
                    reclaim &&
                    (await mutate(
                      `hrMasterData/mappings/${reclaim.id}/reclaim`,
                      {
                        reason,
                      },
                    ))
                  )
                    setReclaim(undefined);
                })();
              }}
            >
              {t('hrMasterData.confirmReclaim')}
            </Button>
          </FormDrawerFooter>
        </FormDrawerContent>
      </Dialog>
    </PageContainer>
  );
}
function SourceDrawer({
  initial,
  busy,
  error,
  onClose,
  onSave,
}: {
  initial: Source | null;
  busy: boolean;
  error?: string;
  onClose: () => void;
  onSave: (source: Source) => Promise<void>;
}) {
  const { t } = useTranslation();
  const [source, setSource] = useState<Source>(
    initial ?? { id: '', name: '', principalId: '', active: true },
  );
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!busy && !open) onClose();
      }}
    >
      <FormDrawerContent>
        <FormDrawerHeader>
          <DialogTitle>
            {t(initial ? 'hrMasterData.editSource' : 'hrMasterData.addSource')}
          </DialogTitle>
        </FormDrawerHeader>
        <FormDrawerBody>
          {error ? (
            <Alert variant='destructive'>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <Label htmlFor='hr-source-id'>{t('hrMasterData.sourceCode')}</Label>
          <Input
            id='hr-source-id'
            value={source.id}
            disabled={!!initial}
            onChange={(e) => setSource({ ...source, id: e.target.value })}
          />
          <Label htmlFor='hr-source-name'>{t('hrMasterData.sourceName')}</Label>
          <Input
            id='hr-source-name'
            value={source.name}
            onChange={(e) => setSource({ ...source, name: e.target.value })}
          />
          <Label htmlFor='hr-source-principal'>
            {t('hrMasterData.principal')}
          </Label>
          <UserPicker
            id='hr-source-principal'
            value={source.principalId}
            onChange={(id) => setSource({ ...source, principalId: id ?? '' })}
          />
          <label className='flex items-center gap-2'>
            <input
              type='checkbox'
              checked={source.active}
              onChange={(e) =>
                setSource({ ...source, active: e.target.checked })
              }
            />
            {t('hrMasterData.enabled')}
          </label>
        </FormDrawerBody>
        <FormDrawerFooter>
          <Button variant='outline' disabled={busy} onClick={onClose}>
            {t('hrMasterData.cancel')}
          </Button>
          <Button
            disabled={
              busy ||
              !source.name.trim() ||
              !source.principalId ||
              !/^[a-z0-9][a-z0-9-]{0,79}$/.test(source.id)
            }
            onClick={() => void onSave(source)}
          >
            {t('hrMasterData.save')}
          </Button>
        </FormDrawerFooter>
      </FormDrawerContent>
    </Dialog>
  );
}
