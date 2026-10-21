import { useFormDiscardGuard } from '#hooks/use-form-discard-guard';
import {
  FormDrawerContent,
  FormDrawerHeader,
  FormDrawerBody,
  FormDrawerFooter,
} from '#components/form-drawer';
import { LoadFailure } from '../../components/load-failure.js';
import { responseStatus } from '../../components/response-status.js';
import { useToaster } from '@nocobase/app-client';
import { ApplicationSearch } from '#components/application-search';
import { ApplicationTableEmpty } from '#components/application-table-empty';
import { ApplicationTableSkeleton } from '#components/application-table-skeleton';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '#components/ui/dropdown-menu';
import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from '#components/ui/tooltip';
import { ApplicationToolbar } from '#components/application-toolbar';
import { ResponsiveTable as Table } from '#components/responsive-table';
import { PageContainer } from '../components/page-container.js';
import { Spinner } from '#components/ui/spinner';
import { PageHeader } from '../components/page-header.js';
import { useTranslation } from '@nocobase/i18n/client';
import {
  Check,
  Copy,
  Plus,
  Trash2,
  MoreHorizontal,
  ArrowUpDown,
} from 'lucide-react';
import {
  useCallback,
  useEffect,
  useState,
  type FormEvent,
  type ReactElement,
} from 'react';

import { useAuthenticationClient } from '@nocobase/app-plugin-authentication/client';

import type { ApiKeySummary } from '../api-keys-client.js';
import { Badge } from '#components/ui/badge';
import { Button } from '#components/ui/button';
import { Dialog, DialogDescription, DialogTitle } from '#components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '#components/ui/alert-dialog';
import { Alert, AlertDescription } from '#components/ui/alert';
import { Input } from '#components/ui/input';
import { Label } from '#components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import {
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '#components/ui/table';
import {
  API_KEY_EXPIRY_CHOICES,
  expiryChoiceToSeconds,
  formatKeyHint,
  isExpired,
  type ApiKeyExpiryChoice,
} from '../expiry.js';

export default function ApiKeysPage(): ReactElement {
  const { t, i18n } = useTranslation('@nocobase/app-plugin-api-keys');
  const auth = useAuthenticationClient();
  const toaster = useToaster();
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<'lastRequest' | 'expiresAt'>('lastRequest');
  const [descending, setDescending] = useState(true);
  const [keys, setKeys] = useState<readonly ApiKeySummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const [mutationError, setMutationError] = useState<string>();
  const [creating, setCreating] = useState(false);
  const [revoking, setRevoking] = useState<ApiKeySummary>();
  // Held only until the reveal dialog closes. The server never returns it again.
  const [issued, setIssued] = useState<{ name: string; key: string }>();

  const load = useCallback(async () => {
    setLoading(true);
    setError(undefined);
    try {
      const { data, error: reason } = await auth.apiKey.list();
      if (reason)
        throw Object.assign(
          new Error('API key list request failed', { cause: reason }),
          { status: responseStatus(reason) },
        );
      setKeys(data?.apiKeys ?? []);
    } catch (cause) {
      setError(cause);
      if ([401, 403, 404].includes(responseStatus(cause) ?? 0)) setKeys([]);
    } finally {
      setLoading(false);
    }
  }, [auth]);

  useEffect(() => {
    // Loading the list is what this page mounts to do; `load` sets its
    // pending flag before the first await, which the rule cannot see past.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
  }, [load]);

  const create = async (
    name: string,
    expiry: ApiKeyExpiryChoice,
  ): Promise<void> => {
    setBusy(true);
    setMutationError(undefined);
    try {
      const expiresIn = expiryChoiceToSeconds(expiry);
      const { data, error: reason } = await auth.apiKey.create({
        name,
        ...(expiresIn === undefined ? {} : { expiresIn }),
      });
      if (reason) throw new Error(reason.message);
      if (!data?.key) throw new Error(t('errors.createFailed'));
      setCreating(false);
      setIssued({ name, key: data.key });
      await load();
    } catch {
      setMutationError(t('errors.createFailed'));
    } finally {
      setBusy(false);
    }
  };

  const revoke = async (key: ApiKeySummary): Promise<void> => {
    setBusy(true);
    setMutationError(undefined);
    try {
      const { error: reason } = await auth.apiKey.delete({ keyId: key.id });
      if (reason) throw new Error(reason.message);
      toaster.show({
        type: 'success',
        title: t('revoke.success', { name: key.name ?? t('page.unnamed') }),
      });
      setRevoking(undefined);
      await load();
    } catch {
      setMutationError(t('errors.revokeFailed'));
    } finally {
      setBusy(false);
    }
  };

  const formatDate = (value: Date | string | null): string =>
    value ? new Date(value).toLocaleString(i18n.language) : t('page.never');

  const visible = keys
    .filter(
      (key) =>
        !search.trim() ||
        (key.name ?? '')
          .toLocaleLowerCase()
          .includes(search.trim().toLocaleLowerCase()),
    )
    .sort((a, b) => {
      const left = a[sort] ? new Date(a[sort]).getTime() : null;
      const right = b[sort] ? new Date(b[sort]).getTime() : null;
      if (left === null) return right === null ? 0 : 1;
      if (right === null) return -1;
      return (left - right) * (descending ? -1 : 1);
    });
  return (
    <PageContainer>
      <PageHeader title={t('page.title')} description={t('page.description')} />
      <ApplicationToolbar
        actions={
          <Button
            onClick={() => {
              setMutationError(undefined);
              setCreating(true);
            }}
          >
            <Plus /> {t('page.add')}
          </Button>
        }
      >
        <ApplicationSearch
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          aria-label={t('page.search')}
          placeholder={t('page.search')}
        />
      </ApplicationToolbar>

      {error ? (
        <LoadFailure
          error={error}
          message={t(
            responseStatus(error) === 403
              ? 'errors.forbidden'
              : responseStatus(error) === 404
                ? 'errors.notFound'
                : 'errors.loadFailed',
          )}
          retryLabel={t('page.retry')}
          onRetry={() => void load()}
        />
      ) : null}

      {loading && keys.length === 0 ? (
        <ApplicationTableSkeleton />
      ) : error && keys.length === 0 ? null : visible.length === 0 ? (
        <ApplicationTableEmpty
          title={t(search ? 'page.noResults' : 'page.empty')}
          clearFilters={
            search
              ? { label: t('page.clear'), onClick: () => setSearch('') }
              : undefined
          }
        />
      ) : (
        <div className='overflow-hidden rounded-xl border bg-card'>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t('page.columns.name')}</TableHead>
                <TableHead>{t('page.columns.key')}</TableHead>
                <TableHead>{t('page.columns.status')}</TableHead>
                {(['lastRequest', 'expiresAt'] as const).map((field) => (
                  <TableHead
                    key={field}
                    aria-sort={
                      sort === field
                        ? descending
                          ? 'descending'
                          : 'ascending'
                        : 'none'
                    }
                  >
                    <Button
                      variant='ghost'
                      size='sm'
                      onClick={() => {
                        if (sort === field) setDescending((value) => !value);
                        else {
                          setSort(field);
                          setDescending(true);
                        }
                      }}
                    >
                      {t(
                        field === 'lastRequest'
                          ? 'page.columns.lastUsed'
                          : 'page.columns.expires',
                      )}
                      <ArrowUpDown />
                    </Button>
                  </TableHead>
                ))}
                <TableHead className='w-14'>
                  <span className='sr-only'>{t('page.columns.actions')}</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {visible.map((key) => (
                <TableRow key={key.id}>
                  <TableCell className='font-medium'>
                    {key.name ?? t('page.unnamed')}
                  </TableCell>
                  <TableCell className='font-mono text-xs text-muted-foreground'>
                    {formatKeyHint(key)}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        key.enabled && !isExpired(key.expiresAt)
                          ? 'default'
                          : 'secondary'
                      }
                    >
                      {!key.enabled
                        ? t('page.disabled')
                        : isExpired(key.expiresAt)
                          ? t('page.expired')
                          : t('page.active')}
                    </Badge>
                  </TableCell>
                  <TableCell className='text-sm text-muted-foreground'>
                    {key.lastRequest
                      ? formatDate(key.lastRequest)
                      : t('page.unused')}
                  </TableCell>
                  <TableCell className='text-sm text-muted-foreground'>
                    {formatDate(key.expiresAt)}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger
                        render={
                          <Button
                            variant='ghost'
                            size='icon-sm'
                            aria-label={t('page.actions.menu', {
                              name: key.name ?? t('page.unnamed'),
                            })}
                          />
                        }
                      >
                        <MoreHorizontal />
                      </DropdownMenuTrigger>
                      <DropdownMenuContent
                        align='end'
                        className='w-auto min-w-40'
                      >
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          variant='destructive'
                          onClick={() => {
                            setMutationError(undefined);
                            setRevoking(key);
                          }}
                        >
                          <Trash2 />
                          {t('page.actions.revoke')}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      <CreateKeyDialog
        open={creating}
        busy={busy}
        error={mutationError}
        onOpenChange={setCreating}
        onSubmit={create}
      />
      <RevealKeyDialog issued={issued} onClose={() => setIssued(undefined)} />
      <RevokeKeyDialog
        target={revoking}
        busy={busy}
        error={mutationError}
        onCancel={() => setRevoking(undefined)}
        onConfirm={revoke}
      />
    </PageContainer>
  );
}

function CreateKeyDialog({
  open,
  busy,
  error,
  onOpenChange,
  onSubmit,
}: {
  readonly open: boolean;
  readonly busy: boolean;
  readonly error?: string;
  readonly onOpenChange: (open: boolean) => void;
  readonly onSubmit: (
    name: string,
    expiry: ApiKeyExpiryChoice,
  ) => Promise<void>;
}): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-api-keys');
  const [name, setName] = useState('');
  const [validated, setValidated] = useState(false);
  const [expiry, setExpiry] = useState<ApiKeyExpiryChoice>('90');

  const submit = (event: FormEvent): void => {
    event.preventDefault();
    setValidated(true);
    if (!name.trim()) {
      document.getElementById('api-key-name')?.focus();
      return;
    }
    void onSubmit(name.trim(), expiry);
  };

  const guard = useFormDiscardGuard(!!name || expiry !== '90', busy);
  const close = () => {
    void guard.requestClose(() => {
      setName('');
      setExpiry('90');
      onOpenChange(false);
    });
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) close();
        else onOpenChange(next);
      }}
    >
      <FormDrawerContent>
        <form onSubmit={submit} noValidate className='flex flex-col gap-4'>
          <FormDrawerHeader>
            <DialogTitle>{t('form.title')}</DialogTitle>
            <DialogDescription>{t('form.description')}</DialogDescription>
          </FormDrawerHeader>
          <FormDrawerBody>
            <div className='flex flex-col gap-2'>
              <Label htmlFor='api-key-name'>
                {t('form.name')}
                <span aria-hidden='true' className='text-destructive'>
                  *
                </span>
              </Label>
              <Input
                id='api-key-name'
                value={name}
                aria-required='true'
                aria-invalid={validated && !name.trim()}
                aria-describedby={
                  validated && !name.trim() ? 'api-key-name-error' : undefined
                }
                maxLength={32}
                placeholder={t('form.namePlaceholder')}
                onChange={(event) => setName(event.target.value)}
              />
            </div>
            {validated && !name.trim() ? (
              <p
                id='api-key-name-error'
                role='alert'
                className='text-sm text-destructive'
              >
                {t('errors.nameRequired')}
              </p>
            ) : null}
            <div className='flex flex-col gap-2'>
              <Label>{t('form.expiry')}</Label>
              <Select
                items={API_KEY_EXPIRY_CHOICES.map((choice) => ({
                  value: choice,
                  label: t(`form.expiryChoices.${choice}`),
                }))}
                value={expiry}
                onValueChange={(value) =>
                  setExpiry(value as ApiKeyExpiryChoice)
                }
              >
                <SelectTrigger className='w-full'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                  {API_KEY_EXPIRY_CHOICES.map((choice) => (
                    <SelectItem key={choice} value={choice}>
                      {t(`form.expiryChoices.${choice}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {error ? (
              <Alert variant='destructive'>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : null}
          </FormDrawerBody>
          <FormDrawerFooter>
            <Button
              type='button'
              variant='outline'
              disabled={busy}
              onClick={close}
            >
              {t('form.cancel')}
            </Button>
            <Button type='submit' disabled={busy}>
              {busy ? (
                <Spinner
                  data-icon='inline-start'
                  aria-label={t('page.loading')}
                />
              ) : null}
              {t('form.create')}
            </Button>
          </FormDrawerFooter>
        </form>
      </FormDrawerContent>
      {guard.confirmation}
    </Dialog>
  );
}

function RevealKeyDialog({
  issued,
  onClose,
}: {
  readonly issued: { readonly name: string; readonly key: string } | undefined;
  readonly onClose: () => void;
}): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-api-keys');
  const [copied, setCopied] = useState(false);
  const [copyFailed, setCopyFailed] = useState(false);

  useEffect(() => {
    if (!copied) return undefined;
    const timer = window.setTimeout(() => setCopied(false), 2000);
    return () => window.clearTimeout(timer);
  }, [copied]);

  return (
    <Dialog
      open={issued !== undefined}
      onOpenChange={(next) => {
        if (!next) {
          setCopied(false);
          onClose();
        }
      }}
    >
      <FormDrawerContent>
        <FormDrawerHeader>
          <DialogTitle>{t('reveal.title')}</DialogTitle>
          <DialogDescription>
            {t('reveal.description', { name: issued?.name ?? '' })}
          </DialogDescription>
        </FormDrawerHeader>
        <FormDrawerBody>
          <div className='mt-4 flex items-center gap-2 rounded-lg border bg-muted/40 p-3'>
            <code className='flex-1 font-mono text-xs break-all'>
              {issued?.key}
            </code>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant='outline'
                    size='icon-sm'
                    aria-label={t('reveal.copy')}
                    onClick={() => {
                      if (!issued) return;
                      setCopyFailed(false);
                      void Promise.resolve()
                        .then(() => navigator.clipboard.writeText(issued.key))
                        .then(() => setCopied(true))
                        .catch(() => setCopyFailed(true));
                    }}
                  />
                }
              >
                {copied ? <Check /> : <Copy />}
              </TooltipTrigger>
              <TooltipContent>{t('reveal.copy')}</TooltipContent>
            </Tooltip>
          </div>
          {copyFailed ? (
            <Alert variant='destructive'>
              <AlertDescription>{t('errors.copyFailed')}</AlertDescription>
            </Alert>
          ) : null}
          <p className='mt-3 text-sm text-muted-foreground'>
            {t('reveal.usage')}
          </p>
        </FormDrawerBody>
        <FormDrawerFooter>
          <Button onClick={onClose}>{t('reveal.done')}</Button>
        </FormDrawerFooter>
      </FormDrawerContent>
    </Dialog>
  );
}

function RevokeKeyDialog({
  target,
  busy,
  error,
  onCancel,
  onConfirm,
}: {
  readonly target: ApiKeySummary | undefined;
  readonly busy: boolean;
  readonly error?: string;
  readonly onCancel: () => void;
  readonly onConfirm: (key: ApiKeySummary) => Promise<void>;
}): ReactElement {
  const { t } = useTranslation('@nocobase/app-plugin-api-keys');

  return (
    <AlertDialog
      open={target !== undefined}
      onOpenChange={(next) => {
        if (!next && !busy) onCancel();
      }}
    >
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {t('revoke.title', { name: target?.name ?? t('page.unnamed') })}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {t('revoke.description', {
              name: target?.name ?? t('page.unnamed'),
            })}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error ? (
          <Alert variant='destructive'>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>
            {t('revoke.cancel')}
          </AlertDialogCancel>
          <AlertDialogAction
            variant='destructive'
            disabled={busy}
            onClick={(event) => {
              event.preventDefault();
              if (target) void onConfirm(target);
            }}
          >
            {busy ? (
              <Spinner
                data-icon='inline-start'
                aria-label={t('page.loading')}
              />
            ) : null}
            {t('revoke.confirm')}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
