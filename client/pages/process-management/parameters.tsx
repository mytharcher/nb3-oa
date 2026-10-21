import { zodResolver } from '@hookform/resolvers/zod';
import { useApiClient, useToaster } from '@nocobase/app-client';
import { useLocale, useTranslation } from '@nocobase/i18n/client';
import { AlertCircleIcon } from 'lucide-react';
import { type FormEvent, type ReactElement, useMemo, useRef } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { z } from 'zod';

import { SessionExpiredAlert } from '#components/session-expired-alert';
import { Alert, AlertDescription } from '#components/ui/alert';
import { Badge } from '#components/ui/badge';
import { Button } from '#components/ui/button';
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '#components/ui/field';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from '#components/ui/input-group';
import { Textarea } from '#components/ui/textarea';

import {
  formatRuleValue,
  isNumericRule,
  ruleKeyId,
} from '../platform/approval-rules/rule-format.js';
import {
  ruleInputOf,
  ruleInputSchema,
  ruleValueOf,
} from '../platform/approval-rules/rule-value.js';
import {
  effectiveFromOf,
  type EffectiveMode,
} from '../platform/shared/effective-from-value.js';
import { EffectiveFromFields } from '../platform/shared/effective-from.js';
import {
  fieldViolationsOf,
  metadataOf,
  reasonOf,
  statusOf,
} from '../platform/shared/errors.js';
import { FieldsSkeleton } from '../platform/shared/states.js';
import type { RuleSummary } from '../platform/shared/types.js';
import {
  flowsUsingRule,
  hasVendorNodeSettings,
  parameterInputId,
  rulesForNode,
} from './node-settings.js';
import { Failure } from './shared.js';
import { useProcessText } from './text.js';
import type { useNodeSettings } from './use-node-settings.js';

const FORM_ID = 'process-parameters';

interface Parameter {
  readonly rule: RuleSummary;
  /** The steps that read this parameter, in diagram order. */
  readonly nodes: readonly string[];
}

/**
 * Every parameter a process reads, once each, edited together: the changed values become versions sharing one
 * effective time and note, saved all or none.
 */
export function ProcessParameters({
  kind,
  states,
  settings,
  onSaved,
}: {
  readonly kind: string;
  readonly states: readonly string[];
  readonly settings: ReturnType<typeof useNodeSettings>;
  readonly onSaved: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const bound = new Map<string, string[]>();
  for (const state of states)
    for (const key of rulesForNode(kind, state))
      bound.set(key, [...(bound.get(key) ?? []), state]);
  const vendor = states.some((state) => hasVendorNodeSettings(kind, state));
  const { rules } = settings;

  const notice = (content: ReactElement) => (
    <div className='px-6'>{content}</div>
  );
  if (!bound.size)
    return notice(
      <p className='text-sm text-muted-foreground'>
        {t(
          vendor
            ? 'processManagement.parameters.onNodes'
            : 'processManagement.parameters.none',
        )}
      </p>,
    );
  if (!settings.canReadRules)
    return notice(
      settings.rulesPending ? (
        <FieldsSkeleton fields={3} />
      ) : (
        <p className='text-sm text-muted-foreground'>
          {t('processManagement.parameters.forbidden')}
        </p>
      ),
    );
  if (rules.error && !rules.data)
    return notice(<Failure error={rules.error} retry={rules.reload} />);
  if (!rules.data) return notice(<FieldsSkeleton fields={3} />);

  const parameters = [...bound].flatMap(([key, nodes]) => {
    const rule = rules.data?.data.find((item) => item.key === key);
    return rule && isNumericRule(rule) ? [{ rule, nodes }] : [];
  });
  // A new version of any parameter remounts the form, so its defaults are the values now in effect.
  const versions = JSON.stringify(
    parameters.map(({ rule }) => [
      rule.current?.id,
      rule.scheduled.map((version) => version.id),
    ]),
  );
  return (
    <>
      {!!rules.error &&
        notice(<Failure error={rules.error} retry={rules.reload} />)}
      <ParametersForm
        key={versions}
        kind={kind}
        parameters={parameters}
        editable={settings.canUpdateRules}
        disabled={rules.loading}
        onSaved={() => {
          rules.reload();
          onSaved();
        }}
      />
    </>
  );
}

function ParametersForm({
  kind,
  parameters,
  editable,
  disabled,
  onSaved,
}: {
  readonly kind: string;
  readonly parameters: readonly Parameter[];
  readonly editable: boolean;
  readonly disabled: boolean;
  readonly onSaved: () => void;
}): ReactElement {
  const { t } = useTranslation();
  const { locale } = useLocale();
  const text = useProcessText();
  const api = useApiClient();
  const toaster = useToaster();
  const submittingRef = useRef(false);
  const list = (items: string[]) =>
    items.join(locale.startsWith('zh') ? '、' : ', ');

  const schema = useMemo(
    () =>
      z
        .object({
          values: z.object(
            Object.fromEntries(
              parameters.map(({ rule }) => [
                ruleKeyId(rule.key),
                ruleInputSchema(rule, t),
              ]),
            ),
          ),
          mode: z.enum(['now', 'date']),
          date: z.date().optional(),
          note: z
            .string()
            .trim()
            .max(500, t('platform.rules.errors.noteTooLong', { max: 500 })),
        })
        .refine(
          (values) => values.mode === 'now' || values.date !== undefined,
          {
            path: ['date'],
            message: t('platform.rules.effective.dateRequired'),
          },
        ),
    [parameters, t],
  );
  const form = useForm({
    resolver: zodResolver(schema),
    defaultValues: {
      values: Object.fromEntries(
        parameters.map(({ rule }) => [ruleKeyId(rule.key), ruleInputOf(rule)]),
      ),
      mode: 'now' as EffectiveMode,
      date: undefined as Date | undefined,
      note: '',
    },
  });
  const mode = useWatch({ control: form.control, name: 'mode' });
  const typed = useWatch({ control: form.control, name: 'values' });
  const changed = (rule: RuleSummary, input = typed[ruleKeyId(rule.key)]) => {
    const value = (input ?? '').trim();
    return value === '' || Number(value) !== Number(ruleInputOf(rule));
  };
  const changes = parameters.filter(({ rule }) => changed(rule));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    await form.handleSubmit(async (values) => {
      const pending = parameters.filter(({ rule }) =>
        changed(rule, values.values[ruleKeyId(rule.key)]),
      );
      if (!editable || submittingRef.current || !pending.length) return;
      submittingRef.current = true;
      try {
        await api.request({
          path: 'approvalRules/versions',
          method: 'POST',
          json: {
            changes: pending.map(({ rule }) => ({
              key: rule.key,
              value: ruleValueOf(rule, values.values[ruleKeyId(rule.key)]),
            })),
            effectiveFrom: effectiveFromOf(values.mode, values.date),
            note: values.note || null,
          },
        });
      } catch (error: unknown) {
        const status = statusOf(error);
        const reason = reasonOf(error);
        const metadata = metadataOf(error);
        const field = (key: string | undefined) =>
          parameters.some(({ rule }) => rule.key === key)
            ? (`values.${ruleKeyId(key!)}` as const)
            : undefined;
        if (status === 401) form.setError('root', { type: 'sessionExpired' });
        else if (
          reason === 'RULE_EFFECTIVE_IN_PAST' ||
          (status === 400 && fieldViolationsOf(error).includes('effectiveFrom'))
        )
          form.setError(
            'date',
            { message: t('platform.rules.effective.pastError') },
            { shouldFocus: true },
          );
        else if (reason === 'RULE_INVALID_VALUE' && field(metadata.key))
          form.setError(
            field(metadata.key)!,
            { message: t('platform.rules.errors.invalidValue') },
            { shouldFocus: true },
          );
        else if (
          reason === 'RULE_ORDER_VIOLATED' &&
          (field(metadata.lower) || field(metadata.upper))
        ) {
          // Name both sides of the ordering that the parameters here take part in.
          for (const key of [metadata.upper, metadata.lower])
            if (field(key))
              form.setError(
                field(key)!,
                { message: t('processManagement.parameters.orderViolated') },
                { shouldFocus: true },
              );
        } else
          form.setError('root', {
            message:
              reason === 'RULE_ORDER_VIOLATED'
                ? t('platform.rules.errors.orderViolated')
                : reason === 'RULE_VERSION_EXISTS'
                  ? t('platform.rules.errors.versionExists')
                  : status === 403
                    ? t('platform.common.writeForbidden')
                    : t('platform.common.saveFailed'),
          });
        return;
      } finally {
        submittingRef.current = false;
      }
      toaster.show({
        type: 'success',
        title: t('processManagement.parameters.saved', {
          count: pending.length,
        }),
      });
      onSaved();
    })(event);
  };

  const rootError = form.formState.errors.root;
  const submitting = form.formState.isSubmitting;
  const locked = !editable || disabled || submitting;

  return (
    <form
      id={FORM_ID}
      noValidate
      onSubmit={(event) => void submit(event)}
      className='flex min-h-0 flex-1 flex-col'
    >
      <div className='min-h-0 flex-1 overflow-y-auto overscroll-contain px-6'>
        <FieldGroup>
          {rootError?.type === 'sessionExpired' ? (
            <SessionExpiredAlert />
          ) : rootError ? (
            <Alert variant='destructive'>
              <AlertCircleIcon />
              <AlertDescription>{rootError.message}</AlertDescription>
            </Alert>
          ) : null}
          {parameters.map(({ rule, nodes }) => {
            const id = parameterInputId(rule.key);
            const others = flowsUsingRule(rule.key).filter(
              (flow) => flow !== kind,
            );
            const next = rule.scheduled[0];
            return (
              <Controller
                key={rule.key}
                control={form.control}
                name={`values.${ruleKeyId(rule.key)}`}
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <div className='flex flex-wrap items-center gap-x-2 gap-y-1'>
                      <FieldLabel htmlFor={id}>
                        {t(`platform.rules.keys.${ruleKeyId(rule.key)}.label`)}
                      </FieldLabel>
                      {nodes.map((node) => (
                        <Badge key={node} variant='secondary'>
                          {text.state(node)}
                        </Badge>
                      ))}
                      {changed(rule, field.value) && (
                        <span className='text-xs text-primary'>
                          {t('processManagement.parameters.changed')}
                        </span>
                      )}
                    </div>
                    <InputGroup>
                      <InputGroupInput
                        {...field}
                        id={id}
                        inputMode='decimal'
                        autoComplete='off'
                        readOnly={!editable}
                        disabled={editable && locked}
                        aria-invalid={fieldState.invalid}
                      />
                      <InputGroupAddon align='inline-end'>
                        <InputGroupText>
                          {t(`platform.rules.unitSuffix.${rule.type}`)}
                        </InputGroupText>
                      </InputGroupAddon>
                    </InputGroup>
                    <FieldDescription>
                      {t(
                        `platform.rules.keys.${ruleKeyId(rule.key)}.description`,
                        {
                          defaultValue: '',
                        },
                      )}
                      {next &&
                        ` ${t('processManagement.parameters.scheduled', {
                          value: formatRuleValue(
                            t,
                            locale,
                            rule.type,
                            next.value,
                          ),
                          date: new Date(next.effectiveFrom).toLocaleDateString(
                            locale,
                          ),
                        })}`}
                      {others.length > 0 &&
                        ` ${t('processManagement.nodeSettings.shared', {
                          flows: list(others.map(text.name)),
                        })}`}
                    </FieldDescription>
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            );
          })}
          {editable && (
            <>
              <FieldSeparator />
              <Controller
                control={form.control}
                name='date'
                render={({ field, fieldState }) => (
                  <EffectiveFromFields
                    formId={FORM_ID}
                    mode={mode}
                    date={field.value}
                    onModeChange={(next) => form.setValue('mode', next)}
                    onDateChange={field.onChange}
                    dateError={fieldState.error?.message}
                    disabled={locked}
                  />
                )}
              />
              <Controller
                control={form.control}
                name='note'
                render={({ field, fieldState }) => (
                  <Field data-invalid={fieldState.invalid}>
                    <FieldLabel htmlFor={`${FORM_ID}-note`}>
                      {t('platform.rules.fields.note')}
                    </FieldLabel>
                    <Textarea
                      {...field}
                      id={`${FORM_ID}-note`}
                      rows={2}
                      disabled={locked}
                      aria-invalid={fieldState.invalid}
                    />
                    <FieldError errors={[fieldState.error]} />
                  </Field>
                )}
              />
            </>
          )}
        </FieldGroup>
      </div>
      <div className='flex shrink-0 flex-wrap items-center justify-end gap-2 border-t px-6 pt-4'>
        <p className='mr-auto text-xs text-muted-foreground'>
          {t(
            editable
              ? 'processManagement.nodeSettings.effect'
              : 'processManagement.parameters.readOnly',
          )}
        </p>
        {editable && (
          <>
            <Button
              type='button'
              variant='outline'
              disabled={submitting || !changes.length}
              onClick={() => form.reset()}
            >
              {t('processManagement.parameters.discard')}
            </Button>
            <Button type='submit' disabled={locked || !changes.length}>
              {t(
                submitting
                  ? 'actions.saving'
                  : 'processManagement.parameters.save',
                { count: changes.length },
              )}
            </Button>
          </>
        )}
      </div>
    </form>
  );
}
