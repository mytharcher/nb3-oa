import { useTranslation } from '@nocobase/i18n/client';
import { Button } from '#components/ui/button';
import { useCatalog, useRoleSnapshot } from './hooks.js';
import { RoleMatrix } from './role-matrix.js';
import { AccessModulePermissions } from './module-permissions.js';
import { roleRows, subjectSets, rowValue } from './model.js';
import { resourceKey } from '../administration/authorization/pages/permission-sets/drafts.js';
import { ErrorState, Loading, Refresh, Blank } from './ui.js';
export default function UserExceptions({
  userId,
  name,
  editing,
  canEdit,
  edit,
  cancel,
  saved,
}: {
  userId: string;
  name: string;
  editing: boolean;
  canEdit: boolean;
  edit: () => void;
  cancel: () => void;
  saved: () => void;
}) {
  const { t } = useTranslation();
  const snapshot = useRoleSnapshot('user', userId);
  const catalog = useCatalog();
  if (snapshot.error || catalog.error)
    return (
      <ErrorState
        error={snapshot.error ?? catalog.error}
        retry={() => {
          snapshot.reload();
          catalog.reload();
        }}
      />
    );
  if (!snapshot.data || !catalog.options) return <Loading />;
  const rows = roleRows(
    catalog.options,
    subjectSets(snapshot.data, { type: 'user', id: userId }),
  ).filter((row) => row.enabled);
  return (
    <div className='flex flex-col gap-4'>
      <p className='text-muted-foreground'>{t('access.exceptionsHelp')}</p>
      {!editing ? (
        <div className='flex justify-end gap-2'>
          <Refresh busy={snapshot.busy} reload={snapshot.reload} />
          {canEdit ? (
            <Button variant='outline' onClick={edit}>
              {t('access.adjustExceptions')}
            </Button>
          ) : null}
        </div>
      ) : null}
      {editing ? (
        <RoleMatrix
          key={snapshot.data.revision}
          subject={{ type: 'user', id: userId }}
          snapshot={snapshot.data}
          options={catalog.options}
          name={name}
          canEdit={editing && canEdit}
          cancel={cancel}
          reload={snapshot.reload}
          saved={() => saved()}
        />
      ) : !rows.length ? (
        <Blank
          title={t('access.noPersonalExceptions')}
          description={t('access.exceptionsHelp')}
        />
      ) : (
        <AccessModulePermissions
          defaultAll={true}
          options={catalog.options}
          enabled={
            new Set(
              rows.map((row) =>
                resourceKey(row.resource.type, row.resource.value),
              ),
            )
          }
        >
          {(keys) => (
            <div className='flex flex-col gap-3'>
              {!rows.some((row) =>
                keys.has(resourceKey(row.resource.type, row.resource.value)),
              ) ? (
                <Blank
                  title={t('access.noPersonalExceptions')}
                  description={t('access.exceptionsHelp')}
                />
              ) : null}
              {rows
                .filter((row) =>
                  keys.has(resourceKey(row.resource.type, row.resource.value)),
                )
                .map((row) => (
                  <dl key={row.id} className='grid gap-1 border-b pb-3'>
                    <dt className='font-medium'>
                      {row.resource.label} · {row.label}
                    </dt>
                    <dd className='text-muted-foreground'>
                      {rowValue(
                        row,
                        t('access.deniedAction'),
                        t('access.configuredGrant'),
                        t('access.special'),
                      )}
                    </dd>
                  </dl>
                ))}
            </div>
          )}
        </AccessModulePermissions>
      )}
    </div>
  );
}
