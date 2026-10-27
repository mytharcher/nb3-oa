import { useRef, useState } from 'react';
import { useNavigate, useOutletContext, useParams } from 'react-router';
import {
  useApiClient,
  useNavigationGuard,
  useToaster,
} from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useResource } from '../approvals/use-resource.js';
import type {
  DefinitionView,
  ReviewSettings,
} from '../../../shared/approval-ai.js';
import { ApprovalAiError } from '#components/approval-ai/error';
import { Dialog, DialogTitle, DialogDescription } from '#components/ui/dialog';
import {
  FormDrawerContent,
  FormDrawerHeader,
  FormDrawerBody,
  FormDrawerFooter,
} from '#components/form-drawer';
import { Button } from '#components/ui/button';
import {
  FieldGroup,
  Field,
  FieldLabel,
  FieldDescription,
} from '#components/ui/field';
import { Input } from '#components/ui/input';
import { Switch } from '#components/ui/switch';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from '#components/ui/select';
import { Alert, AlertDescription } from '#components/ui/alert';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '#components/ui/alert-dialog';
import { Skeleton } from '#components/ui/skeleton';
export default function SettingsForm() {
  const { definitionId = '' } = useParams(),
    navigate = useNavigate(),
    api = useApiClient(),
    toaster = useToaster(),
    { t, i18n } = useTranslation(),
    parent = useOutletContext<{ reload: () => void }>();
  const definitions = useResource<DefinitionView[]>('approvalAi/definitions', {
      locale: i18n.language,
    }),
    models =
      useResource<{ modelService: string; model: string }[]>(
        'approvalAi/models',
      );
  const definition = definitions.data?.find((d) => d.id === definitionId);
  const [draft, setDraft] = useState<ReviewSettings>(),
    [error, setError] = useState<unknown>(),
    [pending, setPending] = useState(false),
    [confirm, setConfirm] = useState(false),
    [savedDefinition, setSavedDefinition] = useState<DefinitionView>();
  if (definition && !draft && !definitions.loading) {
    setDraft(definition.settings);
    setSavedDefinition(definition);
  }
  const savedRef = useRef(false);
  const [discard, setDiscard] = useState(false);
  const dirty =
    !!draft &&
    !!savedDefinition &&
    JSON.stringify(draft) !== JSON.stringify(savedDefinition.settings);
  useNavigationGuard(() => {
    if (savedRef.current) return true;
    if (pending) return false;
    if (dirty) {
      setDiscard(true);
      return false;
    }
    return true;
  });
  const close = () => {
    if (pending) return;
    if (dirty) setDiscard(true);
    else void navigate('..', { relative: 'route' });
  };
  async function save() {
    if (!draft || pending) return;
    setPending(true);
    setError(undefined);
    try {
      await api.request({
        method: 'PUT',
        path:
          'approvalAi/definitions/' +
          encodeURIComponent(definitionId) +
          '/settings',
        json: {
          enabled: draft.enabled,
          modelService: draft.modelService,
          model: draft.model,
          basis: draft.basis,
          timeoutSeconds: draft.timeoutSeconds,
          expectedVersion: draft.version,
        },
      });
      savedRef.current = true;
      toaster.show({ type: 'success', title: t('approvalAi.settingsSaved') });
      parent.reload();
      void navigate('..', { relative: 'route' });
    } catch (e) {
      setError(e);
      setConfirm(false);
    } finally {
      setPending(false);
    }
  }
  const modelValue = draft?.model
    ? JSON.stringify([draft.modelService, draft.model])
    : '';
  const choices = (models.data ?? []).map((m) => ({
    value: JSON.stringify([m.modelService, m.model]),
    label: m.modelService + ' / ' + m.model,
  }));
  if (modelValue && !choices.some((c) => c.value === modelValue))
    choices.unshift({
      value: modelValue,
      label:
        (draft?.modelService ?? '') +
        ' / ' +
        (draft?.model ?? '') +
        ' · ' +
        t('approvalAi.unavailable'),
    });
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) close();
      }}
    >
      <FormDrawerContent showCloseButton={!pending}>
        <form
          onSubmit={(event) => {
            event.preventDefault();
            if (savedDefinition?.settings.enabled && !draft?.enabled)
              setConfirm(true);
            else void save();
          }}
        >
          <FormDrawerHeader>
            <DialogTitle>
              {t('approvalAi.configure')} · {savedDefinition?.title ?? ''}
            </DialogTitle>
            <DialogDescription>
              {t('approvalAi.settingsDescription')}
            </DialogDescription>
          </FormDrawerHeader>
          <FormDrawerBody>
            {!!definitions.error && (
              <ApprovalAiError
                error={definitions.error}
                retry={definitions.reload}
              />
            )}
            {!!error && (
              <ApprovalAiError
                error={error}
                retry={() => {
                  setDraft(undefined);
                  definitions.reload();
                  setError(undefined);
                }}
              />
            )}
            {!definitions.loading && !definitions.error && !definition ? (
              <Alert>
                <AlertDescription>
                  {t('approvalAi.definitionMissing')}
                </AlertDescription>
              </Alert>
            ) : !draft ? (
              definitions.loading ? (
                <Skeleton
                  role='status'
                  aria-label={t('approvalAi.loading')}
                  className='h-40'
                />
              ) : null
            ) : (
              <FieldGroup>
                <Field orientation='horizontal'>
                  <FieldLabel htmlFor='ai-enabled'>
                    {t('approvalAi.enabled')}
                  </FieldLabel>
                  <Switch
                    id='ai-enabled'
                    checked={draft.enabled}
                    disabled={pending}
                    onCheckedChange={(enabled) =>
                      setDraft({ ...draft, enabled })
                    }
                  />
                </Field>
                <Field>
                  <FieldLabel htmlFor='ai-model'>
                    {t('approvalAi.model')}
                  </FieldLabel>
                  <Choice
                    id='ai-model'
                    value={modelValue}
                    disabled={pending || models.loading || !!models.error}
                    choices={[
                      { value: '', label: t('approvalAi.noModel') },
                      ...choices,
                    ]}
                    onChange={(value) => {
                      const [modelService, model] = value
                        ? (JSON.parse(value) as [string, string])
                        : [null, null];
                      setDraft({ ...draft, modelService, model });
                    }}
                  />
                  {!!models.error && (
                    <ApprovalAiError
                      error={models.error}
                      retry={models.reload}
                    />
                  )}
                  <FieldDescription>
                    {t('approvalAi.modelHint')}
                  </FieldDescription>
                </Field>
                {savedDefinition?.basis.map((slot) => (
                  <Field key={slot.key}>
                    <FieldLabel htmlFor={'basis-' + slot.key}>
                      {slot.title}
                      {slot.required ? ' · ' + t('approvalAi.required') : ''}
                    </FieldLabel>
                    <DocumentPicker
                      id={'basis-' + slot.key}
                      value={draft.basis[slot.key] ?? ''}
                      disabled={pending}
                      onChange={(value) =>
                        setDraft({
                          ...draft,
                          basis: { ...draft.basis, [slot.key]: value || null },
                        })
                      }
                    />
                  </Field>
                ))}
                <Field>
                  <FieldLabel htmlFor='ai-timeout'>
                    {t('approvalAi.timeout')}
                  </FieldLabel>
                  <Input
                    id='ai-timeout'
                    type='number'
                    min={10}
                    max={600}
                    required
                    value={draft.timeoutSeconds}
                    disabled={pending}
                    onChange={(event) =>
                      setDraft({
                        ...draft,
                        timeoutSeconds: Number(event.target.value),
                      })
                    }
                  />
                </Field>
                <Alert>
                  <AlertDescription>{t('approvalAi.newOnly')}</AlertDescription>
                </Alert>
              </FieldGroup>
            )}
          </FormDrawerBody>
          <FormDrawerFooter>
            <Button
              type='button'
              variant='outline'
              disabled={pending}
              onClick={close}
            >
              {t('approvalAi.cancel')}
            </Button>
            <Button
              type='submit'
              disabled={!draft || pending || !!definitions.error}
            >
              {t('approvalAi.' + (pending ? 'saving' : 'save'))}
            </Button>
          </FormDrawerFooter>
        </form>
        <AlertDialog
          open={confirm}
          onOpenChange={(open) => {
            if (!pending) setConfirm(open);
          }}
        >
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t('approvalAi.disableTitle', { name: savedDefinition?.title })}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t('approvalAi.disableDescription')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={pending}>
                {t('approvalAi.cancel')}
              </AlertDialogCancel>
              <Button
                variant='destructive'
                disabled={pending}
                onClick={() => void save()}
              >
                {t('approvalAi.' + (pending ? 'saving' : 'disable'))}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <AlertDialog open={discard} onOpenChange={setDiscard}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>
                {t('approvalAi.discardTitle')}
              </AlertDialogTitle>
              <AlertDialogDescription>
                {t('approvalAi.discardDescription')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('approvalAi.cancel')}</AlertDialogCancel>
              <Button
                onClick={() => {
                  savedRef.current = true;
                  void navigate('..', { relative: 'route' });
                }}
              >
                {t('approvalAi.discard')}
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </FormDrawerContent>
    </Dialog>
  );
}
function Choice({
  id,
  value,
  choices,
  onChange,
  disabled,
}: {
  id: string;
  value: string;
  choices: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
}) {
  return (
    <Select
      items={choices}
      value={value}
      onValueChange={(v) => onChange(v ?? '')}
      disabled={disabled}
    >
      <SelectTrigger id={id} className='w-full'>
        <SelectValue />
      </SelectTrigger>
      <SelectContent className='w-auto max-w-(--available-width) min-w-(--anchor-width)'>
        <SelectGroup>
          {choices.map((c) => (
            <SelectItem
              key={c.value}
              value={c.value}
              className='whitespace-normal wrap-anywhere'
            >
              {c.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
function DocumentPicker({
  id,
  value,
  onChange,
  disabled,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const resource = useResource<{ id: string; title: string }[]>(
    'knowledge/documents',
    { q: search, page: '1', pageSize: '20' },
  );
  const choices = [
    { value: '', label: t('approvalAi.noBasis') },
    ...(resource.data ?? []).map((d) => ({ value: d.id, label: d.title })),
  ];
  if (value && !choices.some((c) => c.value === value))
    choices.push({ value, label: value });
  return (
    <>
      <Input
        aria-label={t('approvalAi.searchBasis')}
        placeholder={t('approvalAi.searchBasis')}
        disabled={disabled}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />
      <Choice
        id={id}
        value={value}
        choices={choices}
        onChange={onChange}
        disabled={disabled || resource.loading || !!resource.error}
      />
      {!!resource.error && (
        <ApprovalAiError error={resource.error} retry={resource.reload} />
      )}
      <FieldDescription>{t('approvalAi.basisHint')}</FieldDescription>
    </>
  );
}
