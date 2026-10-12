import { zodResolver } from '@hookform/resolvers/zod';
import { ApiClientError, useApiClient, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { AlertCircleIcon } from 'lucide-react';
import { type ReactElement, useEffect, useMemo, useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { useOutletContext, useParams } from 'react-router';
import { z } from 'zod';

import { RouteDialog } from '#components/route-dialog';
import { SessionExpiredAlert } from '#components/session-expired-alert';
import { Alert, AlertAction, AlertDescription } from '#components/ui/alert';
import { Button } from '#components/ui/button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '#components/ui/field';
import { Input } from '#components/ui/input';
import { useRouteOverlay } from '#components/use-route-overlay';

import { CloseButton, FormDialogFooter } from '../dialog-parts.js';
import { FormSkeleton, RequiredMark } from '../org-ui.js';
import { useErrorText, violatedField } from '../shared.js';
import {
  CATALOGS,
  type CatalogKind,
  type CatalogOutletContext,
  type CatalogRow,
} from './types.js';

const CODE = /^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/u;

interface CatalogFormProps {
  readonly kind: CatalogKind;
  readonly formId: string;
  /** The latest record when editing; omitted when creating. */
  readonly row?: CatalogRow;
  readonly onSubmittingChange: (submitting: boolean) => void;
  readonly onSubmitted: (row: CatalogRow) => void;
  readonly onNotFound?: () => void;
}

/** Code, title and the catalogue's integer (sort order or rank). Validates on submit (guideline T3.3). */
function CatalogForm({
  kind,
  formId,
  row,
  onSubmittingChange,
  onSubmitted,
  onNotFound,
}: CatalogFormProps): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  const toaster = useToaster();
  const errorText = useErrorText();
  const { numberField } = CATALOGS[kind];
  const numberRequired = numberField === 'rank';

  const schema = useMemo(
    () =>
      z.object({
        code: z
          .string()
          .trim()
          .min(1, t('org.common.form.codeRequired'))
          .regex(CODE, t('org.common.form.codeFormat')),
        title: z
          .string()
          .trim()
          .min(1, t('org.common.form.titleRequired'))
          .max(255, t('org.common.form.titleTooLong', { max: 255 })),
        number: z
          .string()
          .trim()
          .refine((value) => value !== '' || !numberRequired, {
            message: t(`org.${kind}.form.numberRequired`),
          })
          .refine((value) => value === '' || /^-?\d+$/u.test(value), {
            message: t('org.common.form.integer'),
          }),
      }),
    [kind, numberRequired, t],
  );

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      code: row?.code ?? '',
      title: row?.title ?? '',
      number: row?.[numberField] === undefined ? '' : String(row[numberField]),
    },
  });

  const onSubmit = form.handleSubmit(async (values) => {
    const json: Record<string, unknown> = {
      code: values.code,
      title: values.title,
    };
    if (values.number !== '') json[numberField] = Number(values.number);
    else if (row && numberField === 'sortOrder') json.sortOrder = 0;
    let saved: CatalogRow;
    onSubmittingChange(true);
    try {
      const result = row
        ? await api.request<{ data: CatalogRow }>({
            path: `${kind}/${encodeURIComponent(row.id)}`,
            method: 'PATCH',
            json,
          })
        : await api.request<{ data: CatalogRow }>({
            path: kind,
            method: 'POST',
            json,
          });
      saved = result.data;
    } catch (error: unknown) {
      const apiError = error instanceof ApiClientError ? error : undefined;
      const field = violatedField(error);
      if (field === 'code') {
        form.setError(
          'code',
          { message: errorText(error) },
          { shouldFocus: true },
        );
      } else if (apiError?.status === 401) {
        form.setError('root', { type: 'sessionExpired' });
      } else if (row && apiError?.status === 404) {
        onNotFound?.();
      } else {
        form.setError('root', { message: errorText(error) });
      }
      return;
    } finally {
      onSubmittingChange(false);
    }
    toaster.show({
      type: 'success',
      title: row
        ? t(`org.${kind}.saved`, { name: saved.title })
        : t(`org.${kind}.created`, { name: saved.title }),
    });
    onSubmitted(saved);
  });

  const rootError = form.formState.errors.root;

  return (
    <form id={formId} noValidate onSubmit={(event) => void onSubmit(event)}>
      <FieldGroup>
        {rootError?.type === 'sessionExpired' ? (
          <SessionExpiredAlert />
        ) : rootError ? (
          <Alert variant='destructive'>
            <AlertCircleIcon />
            <AlertDescription>{rootError.message}</AlertDescription>
          </Alert>
        ) : null}
        <Controller
          control={form.control}
          name='title'
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`${formId}-title`}>
                {t('org.common.fields.title')}
                <RequiredMark />
              </FieldLabel>
              <Input
                {...field}
                id={`${formId}-title`}
                autoComplete='off'
                aria-required='true'
                aria-invalid={fieldState.invalid}
              />
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name='code'
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`${formId}-code`}>
                {t('org.common.fields.code')}
                <RequiredMark />
              </FieldLabel>
              <Input
                {...field}
                id={`${formId}-code`}
                autoComplete='off'
                aria-required='true'
                aria-invalid={fieldState.invalid}
              />
              <FieldDescription>
                {t('org.common.form.codeHint')}
              </FieldDescription>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <Controller
          control={form.control}
          name='number'
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`${formId}-number`}>
                {t(`org.${kind}.fields.number`)}
                {numberRequired ? <RequiredMark /> : null}
              </FieldLabel>
              <Input
                {...field}
                id={`${formId}-number`}
                inputMode='numeric'
                autoComplete='off'
                aria-required={numberRequired}
                aria-invalid={fieldState.invalid}
              />
              <FieldDescription>
                {t(`org.${kind}.form.numberHint`)}
              </FieldDescription>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
      </FieldGroup>
    </form>
  );
}

/** `new`: creates a position or grade over the list. */
export function CatalogCreateDialog({
  kind,
}: {
  readonly kind: CatalogKind;
}): ReactElement {
  const { t } = useTranslation();
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const handleSubmittingChange = (value: boolean): void => {
    submittingRef.current = value;
    setSubmitting(value);
  };
  const formId = `org-${kind}-new-form`;
  return (
    <RouteDialog
      title={t(`org.${kind}.create`)}
      description={t(`org.${kind}.formDescription`)}
      className='sm:max-w-md'
      beforeClose={() => !submittingRef.current}
      footer={
        <FormDialogFooter
          formId={formId}
          submitting={submitting}
          submitLabel={t('actions.create')}
        />
      }
    >
      <CreateBody
        kind={kind}
        formId={formId}
        onSubmittingChange={handleSubmittingChange}
      />
    </RouteDialog>
  );
}

function CreateBody({
  kind,
  formId,
  onSubmittingChange,
}: {
  readonly kind: CatalogKind;
  readonly formId: string;
  readonly onSubmittingChange: (submitting: boolean) => void;
}): ReactElement {
  const { close } = useRouteOverlay();
  const { reload } = useOutletContext<CatalogOutletContext>();
  return (
    <CatalogForm
      kind={kind}
      formId={formId}
      onSubmittingChange={onSubmittingChange}
      onSubmitted={() => {
        reload();
        void close();
      }}
    />
  );
}

/** `edit/:id`: loads the latest record by id, then edits it over the list (guidelines T3.8, R1). */
export function CatalogEditDialog({
  kind,
}: {
  readonly kind: CatalogKind;
}): ReactElement {
  const params = useParams();
  const id = (kind === 'positions' ? params.positionId : params.gradeId) ?? '';
  return <CatalogEdit key={id} kind={kind} id={id} />;
}

function CatalogEdit({
  kind,
  id,
}: {
  readonly kind: CatalogKind;
  readonly id: string;
}): ReactElement {
  const { t } = useTranslation();
  const api = useApiClient();
  const { reload } = useOutletContext<CatalogOutletContext>();
  const [submitting, setSubmitting] = useState(false);
  const submittingRef = useRef(false);
  const handleSubmittingChange = (value: boolean): void => {
    submittingRef.current = value;
    setSubmitting(value);
  };
  const formId = `org-${kind}-edit-form`;

  const [reloadCount, setReloadCount] = useState(0);
  const requestKey = `${id}:${reloadCount}`;
  const [result, setResult] = useState<{
    readonly key: string;
    readonly row?: CatalogRow;
    readonly error?: unknown;
  }>();
  useEffect(() => {
    const controller = new AbortController();
    const key = `${id}:${reloadCount}`;
    api
      .request<{ data: CatalogRow }>({
        path: `${kind}/${encodeURIComponent(id)}`,
        signal: controller.signal,
      })
      .then(
        ({ data }) => {
          if (!controller.signal.aborted) setResult({ key, row: data });
        },
        (error: unknown) => {
          if (controller.signal.aborted) return;
          setResult({ key, error });
          if (error instanceof ApiClientError && error.status === 404) reload();
        },
      );
    return () => controller.abort();
  }, [api, id, kind, reloadCount, reload]);

  const loading = result?.key !== requestKey;
  const error = loading ? undefined : result?.error;
  const status = error instanceof ApiClientError ? error.status : undefined;
  const [goneOnSave, setGoneOnSave] = useState(false);
  const notFound = goneOnSave || status === 404;
  const row = loading ? undefined : result?.row;

  let body: ReactElement;
  let footer: ReactElement;
  if (status === 401) {
    body = <SessionExpiredAlert />;
    footer = <CloseButton label={t('actions.close')} />;
  } else if (notFound || status === 403) {
    body = (
      <Alert variant='destructive'>
        <AlertCircleIcon />
        <AlertDescription>
          {notFound ? t(`org.${kind}.notFound`) : t('org.errors.forbidden')}
        </AlertDescription>
      </Alert>
    );
    footer = <CloseButton label={t('actions.close')} />;
  } else if (error) {
    body = (
      <Alert variant='destructive'>
        <AlertCircleIcon />
        <AlertDescription>{t('org.errors.requestFailed')}</AlertDescription>
        <AlertAction>
          <Button
            variant='outline'
            size='sm'
            onClick={() => setReloadCount((count) => count + 1)}
          >
            {t('status.retry')}
          </Button>
        </AlertAction>
      </Alert>
    );
    footer = <CloseButton label={t('actions.cancel')} />;
  } else if (!row) {
    body = <FormSkeleton fields={3} />;
    footer = <CloseButton label={t('actions.cancel')} />;
  } else {
    body = (
      <EditBody
        kind={kind}
        formId={formId}
        row={row}
        onSubmittingChange={handleSubmittingChange}
        onNotFound={() => {
          setGoneOnSave(true);
          reload();
        }}
      />
    );
    footer = (
      <FormDialogFooter
        formId={formId}
        submitting={submitting}
        submitLabel={t('actions.save')}
      />
    );
  }

  return (
    <RouteDialog
      title={t(`org.${kind}.editTitle`)}
      description={t(`org.${kind}.formDescription`)}
      className='sm:max-w-md'
      beforeClose={() => !submittingRef.current}
      footer={footer}
    >
      {body}
    </RouteDialog>
  );
}

function EditBody({
  kind,
  formId,
  row,
  onSubmittingChange,
  onNotFound,
}: {
  readonly kind: CatalogKind;
  readonly formId: string;
  readonly row: CatalogRow;
  readonly onSubmittingChange: (submitting: boolean) => void;
  readonly onNotFound: () => void;
}): ReactElement {
  const { close } = useRouteOverlay();
  const { reload } = useOutletContext<CatalogOutletContext>();
  return (
    <CatalogForm
      kind={kind}
      formId={formId}
      row={row}
      onSubmittingChange={onSubmittingChange}
      onNotFound={onNotFound}
      onSubmitted={() => {
        reload();
        void close();
      }}
    />
  );
}
