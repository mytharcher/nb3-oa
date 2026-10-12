import { useState } from 'react';
import {
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
} from 'react-router';
import { useApiClient, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { RouteDialog } from '#components/route-dialog';
import { UserPicker } from '#components/user-picker';
import { Field, FieldLabel, FieldError } from '#components/ui/field';
import { Button } from '#components/ui/button';
import { Spinner } from '#components/ui/spinner';
import { ErrorState } from './ui.js';
export default function AddMember() {
  const { id = '' } = useParams();
  const { name, memberIds, reload, membersSaved } = useOutletContext<{
    name: string;
    memberIds: string[];
    reload: () => void;
    membersSaved?: (
      data: import('../org/duty-roles/types.js').DutyRoleMember[],
    ) => void;
  }>();
  const { t } = useTranslation();
  const api = useApiClient();
  const toaster = useToaster();
  const navigate = useNavigate();
  const location = useLocation();
  const [user, setUser] = useState<{ id: string; name: string }>();
  const [invalid, setInvalid] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const close = () => {
    void navigate(`..${location.search}`, { relative: 'path' });
  };
  async function save() {
    if (!user) {
      setInvalid(true);
      document.getElementById('access-member')?.focus();
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      await api.request({
        path: `dutyRoles/${encodeURIComponent(id)}/members`,
        method: 'POST',
        json: { userId: user.id },
      });
      const current = await api.request<{
        data: import('../org/duty-roles/types.js').DutyRoleMember[];
      }>({ path: `dutyRoles/${encodeURIComponent(id)}/members` });
      if (membersSaved) membersSaved(current.data);
      else reload();
      close();
      toaster.show({
        type: 'success',
        title: t('access.added', { name: user.name }),
      });
    } catch (cause) {
      setError(cause);
    } finally {
      setBusy(false);
    }
  }
  return (
    <RouteDialog
      title={t('access.addMemberTitle', { name })}
      beforeClose={() => !busy}
      footer={
        <>
          <Button variant='outline' disabled={busy} onClick={close}>
            {t('access.cancel')}
          </Button>
          <Button disabled={busy} onClick={() => void save()}>
            {busy ? <Spinner /> : null}
            {t('access.add')}
          </Button>
        </>
      }
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
        className='flex flex-col gap-4'
      >
        {error ? (
          <ErrorState
            error={error}
            backTo={`${location.pathname.replace(/\/add$/, '')}${location.search}`}
            onBack={reload}
          />
        ) : null}
        <Field data-invalid={invalid}>
          <FieldLabel htmlFor='access-member'>
            {t('access.person')} *
          </FieldLabel>
          <UserPicker
            id='access-member'
            value={user?.id ?? ''}
            disabled={busy}
            invalid={invalid}
            excludeIds={memberIds}
            knownUsers={user ? [user] : []}
            onChange={(id, option) => {
              setUser(option ? { id, name: option.name } : undefined);
              setInvalid(false);
            }}
          />
          {invalid ? <FieldError>{t('access.selectPerson')}</FieldError> : null}
        </Field>
        <p className='text-sm text-muted-foreground'>
          {t('access.memberImpact')}
        </p>
      </form>
    </RouteDialog>
  );
}
