import { useEffect, useRef, useState, type FormEvent } from 'react';
import { useParams, useOutletContext } from 'react-router';
import {
  useAuthorizationRevision,
  useCan,
} from '@nocobase/app-plugin-authorization/client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { ApiClientError, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { RouteDrawer } from '#components/route-drawer';
import { useRouteOverlay } from '#components/use-route-overlay';
import { Button } from '#components/ui/button';
import { Spinner } from '#components/ui/spinner';
import { Input } from '#components/ui/input';
import { Field, FieldLabel } from '#components/ui/field';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
  SelectGroup,
} from '#components/ui/select';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '#components/ui/alert-dialog';
import { selectWidth } from '../template-print/types.js';
import { Switch } from '#components/ui/switch';
import { useSealResource, isDenied } from './resource.js';
import { useSealCommand } from './command.js';
import { SealError, SealSkeleton } from './states.js';
import type { SealInstance } from './instances.js';
import type { Source } from './types.js';
export default function InstanceForm() {
  const { sealInstanceId } = useParams(),
    { session } = useAuthentication(),
    revision = useAuthorizationRevision(),
    { t } = useTranslation();
  const busyRef = useRef(false),
    dirtyRef = useRef(false),
    resolveRef = useRef<((value: boolean) => void) | undefined>(undefined);
  const [discard, setDiscard] = useState(false),
    [state, setState] = useState({ ready: false, busy: false });
  return (
    <RouteDrawer
      title={t(sealInstanceId ? 'seals.editInstance' : 'seals.newInstance')}
      beforeClose={() => {
        if (busyRef.current) return false;
        if (!dirtyRef.current) return true;
        setDiscard(true);
        return new Promise<boolean>((resolve) => {
          resolveRef.current = resolve;
        });
      }}
      footer={<FormFooter {...state} />}
    >
      <Body
        key={`${session?.user.id}:${revision}:${sealInstanceId}`}
        id={sealInstanceId}
        busyRef={busyRef}
        dirtyRef={dirtyRef}
        onState={setState}
      />
      <AlertDialog
        open={discard}
        onOpenChange={(v) => {
          setDiscard(v);
          if (!v) resolveRef.current?.(false);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('seals.discard')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('seals.discardDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('seals.cancel')}</AlertDialogCancel>
            <Button
              variant='destructive'
              onClick={() => {
                dirtyRef.current = false;
                resolveRef.current?.(true);
                setDiscard(false);
              }}
            >
              {t('seals.discard')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </RouteDrawer>
  );
}
function Body({
  id,
  busyRef,
  dirtyRef,
  onState,
}: {
  id?: string;
  busyRef: React.MutableRefObject<boolean>;
  dirtyRef: React.MutableRefObject<boolean>;
  onState: (value: { ready: boolean; busy: boolean }) => void;
}) {
  const { t, i18n } = useTranslation(),
    { close } = useRouteOverlay(),
    parent = useOutletContext<Source>(),
    toaster = useToaster();
  const grant = useCan({
      resource: { type: 'composite', id: 'oa.seals' },
      action: 'manage',
    }),
    allowed = grant.can && !grant.isPending && !grant.error;
  const r = useSealResource<{ data: SealInstance[] }>(
      id && allowed ? 'seals' : null,
    ),
    options = useSealResource<{
      data: { code: string; label: Record<string, string> }[];
    }>('dictionaryTypes/sealType/entries'),
    cmd = useSealCommand();
  const original = r.data?.data.find((v) => v.id === id),
    [hydrated, setHydrated] = useState(''),
    [values, setValues] = useState({
      code: '',
      name: '',
      sealType: '',
      active: true,
      reason: '',
    }),
    [error, setError] = useState<unknown>(),
    [conflict, setConflict] = useState(false),
    [reloadConfirm, setReloadConfirm] = useState(false),
    [disableConfirm, setDisableConfirm] = useState(false);
  if (original && hydrated !== `${original.id}:${original.version}`) {
    setHydrated(`${original.id}:${original.version}`);
    setValues({
      code: original.code,
      name: original.name,
      sealType: original.sealType,
      active: original.active,
      reason: '',
    });
  }
  const denied = !allowed || isDenied(error) || isDenied(r.error),
    ready =
      !denied &&
      !r.loading &&
      !r.error &&
      !options.loading &&
      !options.error &&
      !conflict &&
      (!id || !!original);
  useEffect(
    () => onState({ ready, busy: cmd.busy }),
    [ready, cmd.busy, onState],
  );
  const update = (key: keyof typeof values, value: string | boolean) => {
    setValues((v) => ({ ...v, [key]: value }));
    dirtyRef.current = true;
  };
  async function submit(e?: FormEvent, confirmed = false) {
    e?.preventDefault();
    if (!ready || busyRef.current) return;
    if (original?.active && !values.active && !confirmed) {
      setDisableConfirm(true);
      return;
    }
    busyRef.current = true;
    try {
      const result = await cmd.execute(
        'seals',
        'POST',
        {
          ...values,
          ...(id ? { id, expectedVersion: original!.version } : {}),
        },
        'requestKey',
        true,
      );
      if (!result) return;
      dirtyRef.current = false;
      busyRef.current = false;
      parent?.reload();
      toaster.show({
        type: 'success',
        title: t('seals.instanceSaved', { name: values.name }),
      });
      void close();
    } catch (e) {
      setError(e);
      if (isDenied(e)) {
        setValues({
          code: '',
          name: '',
          sealType: '',
          active: true,
          reason: '',
        });
        dirtyRef.current = false;
      }
      if (e instanceof ApiClientError && e.status === 409) setConflict(true);
    } finally {
      busyRef.current = false;
    }
  }
  return (
    <form
      id='seal-instance-form'
      className='flex flex-col gap-4'
      onSubmit={(e) => void submit(e)}
    >
      {r.loading || options.loading ? <SealSkeleton /> : null}
      {error || r.error || options.error ? (
        <SealError
          returnTo='/seal-instances'
          error={error ?? r.error ?? options.error}
          retry={
            !error && !isDenied(r.error ?? options.error)
              ? () => {
                  r.reload();
                  options.reload();
                }
              : undefined
          }
        />
      ) : null}
      {!allowed && !grant.isPending ? <p>{t('seals.forbidden')}</p> : null}
      {conflict ? (
        <Button
          type='button'
          variant='outline'
          onClick={() => setReloadConfirm(true)}
        >
          {t('seals.refresh')}
        </Button>
      ) : null}
      <AlertDialog open={reloadConfirm} onOpenChange={setReloadConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('seals.reloadInstance')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('seals.reloadInstanceDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('seals.cancel')}</AlertDialogCancel>
            <Button
              onClick={() => {
                setReloadConfirm(false);
                setConflict(false);
                setHydrated('');
                setError(undefined);
                dirtyRef.current = false;
                r.invalidate();
              }}
            >
              {t('seals.refresh')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={disableConfirm} onOpenChange={setDisableConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('seals.disableInstance', { name: values.name })}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('seals.disableInstanceDescription')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('seals.cancel')}</AlertDialogCancel>
            <Button
              variant='destructive'
              onClick={() => {
                setDisableConfirm(false);
                void submit(undefined, true);
              }}
            >
              {t('seals.disable')}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {id && !r.loading && !original ? <p>{t('seals.missing')}</p> : null}
      {!denied ? (
        <fieldset
          disabled={
            !ready ||
            cmd.busy ||
            (!!error &&
              !(error instanceof ApiClientError && error.status === 400))
          }
          className='flex flex-col gap-4'
        >
          {(['code', 'name', 'reason'] as const).map((key) => (
            <Field key={key}>
              <FieldLabel htmlFor={`seal-instance-${key}`}>
                {t(
                  `seals.${key === 'code' ? 'instanceCode' : key === 'name' ? 'instanceName' : 'reason'}`,
                )}{' '}
                *
              </FieldLabel>
              <Input
                id={`seal-instance-${key}`}
                required
                maxLength={key === 'code' ? 64 : key === 'name' ? 200 : 2000}
                value={values[key]}
                onChange={(e) => update(key, e.target.value)}
              />
            </Field>
          ))}
          <Field>
            <FieldLabel htmlFor='seal-instance-type'>
              {t('seals.sealType')} *
            </FieldLabel>
            <Select
              items={Object.fromEntries(
                options.data?.data.map((type) => [
                  type.code,
                  type.label[i18n.language] ?? type.label['en-US'] ?? type.code,
                ]) ?? [],
              )}
              value={values.sealType}
              onValueChange={(v) => update('sealType', v ?? '')}
            >
              <SelectTrigger id='seal-instance-type'>
                <SelectValue />
              </SelectTrigger>
              <SelectContent className={selectWidth}>
                <SelectGroup>
                  {options.data?.data.map((type) => (
                    <SelectItem key={type.code} value={type.code}>
                      {type.label[i18n.language] ??
                        type.label['en-US'] ??
                        type.code}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </Field>
          <Field>
            <FieldLabel htmlFor='seal-instance-active'>
              {t('seals.instanceActive')}
            </FieldLabel>
            <Switch
              id='seal-instance-active'
              checked={values.active}
              onCheckedChange={(v) => update('active', v)}
            />
          </Field>
        </fieldset>
      ) : null}
    </form>
  );
}

function FormFooter({ ready, busy }: { ready: boolean; busy: boolean }) {
  const { t } = useTranslation(),
    { close } = useRouteOverlay();
  return (
    <>
      <Button
        type='button'
        variant='outline'
        disabled={busy}
        onClick={() => void close()}
      >
        {t('seals.cancel')}
      </Button>
      <Button form='seal-instance-form' type='submit' disabled={!ready || busy}>
        {busy ? <Spinner /> : null}
        {t('seals.save')}
      </Button>
    </>
  );
}
