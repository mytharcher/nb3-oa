import { useTranslation } from '@nocobase/i18n/client';
import { Field, FieldLabel } from '#components/ui/field';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
import type { DataScopeOption } from '../administration/authorization/authorization-client.js';
import type { ActionRow } from './types.js';

export interface PermissionSourceDetails {
  sources: readonly string[];
  scopes: readonly { key: string; label: string; value: string }[];
  summary?: string;
}

export function PermissionScopeSummary({
  scopes,
}: {
  scopes: PermissionSourceDetails['scopes'];
}) {
  return (
    <dl className='grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-x-3 gap-y-2'>
      {scopes.map((scope) => (
        <div key={scope.key} className='contents'>
          <dt className='text-muted-foreground'>{scope.label}</dt>
          <dd className='min-w-0 break-words'>{scope.value}</dd>
        </div>
      ))}
    </dl>
  );
}

export function PermissionSources({
  entries,
}: {
  entries: readonly PermissionSourceDetails[];
}) {
  const { t } = useTranslation();
  return (
    <div className='flex flex-col gap-3'>
      {entries.map((entry) => (
        <div key={JSON.stringify(entry)} className='flex flex-col gap-2'>
          {entry.summary ? (
            <p>{entry.summary}</p>
          ) : (
            <PermissionScopeSummary scopes={entry.scopes} />
          )}
          <div className='text-xs text-muted-foreground'>
            <p>{t('access.grantSources')}</p>
            {entry.sources.map((source) => (
              <p key={source}>{source}</p>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function PersonalScopeFields({
  row,
  scopes,
  disabled,
  showLabels = true,
  showHelp = true,
  change,
}: {
  row: ActionRow;
  scopes: readonly DataScopeOption[];
  disabled: boolean;
  showLabels?: boolean;
  showHelp?: boolean;
  change: (values: Record<string, string>) => void;
}) {
  const { t } = useTranslation();
  if (!scopes.length) return null;
  return (
    <div className='flex w-full flex-col gap-3'>
      {scopes.map((scope) => {
        const options = scope.options.map((option) =>
          option.value === ''
            ? { ...option, label: t('access.systemScope') }
            : option,
        );
        const id = `${row.id}-${scope.key}`;
        return (
          <Field key={scope.key}>
            {showLabels ? (
              <FieldLabel htmlFor={id}>{scope.label}</FieldLabel>
            ) : null}
            <Select
              items={options}
              value={row.scopes[scope.key] ?? ''}
              disabled={disabled}
              onValueChange={(value) => {
                if (value !== null)
                  change({ ...row.scopes, [scope.key]: value });
              }}
            >
              <SelectTrigger
                id={id}
                aria-label={t('access.scopeForAction', {
                  action: row.label,
                  scope: scope.label,
                })}
                size='sm'
                className='w-full text-sm'
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
                {options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        );
      })}
      {showHelp && scopes.some((scope) => !row.scopes[scope.key]) ? (
        <p className='text-xs text-muted-foreground'>
          {t('access.systemScopeHelp')}
        </p>
      ) : null}
    </div>
  );
}
