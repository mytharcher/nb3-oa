import { zodResolver } from '@hookform/resolvers/zod';
import {
  ApiClientError,
  useApiClient,
  useToaster,
  useNavigationGuard,
} from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { fieldViolationsOf } from '../platform/shared/errors.js';
import { balanceErrorKey } from './errors.js';
import {
  useOutletContext,
  useParams,
  useLocation,
  useNavigate,
} from 'react-router';
import { z } from 'zod';
import { RouteDrawer } from '#components/route-drawer';
import { useRouteOverlay } from '#components/use-route-overlay';
import { Button } from '#components/ui/button';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from '#components/ui/field';
import { Input } from '#components/ui/input';
import { Textarea } from '#components/ui/textarea';
import { Alert, AlertDescription } from '#components/ui/alert';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
} from '#components/ui/alert-dialog';
import { Spinner } from '#components/ui/spinner';
import { SessionExpiredAlert } from '#components/session-expired-alert';
import { useBalanceResource } from './resource.js';
import { BalanceError, BalanceSkeleton } from './states.js';
import { adjustmentUnits, type Balance, type BalanceContext } from './types.js';
import { createRequestId } from '../approvals/request-id.js';

export default function AdjustBalanceDialog() {
  const { t, i18n } = useTranslation();
  const { employeeId = '', leaveType = '' } = useParams();
  const parent = useOutletContext<BalanceContext>();
  const latest = useBalanceResource<{ data: Balance[] }>(
    employeeId ? `leaveBalances/${encodeURIComponent(employeeId)}` : null,
  );
  const [busy, setBusy] = useState(false);
  const [retrying, setRetrying] = useState(false);
  const [expired, setExpired] = useState(false);
  const unresolvedRef = useRef(false);
  const busyRef = useRef(false);
  const dirtyRef = useRef(false);
  const doneRef = useRef(false);
  const [discard, setDiscard] = useState(false);
  const [navigationDiscard, setNavigationDiscard] = useState(false);
  const navigate = useNavigate();
  const resolveRef = useRef<((allowed: boolean) => void) | null>(null);
  useEffect(
    () => () => {
      resolveRef.current?.(false);
    },
    [],
  );
  const type = parent.types.find((type) => type.code === leaveType);
  const label = type?.label[i18n.language] ?? type?.label['zh-CN'] ?? leaveType;
  const balance = latest.data?.data.find(
    (row) => row.leaveType === leaveType,
  ) ?? { employeeId, leaveType, availableUnits: 0, heldUnits: 0 };
  const allowed = employeeId === parent.employeeId && !!type;
  useNavigationGuard(() => {
    if (doneRef.current) return true;
    if (busyRef.current || unresolvedRef.current) return false;
    if (!dirtyRef.current) return true;
    setNavigationDiscard(true);
    setDiscard(true);
    return false;
  });
  const location = useLocation();
  const closeParams = new URLSearchParams(location.search);
  closeParams.set('employeeId', employeeId);
  closeParams.set('leaveType', leaveType);
  const beforeClose = () => {
    if (busyRef.current || unresolvedRef.current) return false;
    if (doneRef.current || !dirtyRef.current) return true;
    setNavigationDiscard(false);
    setDiscard(true);
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
    });
  };
  return (
    <>
      <RouteDrawer
        className='sm:max-w-2xl'
        closeTo={{ pathname: '..', search: `?${closeParams.toString()}` }}
        title={t('leaveBalances.adjustTitle')}
        description={t('leaveBalances.adjustDescription', {
          name: parent.employeeName,
          type: label,
        })}
        beforeClose={beforeClose}
        footer={
          <AdjustmentFooter
            busy={busy}
            retrying={retrying}
            expired={expired}
            ready={allowed && !!latest.data && !latest.error}
          />
        }
      >
        {!allowed ? (
          <Alert variant='destructive'>
            <AlertDescription>{t('leaveBalances.noTypes')}</AlertDescription>
          </Alert>
        ) : latest.error ? (
          <BalanceError error={latest.error} retry={latest.reload} />
        ) : !latest.data ? (
          <BalanceSkeleton />
        ) : (
          <AdjustmentForm
            setUnresolved={(value) => {
              unresolvedRef.current = value;
              setRetrying(value);
            }}
            sessionExpired={expired}
            setSessionExpired={setExpired}
            balance={balance}
            name={parent.employeeName}
            busy={busy}
            setBusy={(value) => {
              busyRef.current = value;
              setBusy(value);
            }}
            setDirty={(value) => {
              dirtyRef.current = value;
            }}
            saved={(result) => {
              doneRef.current = true;
              dirtyRef.current = false;
              parent.onAdjusted(result);
            }}
          />
        )}
      </RouteDrawer>
      <AlertDialog
        open={discard}
        onOpenChange={(open) => {
          if (!open) {
            setDiscard(false);
            resolveRef.current?.(false);
            resolveRef.current = null;
          }
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('leaveBalances.discardTitle')}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                navigationDiscard
                  ? 'leaveBalances.navigationDiscardDescription'
                  : 'leaveBalances.discardDescription',
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <Button
              variant='outline'
              onClick={() => {
                setDiscard(false);
                resolveRef.current?.(false);
                resolveRef.current = null;
              }}
            >
              {t('leaveBalances.keepEditing')}
            </Button>
            <Button
              variant='destructive'
              onClick={() => {
                setDiscard(false);
                if (navigationDiscard) {
                  doneRef.current = true;
                  dirtyRef.current = false;
                  void navigate(
                    { pathname: '..', search: `?${closeParams.toString()}` },
                    { relative: 'route' },
                  );
                  setNavigationDiscard(false);
                }
                resolveRef.current?.(true);
                resolveRef.current = null;
              }}
            >
              {t(
                navigationDiscard
                  ? 'leaveBalances.navigationDiscard'
                  : 'leaveBalances.discard',
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
export function AdjustmentForm({
  balance,
  setUnresolved,
  sessionExpired,
  setSessionExpired,
  name,
  busy,
  setBusy,
  setDirty,
  saved,
}: {
  balance: Balance;
  setUnresolved: (value: boolean) => void;
  sessionExpired: boolean;
  setSessionExpired: (value: boolean) => void;
  name: string;
  busy: boolean;
  setBusy: (value: boolean) => void;
  setDirty: (value: boolean) => void;
  saved: (result: Balance) => void;
}) {
  const { t, i18n } = useTranslation();
  const api = useApiClient();
  const toaster = useToaster();
  const overlay = useRouteOverlay();
  const pendingRef = useRef(false);
  const schema = z.object({
    days: z
      .string()
      .refine(
        (value) => adjustmentUnits(value) !== null,
        t('leaveBalances.daysInvalid'),
      ),
    reason: z
      .string()
      .trim()
      .min(1, t('leaveBalances.reasonRequired'))
      .max(2000, t('leaveBalances.reasonLong')),
  });
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: { days: '', reason: '' },
  });
  const [retryPayload, setRetryPayload] = useState<{
    leaveType: string;
    units: number;
    requestKey: string;
    reference: string;
    reason: string;
    expiresAt: null;
  } | null>(null);
  useEffect(
    () => setDirty(form.formState.isDirty || !!retryPayload),
    [form.formState.isDirty, retryPayload, setDirty],
  );
  const n = new Intl.NumberFormat(i18n.language, { maximumFractionDigits: 1 });
  const entered = adjustmentUnits(
    useWatch({ control: form.control, name: 'days' }),
  );
  const submit = async (values: z.infer<typeof schema>) => {
    if (pendingRef.current) return;
    pendingRef.current = true;
    setBusy(true);
    form.clearErrors('root');
    try {
      const id = createRequestId();
      const payload = retryPayload ?? {
        leaveType: balance.leaveType,
        units: adjustmentUnits(values.days)!,
        requestKey: id,
        reference: `hr:${id}`,
        reason: values.reason,
        expiresAt: null,
      };
      // Freeze the exact payload after an uncertain outcome; retry must never reuse a key with edited values.
      setRetryPayload(payload);
      const { data } = await api.request<{ data: Balance }>({
        path: `leaveBalances/${encodeURIComponent(balance.employeeId)}/adjust`,
        method: 'POST',
        json: payload,
      });
      setUnresolved(false);
      saved(data);
      toaster.show({
        type: 'success',
        title: t('leaveBalances.adjusted', { name }),
      });
      setBusy(false);
      pendingRef.current = false;
      await overlay.close();
    } catch (error) {
      if (error instanceof ApiClientError && error.status === 401)
        setSessionExpired(true);
      if (error instanceof ApiClientError && error.status < 500) {
        setRetryPayload(null);
        setUnresolved(false);
      } else {
        setUnresolved(true);
      }
      const fields = fieldViolationsOf(error);
      const reason = error instanceof ApiClientError ? error.reason : undefined;
      if (
        reason === 'LEAVE_BALANCE_INSUFFICIENT' ||
        reason === 'LEAVE_BALANCE_INVALID_UNITS' ||
        fields.some((field) => field === 'units' || field === 'days')
      ) {
        form.setError(
          'days',
          {
            message: t(
              reason === 'LEAVE_BALANCE_INSUFFICIENT'
                ? 'leaveBalances.error.insufficient'
                : 'leaveBalances.daysInvalid',
            ),
          },
          { shouldFocus: true },
        );
      } else if (
        reason === 'LEAVE_BALANCE_ADJUSTMENT_REASON_REQUIRED' ||
        fields.includes('reason')
      ) {
        form.setError(
          'reason',
          { message: t('leaveBalances.reasonRequired') },
          { shouldFocus: true },
        );
      } else {
        form.setError('root', {
          message: t(`leaveBalances.error.${balanceErrorKey(error)}`),
        });
      }
    } finally {
      pendingRef.current = false;
      setBusy(false);
    }
  };
  return (
    <form
      id='leave-balance-adjustment'
      onSubmit={(event) => {
        void form.handleSubmit(submit)(event);
      }}
      className='flex flex-col gap-4'
    >
      {sessionExpired ? <SessionExpiredAlert /> : null}
      {form.formState.errors.root ? (
        <Alert variant='destructive'>
          <AlertDescription>
            {form.formState.errors.root.message}
          </AlertDescription>
        </Alert>
      ) : null}
      <p className='text-sm text-muted-foreground'>
        {t('leaveBalances.currentBalance', {
          available: n.format(balance.availableUnits / 2),
          held: n.format(balance.heldUnits / 2),
        })}
      </p>
      <FieldGroup>
        <Field data-invalid={!!form.formState.errors.days}>
          <FieldLabel htmlFor='adjust-days'>
            {t('leaveBalances.days')} *
          </FieldLabel>
          <Input
            id='adjust-days'
            inputMode='decimal'
            {...form.register('days')}
            disabled={busy || !!retryPayload}
            aria-invalid={!!form.formState.errors.days}
          />
          <FieldError errors={[form.formState.errors.days]} />
          {entered !== null ? (
            <p className='text-sm text-muted-foreground'>
              {t('leaveBalances.afterBalance', {
                amount: n.format((balance.availableUnits + entered) / 2),
              })}
            </p>
          ) : null}
        </Field>
        <Field data-invalid={!!form.formState.errors.reason}>
          <FieldLabel htmlFor='adjust-reason'>
            {t('leaveBalances.reason')} *
          </FieldLabel>
          <Textarea
            id='adjust-reason'
            {...form.register('reason')}
            disabled={busy || !!retryPayload}
            aria-invalid={!!form.formState.errors.reason}
          />
          <FieldError errors={[form.formState.errors.reason]} />
        </Field>
      </FieldGroup>
      <p className='text-sm text-muted-foreground'>
        {t('leaveBalances.noExpiry')}
      </p>
      {retryPayload && !busy ? (
        <p className='text-sm text-muted-foreground'>
          {t('leaveBalances.uncertain')}
        </p>
      ) : null}
    </form>
  );
}

function AdjustmentFooter({
  busy,
  retrying,
  expired,
  ready,
}: {
  busy: boolean;
  retrying: boolean;
  expired: boolean;
  ready: boolean;
}) {
  const { t } = useTranslation();
  const overlay = useRouteOverlay();
  return (
    <>
      <Button
        type='button'
        variant='outline'
        disabled={busy || retrying}
        onClick={() => void overlay.close()}
      >
        {t('leaveBalances.cancel')}
      </Button>
      {ready ? (
        <Button
          type='submit'
          form='leave-balance-adjustment'
          disabled={busy || expired}
        >
          {busy ? <Spinner /> : null}
          {t(
            retrying ? 'leaveBalances.retryAdjustment' : 'leaveBalances.adjust',
          )}
        </Button>
      ) : null}
    </>
  );
}
