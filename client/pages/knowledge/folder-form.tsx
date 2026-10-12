import { useParams, useOutletContext } from 'react-router';
import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from '@nocobase/i18n/client';
import { useToaster } from '@nocobase/app-client';
import { RouteDialog } from '#components/route-dialog';
import { useRouteOverlay } from '#components/use-route-overlay';
import { Button } from '#components/ui/button';
import { Input } from '#components/ui/input';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from '#components/ui/field';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from '#components/ui/select';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '#components/ui/alert-dialog';
import { statusOf, fieldViolationsOf } from '../platform/shared/errors.js';
import { isDenied } from './resource.js';
import { useKnowledgeResource } from './resource.js';
import { useKnowledgeCommand } from './command.js';
import { KnowledgeError, KnowledgeSkeleton } from './states.js';
import { KnowledgeIdentity } from './identity.js';
import { KnowledgeDiscard } from './guard.js';
import { useKnowledgeGuard } from './use-guard.js';
import { selectWidth, type Folder, type Context } from './types.js';
export default function KnowledgeFolderForm() {
  const { folderId } = useParams();
  return (
    <KnowledgeIdentity>
      <Body key={folderId ?? 'new'} />
    </KnowledgeIdentity>
  );
}
function Body() {
  const { folderId } = useParams(),
    { t } = useTranslation(),
    r = useKnowledgeResource<{ data: Folder[] }>('knowledge/folders'),
    existing = r.data?.data.find((x) => x.id === folderId),
    [dirty, setDirty] = useState(false),
    [draftTitle, setDraftTitle] = useState(''),
    command = useKnowledgeCommand(() => setDirty(false)),
    guard = useKnowledgeGuard(command.busy, dirty);
  return (
    <RouteDialog
      title={t(`knowledge.${folderId ? 'editFolder' : 'newFolder'}`)}
      beforeClose={guard.beforeClose}
      footer={
        <Footer
          busy={command.busy}
          current={
            !r.loading &&
            !r.error &&
            !isDenied(command.error) &&
            (!folderId || !!existing)
          }
        />
      }
    >
      {isDenied(command.error) ? (
        <KnowledgeError error={command.error} />
      ) : r.error ? (
        <KnowledgeError error={r.error} retry={r.reload} />
      ) : r.loading ? (
        <KnowledgeSkeleton />
      ) : folderId && !existing ? (
        <KnowledgeError error={undefined} unavailable />
      ) : (
        <Fields
          key={`${folderId ?? 'new'}:${existing?.version ?? 'new'}`}
          existing={existing}
          folders={r.data?.data ?? []}
          command={command}
          dirty={setDirty}
          onTitle={setDraftTitle}
          guard={guard}
          reload={r.invalidate}
        />
      )}
      <KnowledgeDiscard
        guard={guard}
        name={existing?.title ?? (draftTitle || t('knowledge.newFolder'))}
      />
    </RouteDialog>
  );
}
function Footer({ busy, current }: { busy: boolean; current: boolean }) {
  const { close } = useRouteOverlay(),
    { t } = useTranslation();
  return (
    <>
      <Button variant='outline' disabled={busy} onClick={() => void close()}>
        {t('knowledge.cancel')}
      </Button>
      <Button form='knowledge-folder' type='submit' disabled={busy || !current}>
        {t(busy ? 'knowledge.saving' : 'knowledge.saveFolder')}
      </Button>
    </>
  );
}
function Fields({
  existing,
  folders,
  command,
  dirty,
  onTitle,
  guard,
  reload,
}: {
  existing?: Folder;
  folders: Folder[];
  command: ReturnType<typeof useKnowledgeCommand>;
  dirty: (v: boolean) => void;
  onTitle: (v: string) => void;
  guard: ReturnType<typeof useKnowledgeGuard>;
  reload: () => void;
}) {
  const { t } = useTranslation(),
    { close } = useRouteOverlay(),
    parent = useOutletContext<Context>(),
    toast = useToaster(),
    [cas, setCas] = useState(false);
  const schema = z.object({
    title: z
      .string()
      .trim()
      .min(1, t('knowledge.required'))
      .max(200, t('knowledge.titleTooLong')),
    parentId: z.string(),
  });
  const form = useForm({
    resolver: zodResolver(schema),
    mode: 'onBlur',
    defaultValues: {
      title: existing?.title ?? '',
      parentId: existing?.parentId ?? 'root',
    },
  });
  useEffect(() => {
    let focused = false;
    for (const name of fieldViolationsOf(command.error)) {
      if (name === 'title' || name === 'parentId') {
        form.setError(name, { message: t('knowledge.invalidField') });
        if (!focused) {
          form.setFocus(name);
          focused = true;
        }
      }
    }
  }, [command.error, form, t]);
  return (
    <>
      <form
        id='knowledge-folder'
        className='flex flex-col gap-5'
        onChange={() => {
          guard.markUnsaved();
          dirty(true);
        }}
        onSubmit={(event) => {
          guard.markUnsaved();
          void form.handleSubmit(async (v) => {
            const result = await command.execute<{ data: Folder }>(
              'knowledge/folders',
              'POST',
              {
                ...(existing
                  ? { id: existing.id, expectedVersion: existing.version }
                  : {}),
                title: v.title,
                parentId: v.parentId === 'root' ? null : v.parentId,
              },
            );
            if (result) {
              guard.markSaved();
              dirty(false);
              parent.reload();
              toast.show({
                type: 'success',
                title: t('knowledge.folderSaved'),
              });
              await close();
            }
          })(event);
        }}
      >
        <FieldGroup>
          <Field data-invalid={!!form.formState.errors.title}>
            <FieldLabel htmlFor='folder-title'>
              {t('knowledge.titleField')} *
            </FieldLabel>
            <Input
              id='folder-title'
              disabled={command.busy}
              aria-invalid={!!form.formState.errors.title}
              aria-describedby='folder-title-error'
              {...form.register('title')}
              onChange={(e) => {
                void form.register('title').onChange(e);
                onTitle(e.target.value);
              }}
            />
            <FieldError id='folder-title-error'>
              {form.formState.errors.title?.message}
            </FieldError>
          </Field>
          <Field>
            <FieldLabel htmlFor='folder-parent'>
              {t('knowledge.parent')}
            </FieldLabel>
            <Controller
              control={form.control}
              name='parentId'
              render={({ field }) => (
                <Select
                  value={field.value}
                  disabled={command.busy}
                  onValueChange={(v) => {
                    field.onChange(v);
                    dirty(true);
                  }}
                >
                  <SelectTrigger
                    id='folder-parent'
                    aria-invalid={!!form.formState.errors.parentId}
                    aria-describedby='folder-parent-error'
                    ref={field.ref}
                    onBlur={field.onBlur}
                  >
                    <SelectValue>
                      {field.value === 'root'
                        ? t('knowledge.root')
                        : (folders.find((x) => x.id === field.value)?.title ??
                          t('knowledge.restrictedOption'))}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent className={selectWidth}>
                    <SelectGroup>
                      <SelectItem value='root'>
                        {t('knowledge.root')}
                      </SelectItem>
                      {folders
                        .filter((x) => x.id !== existing?.id)
                        .map((x) => (
                          <SelectItem key={x.id} value={x.id}>
                            {x.title}
                          </SelectItem>
                        ))}
                    </SelectGroup>
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError id='folder-parent-error'>
              {form.formState.errors.parentId?.message}
            </FieldError>
          </Field>
        </FieldGroup>
        {command.error ? (
          <>
            <KnowledgeError error={command.error} />
            {statusOf(command.error) === 409 && existing ? (
              <Button
                type='button'
                variant='outline'
                disabled={command.busy}
                onClick={() => setCas(true)}
              >
                {t('knowledge.loadLatest')}
              </Button>
            ) : null}
          </>
        ) : null}
      </form>
      <AlertDialog open={cas} onOpenChange={setCas}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('knowledge.loadLatest')} —{' '}
              {existing?.title ??
                (form.getValues('title') || t('knowledge.newFolder'))}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t('knowledge.replaceDraft')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('knowledge.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              variant='destructive'
              onClick={() => {
                dirty(false);
                reload();
                setCas(false);
              }}
            >
              {t('knowledge.loadLatest')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
