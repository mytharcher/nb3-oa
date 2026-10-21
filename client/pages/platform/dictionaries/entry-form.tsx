import { useDrawerFormGuard } from '#hooks/use-drawer-form-guard';
import { zodResolver } from '@hookform/resolvers/zod';
import { useApiClient, useToaster } from '@nocobase/app-client';
import { useLocale, useTranslation } from '@nocobase/i18n/client';
import { AlertCircleIcon } from 'lucide-react';
import { type ReactElement, useMemo } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { SessionExpiredAlert } from '#components/session-expired-alert';
import { Alert, AlertDescription } from '#components/ui/alert';
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSeparator,
  FieldSet,
} from '#components/ui/field';
import { Input } from '#components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import { Switch } from '#components/ui/switch';

import { fieldViolationsOf, reasonOf, statusOf } from '../shared/errors.js';
import {
  labelOf,
  type DictionaryEntry,
  type DictionaryExtraField,
  type DictionaryType,
} from '../shared/types.js';

const CODE = /^[A-Za-z][A-Za-z0-9_-]{0,63}$/;

export interface EntryFormProps {
  readonly formId: string;
  readonly definition: DictionaryType;
  /** The latest entry when editing; omitted when creating. */
  readonly entry?: DictionaryEntry;
  readonly onSubmittingChange: (submitting: boolean) => void;
  readonly onSubmitted: (entry: DictionaryEntry) => void;
  readonly onNotFound?: () => void;
}

/** The fields of a dictionary entry: code (create only), both labels, order and the type's own attributes. */
export function EntryForm({
  formId,
  definition,
  entry,
  onSubmittingChange,
  onSubmitted,
  onNotFound,
}: EntryFormProps): ReactElement {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const api = useApiClient();
  const toaster = useToaster();

  const schema = useMemo(() => {
    const extra: Record<string, z.ZodType> = {};
    for (const field of definition.extraFields) {
      if (field.type === 'boolean') extra[field.name] = z.boolean();
      else if (field.type === 'enum')
        extra[field.name] = z.enum(field.options as [string, ...string[]], {
          error: t('platform.dictionaries.invalidStandardKind'),
        });
      else
        extra[field.name] = z
          .string()
          .trim()
          .refine(
            (value) =>
              value === '' ? field.nullable : !Number.isNaN(Number(value)),
            {
              message: t('platform.dictionaries.form.numberRequired'),
            },
          )
          .refine(
            (value) =>
              value === '' ||
              ((field.type !== 'integer' || Number.isInteger(Number(value))) &&
                Number(value) >= (field.min ?? 0)),
            {
              message:
                field.type === 'integer'
                  ? t('platform.dictionaries.form.integerMin', {
                      min: field.min ?? 0,
                    })
                  : t('platform.dictionaries.form.numberMin', {
                      min: field.min ?? 0,
                    }),
            },
          );
    }
    return z
      .object({
        code: z
          .string()
          .trim()
          .regex(CODE, t('platform.dictionaries.form.codeInvalid')),
        labelZh: z
          .string()
          .trim()
          .max(100, t('platform.dictionaries.form.labelTooLong', { max: 100 })),
        labelEn: z
          .string()
          .trim()
          .max(100, t('platform.dictionaries.form.labelTooLong', { max: 100 })),
        sortOrder: z
          .string()
          .trim()
          .refine(
            (value) => /^\d{1,7}$/.test(value) && Number(value) <= 1_000_000,
            {
              message: t('platform.dictionaries.form.sortOrderInvalid'),
            },
          ),
        extra: z.object(extra),
      })
      .refine((values) => values.labelZh !== '' || values.labelEn !== '', {
        path: ['labelZh'],
        message: t('platform.dictionaries.form.labelRequired'),
      });
  }, [definition, t]);

  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      code: entry?.code ?? '',
      labelZh: entry?.label['zh-CN'] ?? '',
      labelEn: entry?.label['en-US'] ?? '',
      sortOrder: String(entry?.sortOrder ?? 0),
      extra: Object.fromEntries(
        definition.extraFields.map((field) => {
          const value = entry?.extra?.[field.name];
          return [
            field.name,
            field.type === 'boolean'
              ? value === true
              : field.type === 'enum'
                ? typeof value === 'string'
                  ? value
                  : (field.options?.[0] ?? '')
                : typeof value === 'number'
                  ? String(value)
                  : '',
          ];
        }),
      ),
    },
  });

  const drawerGuard = useDrawerFormGuard(
    form.formState.isDirty,
    form.formState.isSubmitting,
  );

  const submit = form.handleSubmit(async (values) => {
    const extraValues = values.extra as Record<string, string | boolean>;
    const extra = definition.extraFields.length
      ? Object.fromEntries(
          definition.extraFields.map((field) => {
            const value = extraValues[field.name];
            return [
              field.name,
              field.type === 'boolean'
                ? value === true
                : field.type === 'enum'
                  ? value
                  : value === ''
                    ? null
                    : Number(value),
            ];
          }),
        )
      : null;
    const json = {
      label: {
        ...(values.labelZh ? { 'zh-CN': values.labelZh } : {}),
        ...(values.labelEn ? { 'en-US': values.labelEn } : {}),
      },
      sortOrder: Number(values.sortOrder),
      extra,
    };
    let saved: DictionaryEntry;
    onSubmittingChange(true);
    try {
      const base = `dictionaryTypes/${encodeURIComponent(definition.type)}/entries`;
      ({ data: saved } = entry
        ? await api.request<{ data: DictionaryEntry }>({
            path: `${base}/${entry.id}`,
            method: 'PATCH',
            json,
          })
        : await api.request<{ data: DictionaryEntry }>({
            path: base,
            method: 'POST',
            json: { ...json, code: values.code },
          }));
    } catch (error: unknown) {
      const status = statusOf(error);
      const fields = fieldViolationsOf(error);
      const extraField = fields
        .find((field) => field.startsWith('extra.'))
        ?.slice('extra.'.length);
      if (status === 409 && reasonOf(error) === 'DICTIONARY_CODE_EXISTS') {
        form.setError(
          'code',
          { message: t('platform.dictionaries.form.codeTaken') },
          { shouldFocus: true },
        );
      } else if (status === 400 && extraField) {
        form.setError(
          `extra.${extraField}`,
          { message: t('platform.dictionaries.form.extraInvalid') },
          { shouldFocus: true },
        );
      } else if (status === 400 && fields.includes('label')) {
        form.setError(
          'labelZh',
          { message: t('platform.dictionaries.form.labelRequired') },
          { shouldFocus: true },
        );
      } else if (status === 401) {
        form.setError('root', { type: 'sessionExpired' });
      } else if (entry && status === 404) {
        onNotFound?.();
      } else {
        form.setError('root', {
          message:
            status === 403
              ? t('platform.common.writeForbidden')
              : t('platform.common.saveFailed'),
        });
      }
      return;
    } finally {
      onSubmittingChange(false);
    }
    toaster.show({
      type: 'success',
      title: entry
        ? t('platform.dictionaries.edit.success', {
            name: labelOf(saved, locale),
          })
        : t('platform.dictionaries.create.success', {
            name: labelOf(saved, locale),
          }),
    });
    drawerGuard.markSaved();
    onSubmitted(saved);
  });

  const rootError = form.formState.errors.root;

  return (
    <form id={formId} noValidate onSubmit={(event) => void submit(event)}>
      {drawerGuard.confirmation}
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
          name='code'
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`${formId}-code`}>
                {t('platform.dictionaries.fields.code')}
                {entry ? null : (
                  <span aria-hidden='true' className='text-destructive'>
                    *
                  </span>
                )}
              </FieldLabel>
              <Input
                {...field}
                id={`${formId}-code`}
                autoComplete='off'
                spellCheck={false}
                readOnly={entry !== undefined}
                aria-required={entry ? undefined : 'true'}
                aria-invalid={fieldState.invalid}
              />
              <FieldDescription>
                {entry
                  ? t('platform.dictionaries.form.codeFixed')
                  : t('platform.dictionaries.form.codeHint')}
              </FieldDescription>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        <div className='grid gap-4 sm:grid-cols-2'>
          {(
            [
              ['labelZh', 'platform.dictionaries.fields.labelZh'],
              ['labelEn', 'platform.dictionaries.fields.labelEn'],
            ] as const
          ).map(([name, key]) => (
            <Controller
              key={name}
              control={form.control}
              name={name}
              render={({ field, fieldState }) => (
                <Field data-invalid={fieldState.invalid}>
                  <FieldLabel htmlFor={`${formId}-${name}`}>
                    {t(key)}
                  </FieldLabel>
                  <Input
                    {...field}
                    id={`${formId}-${name}`}
                    autoComplete='off'
                    aria-invalid={fieldState.invalid}
                  />
                  <FieldError errors={[fieldState.error]} />
                </Field>
              )}
            />
          ))}
        </div>
        <Controller
          control={form.control}
          name='sortOrder'
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor={`${formId}-sortOrder`}>
                {t('platform.dictionaries.fields.sortOrder')}
                <span aria-hidden='true' className='text-destructive'>
                  *
                </span>
              </FieldLabel>
              <Input
                {...field}
                id={`${formId}-sortOrder`}
                inputMode='numeric'
                className='sm:w-40'
                aria-invalid={fieldState.invalid}
              />
              <FieldDescription>
                {t('platform.dictionaries.form.sortOrderHint')}
              </FieldDescription>
              <FieldError errors={[fieldState.error]} />
            </Field>
          )}
        />
        {definition.extraFields.length > 0 ? (
          <>
            <FieldSeparator />
            <FieldSet>
              <FieldLegend>
                {t('platform.dictionaries.fields.extra')}
              </FieldLegend>
              <FieldGroup>
                {definition.extraFields.map((extraField) => (
                  <Controller
                    key={extraField.name}
                    control={form.control}
                    name={`extra.${extraField.name}`}
                    render={({ field, fieldState }) => (
                      <ExtraFieldInput
                        id={`${formId}-extra-${extraField.name}`}
                        definition={extraField}
                        value={field.value}
                        name={field.name}
                        inputRef={field.ref}
                        onChange={field.onChange}
                        onBlur={field.onBlur}
                        error={fieldState.error}
                      />
                    )}
                  />
                ))}
              </FieldGroup>
            </FieldSet>
          </>
        ) : null}
      </FieldGroup>
    </form>
  );
}

interface ExtraFieldInputProps {
  readonly id: string;
  readonly definition: DictionaryExtraField;
  readonly value: unknown;
  readonly name: string;
  readonly inputRef: (element: HTMLElement | null) => void;
  readonly onChange: (value: unknown) => void;
  readonly onBlur: () => void;
  readonly error: { message?: string } | undefined;
}

/** One attribute of the type: a switch for a flag, a number input otherwise (blank = no limit when nullable). */
function ExtraFieldInput({
  id,
  definition,
  value,
  name,
  inputRef,
  onChange,
  onBlur,
  error,
}: ExtraFieldInputProps): ReactElement {
  const { t } = useTranslation();
  const label = t(`platform.dictionaries.extra.${definition.name}`);
  if (definition.type === 'enum')
    return (
      <Field data-invalid={error ? true : undefined}>
        <FieldLabel htmlFor={id}>
          {label}
          <span aria-hidden='true' className='text-destructive'>
            *
          </span>
        </FieldLabel>
        <Select
          value={typeof value === 'string' ? value : ''}
          onValueChange={onChange}
        >
          <SelectTrigger
            ref={inputRef}
            id={id}
            onBlur={onBlur}
            aria-invalid={error ? true : undefined}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
            {definition.options?.map((option) => (
              <SelectItem key={option} value={option}>
                {t(
                  `platform.dictionaries.extraOptions.${definition.name}.${option}`,
                )}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {definition.name === 'travelStandardKind' ? (
          <FieldDescription>
            {t('platform.dictionaries.travelStandardKindHelp')}
          </FieldDescription>
        ) : null}
        <FieldError errors={[error]} />
      </Field>
    );
  if (definition.type === 'boolean')
    return (
      <Field orientation='horizontal' data-invalid={error ? true : undefined}>
        <FieldContent>
          <FieldLabel htmlFor={id}>
            {label}
            <span aria-hidden='true' className='text-destructive'>
              *
            </span>
          </FieldLabel>
          <FieldError errors={[error]} />
        </FieldContent>
        <Switch
          ref={inputRef}
          id={id}
          checked={value === true}
          onCheckedChange={(checked) => onChange(checked)}
          onBlur={onBlur}
        />
      </Field>
    );
  return (
    <Field data-invalid={error ? true : undefined}>
      <FieldLabel htmlFor={id}>
        {label}
        {definition.nullable ? null : (
          <span aria-hidden='true' className='text-destructive'>
            *
          </span>
        )}
      </FieldLabel>
      <Input
        ref={inputRef}
        id={id}
        name={name}
        value={
          typeof value === 'string' || typeof value === 'number'
            ? String(value)
            : ''
        }
        onChange={(event) => onChange(event.target.value)}
        onBlur={onBlur}
        inputMode={definition.type === 'integer' ? 'numeric' : 'decimal'}
        className='sm:w-40'
        aria-invalid={error ? true : undefined}
      />
      {definition.nullable ? (
        <FieldDescription>
          {t('platform.dictionaries.form.blankUnlimited')}
        </FieldDescription>
      ) : null}
      <FieldError errors={[error]} />
    </Field>
  );
}
