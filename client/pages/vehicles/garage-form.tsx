import { useDrawerFormGuard } from '#hooks/use-drawer-form-guard';
import { useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { ApiClientError, useApiClient, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useParams, useOutletContext } from 'react-router';
import { RouteDrawer } from '#components/route-drawer';
import { useRouteOverlay } from '#components/use-route-overlay';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from '#components/ui/field';
import { Input } from '#components/ui/input';
import { Textarea } from '#components/ui/textarea';
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
import type { Vehicle, Options, Source } from './types.js';
export default function GarageForm() {
  const { vehicleId } = useParams(),
    { t } = useTranslation(),
    parent = useOutletContext<Source>(),
    [busy, setBusy] = useState(false),
    workingRef = useRef(false),
    r = useVehicleResource<{ data: { record: Vehicle; canEdit: boolean } }>(
      vehicleId
        ? `vehicleBrowser/garage/${encodeURIComponent(vehicleId)}`
        : null,
    ),
    o = useVehicleResource<{ data: Options }>(
      vehicleId ? null : 'vehicleBrowser/options',
    ),
    ready =
      !r.loading &&
      !o.loading &&
      !r.error &&
      !o.error &&
      (vehicleId ? r.data?.data.canEdit : o.data?.data.canManage),
    bind = (v: boolean) => {
      workingRef.current = v;
      setBusy(v);
    };
  return (
    <RouteDrawer
      className='sm:max-w-2xl'
      title={t(vehicleId ? 'vehicles.editVehicle' : 'vehicles.newVehicle')}
      beforeClose={() => !workingRef.current}
      footer={<Footer busy={busy} ready={!!ready} />}
    >
      {(r.error ?? o.error) ? (
        <VehicleError
          error={r.error ?? o.error}
          retry={() => {
            r.reload();
            o.reload();
          }}
        />
      ) : r.loading || o.loading ? (
        <Loading />
      ) : ready ? (
        <Body
          key={r.data?.data.record.version ?? 'new'}
          vehicle={r.data?.data.record}
          busy={bind}
          saved={parent.reload}
        />
      ) : (
        <Alert>
          <AlertDescription>{t('vehicles.errors.forbidden')}</AlertDescription>
        </Alert>
      )}
    </RouteDrawer>
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
        form='vehicle-garage-form'
        disabled={busy || !ready}
      >
        {t('vehicles.save')}
      </Button>
    </>
  );
}
function Body({
  vehicle,
  busy,
  saved,
}: {
  vehicle?: Vehicle;
  busy: (v: boolean) => void;
  saved: () => void;
}) {
  const { t } = useTranslation(),
    api = useApiClient(),
    toaster = useToaster(),
    { close } = useRouteOverlay();
  const schema = useMemo(
    () =>
      z.object({
        plateNumber: z
          .string()
          .trim()
          .min(1, t('vehicles.validation.required'))
          .max(64),
        name: z
          .string()
          .trim()
          .min(1, t('vehicles.validation.required'))
          .max(200),
        vehicleType: z
          .string()
          .trim()
          .min(1, t('vehicles.validation.required'))
          .max(64),
        capacity: z
          .number()
          .int()
          .min(1, t('vehicles.validation.passengers'))
          .max(100000),
        status: z.enum(['active', 'inactive', 'maintenance']),
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
        plateNumber: vehicle?.plateNumber ?? '',
        name: vehicle?.name ?? '',
        vehicleType: vehicle?.vehicleType ?? '',
        capacity: vehicle?.capacity ?? 1,
        status: vehicle?.status ?? 'active',
        reason: '',
      },
    }),
    pending = form.formState.isSubmitting;
  const drawerGuard = useDrawerFormGuard(
    form.formState.isDirty,
    form.formState.isSubmitting,
  );
  const submit = form.handleSubmit(
    async (values) => {
      busy(true);
      try {
        await api.request({
          method: vehicle ? 'PATCH' : 'POST',
          path: vehicle ? `vehicles/${vehicle.id}` : 'vehicles',
          json: { ...values, ...(vehicle ? { version: vehicle.version } : {}) },
        });
        form.reset(values);
        saved();
        busy(false);
        toaster.show({
          type: 'success',
          title: t('vehicles.saved', { name: values.name }),
        });
        drawerGuard.markSaved();
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
    },
    (errors) =>
      document.getElementById(`garage-${Object.keys(errors)[0]}`)?.focus(),
  );
  return (
    <form id='vehicle-garage-form' noValidate onSubmit={(e) => void submit(e)}>
      {drawerGuard.confirmation}
      <FieldGroup>
        <FormError error={form.formState.errors.root} />
        {(
          ['plateNumber', 'name', 'vehicleType', 'capacity', 'reason'] as const
        ).map((name) => (
          <Field key={name} data-invalid={!!form.formState.errors[name]}>
            <FieldLabel htmlFor={`garage-${name}`}>
              {t(`vehicles.fields.${name}`)}{' '}
              <span aria-hidden='true' className='text-destructive'>
                *
              </span>
            </FieldLabel>
            {name === 'reason' ? (
              <Textarea
                id={`garage-${name}`}
                disabled={pending}
                aria-required
                {...form.register(name)}
              />
            ) : (
              <Input
                id={`garage-${name}`}
                type={name === 'capacity' ? 'number' : 'text'}
                aria-required
                disabled={pending}
                {...form.register(
                  name,
                  name === 'capacity' ? { valueAsNumber: true } : {},
                )}
              />
            )}
            <FieldError errors={[form.formState.errors[name]]} />
          </Field>
        ))}
        <Controller
          name='status'
          control={form.control}
          render={({ field }) => (
            <Field>
              <FieldLabel htmlFor='garage-status'>
                {t('vehicles.fields.status')}
              </FieldLabel>
              <Select
                value={field.value}
                onValueChange={field.onChange}
                disabled={pending}
              >
                <SelectTrigger id='garage-status'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                  <SelectGroup>
                    {['active', 'inactive', 'maintenance'].map((v) => (
                      <SelectItem key={v} value={v}>
                        {t(`vehicles.status.${v}`)}
                      </SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </Field>
          )}
        />
      </FieldGroup>
    </form>
  );
}
