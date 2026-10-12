import { UserName } from '#components/user-name';
import { useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ApiClientError, useApiClient, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useParams, useOutletContext } from 'react-router';
import { RouteDialog } from '#components/route-dialog';
import { useRouteOverlay } from '#components/use-route-overlay';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from '#components/ui/field';
import { Input } from '#components/ui/input';
import { Textarea } from '#components/ui/textarea';
import { Switch } from '#components/ui/switch';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from '#components/ui/select';
import { Button } from '#components/ui/button';
import { Alert, AlertDescription } from '#components/ui/alert';
import { useVehicleResource } from './resource.js';
import { Loading, VehicleError, FormError } from './states.js';
import { errorKey } from './errors.js';
import type { Driver, Person, Source } from './types.js';
export default function DriverForm() {
  const { driverId } = useParams(),
    { t } = useTranslation(),
    parent = useOutletContext<Source>(),
    [busy, setBusy] = useState(false),
    workingRef = useRef(false),
    r = useVehicleResource<{ data: { record: Driver; canEdit: boolean } }>(
      driverId
        ? `vehicleBrowser/drivers/${encodeURIComponent(driverId)}`
        : null,
    ),
    c = useVehicleResource<{ data: { items: { id: string; user: Person }[] } }>(
      driverId ? null : 'vehicleBrowser/driverCandidates',
    ),
    ready =
      !r.loading &&
      !c.loading &&
      !r.error &&
      !c.error &&
      (driverId ? r.data?.data.canEdit : !!c.data),
    bind = (v: boolean) => {
      workingRef.current = v;
      setBusy(v);
    };
  return (
    <RouteDialog
      title={t(driverId ? 'vehicles.editDriver' : 'vehicles.newDriver')}
      beforeClose={() => !workingRef.current}
      footer={<Footer busy={busy} ready={!!ready} />}
    >
      {(r.error ?? c.error) ? (
        <VehicleError
          error={r.error ?? c.error}
          retry={() => {
            r.reload();
            c.reload();
          }}
        />
      ) : r.loading || c.loading ? (
        <Loading />
      ) : ready ? (
        <Body
          key={r.data?.data.record.version ?? 'new'}
          driver={r.data?.data.record}
          busy={bind}
          saved={parent.reload}
        />
      ) : (
        <Alert>
          <AlertDescription>{t('vehicles.errors.forbidden')}</AlertDescription>
        </Alert>
      )}
    </RouteDialog>
  );
}
function Footer({ busy, ready }: { busy: boolean; ready: boolean }) {
  const { close } = useRouteOverlay(),
    { t } = useTranslation();
  return (
    <>
      <Button variant='outline' disabled={busy} onClick={() => void close()}>
        {t('vehicles.cancel')}
      </Button>
      <Button
        type='submit'
        form='vehicle-driver-form'
        disabled={busy || !ready}
      >
        {t('vehicles.save')}
      </Button>
    </>
  );
}
function Body({
  driver,
  busy,
  saved,
}: {
  driver?: Driver;
  busy: (v: boolean) => void;
  saved: () => void;
}) {
  const { t } = useTranslation(),
    api = useApiClient(),
    toaster = useToaster(),
    { close } = useRouteOverlay(),
    [search, setSearch] = useState(''),
    [term, setTerm] = useState(''),
    composingRef = useRef(false),
    timerRef = useRef<ReturnType<typeof setTimeout>>(undefined),
    c = useVehicleResource<{ data: { items: { id: string; user: Person }[] } }>(
      driver ? null : 'vehicleBrowser/driverCandidates',
      { search: term },
    );
  const schema = useMemo(
    () =>
      z.object({
        employeeId: z.string().min(1, t('vehicles.validation.required')),
        active: z.boolean(),
        reason: z
          .string()
          .trim()
          .min(1, t('vehicles.validation.required'))
          .max(5000),
      }),
    [t],
  );
  const form = useForm({
      resolver: zodResolver(schema),
      defaultValues: {
        employeeId: driver?.employeeId ?? '',
        active: driver?.active ?? true,
        reason: '',
      },
    }),
    pending = form.formState.isSubmitting;
  const submit = form.handleSubmit(async (values) => {
    busy(true);
    try {
      await api.request({
        method: 'POST',
        path: 'vehicleDrivers',
        json: { ...values, version: driver?.version ?? 0 },
      });
      form.reset(values);
      saved();
      busy(false);
      toaster.show({ type: 'success', title: t('vehicles.saved') });
      await close();
    } catch (error) {
      form.setError('root', {
        type:
          error instanceof ApiClientError && error.status === 401
            ? 'sessionExpired'
            : 'server',
        message: t(`vehicles.errors.${errorKey(error)}`),
      });
    } finally {
      busy(false);
    }
  });
  const change = (value: string) => {
    setSearch(value);
    if (timerRef.current) clearTimeout(timerRef.current);
    if (!composingRef.current)
      timerRef.current = setTimeout(() => setTerm(value), 300);
  };
  return (
    <form id='vehicle-driver-form' noValidate onSubmit={(e) => void submit(e)}>
      <FieldGroup>
        <FormError error={form.formState.errors.root} />
        <Controller
          name='employeeId'
          control={form.control}
          render={({ field, fieldState }) => (
            <Field data-invalid={!!fieldState.error}>
              <FieldLabel htmlFor='driver-employee'>
                {t('vehicles.fields.driver')}
              </FieldLabel>
              {driver ? (
                <p>
                  <UserName name={driver.employee.user.name} />
                </p>
              ) : (
                <>
                  <Input
                    aria-label={t('vehicles.searchEmployees')}
                    value={search}
                    disabled={pending}
                    onCompositionStart={() => {
                      composingRef.current = true;
                      if (timerRef.current) clearTimeout(timerRef.current);
                    }}
                    onCompositionEnd={(e) => {
                      composingRef.current = false;
                      change(e.currentTarget.value);
                    }}
                    onChange={(e) => change(e.target.value)}
                  />
                  {c.error ? (
                    <VehicleError error={c.error} retry={c.reload} />
                  ) : null}
                  <Select
                    value={field.value}
                    onValueChange={field.onChange}
                    disabled={pending || c.loading}
                  >
                    <SelectTrigger id='driver-employee'>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectGroup>
                        {c.data?.data.items.map((item) => (
                          <SelectItem key={item.id} value={item.id}>
                            <UserName name={item.user.name} />
                          </SelectItem>
                        ))}
                      </SelectGroup>
                    </SelectContent>
                  </Select>
                </>
              )}
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          name='active'
          control={form.control}
          render={({ field }) => (
            <Field orientation='horizontal'>
              <FieldLabel htmlFor='driver-active'>
                {t('vehicles.fields.active')}
              </FieldLabel>
              <Switch
                id='driver-active'
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={pending}
              />
            </Field>
          )}
        />
        <Field data-invalid={!!form.formState.errors.reason}>
          <FieldLabel htmlFor='driver-reason'>
            {t('vehicles.fields.reason')}
          </FieldLabel>
          <Textarea
            id='driver-reason'
            disabled={pending}
            aria-required
            {...form.register('reason')}
          />
          <FieldError errors={[form.formState.errors.reason]} />
        </Field>
      </FieldGroup>
    </form>
  );
}
