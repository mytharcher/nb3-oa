import { ApiClientError } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { type ReactElement, useMemo } from 'react';

import { SessionExpiredAlert } from '@/components/session-expired-alert';
import { Button } from '@/components/ui/button';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '@/components/ui/combobox';
import {
  type DepartmentOption,
  type DepartmentPathOption,
  useDepartmentOptions,
} from '@/hooks/use-department-options';

export type { DepartmentOption, DepartmentPathOption };

export interface DepartmentPickerProps {
  /** The selected department's id; an empty string when none is selected. */
  readonly value: string;
  readonly onChange: (
    value: string,
    department: DepartmentPathOption | null,
  ) => void;
  /** The input's id, for `FieldLabel htmlFor`. */
  readonly id?: string;
  readonly onBlur?: () => void;
  readonly invalid?: boolean;
  readonly disabled?: boolean;
  readonly placeholder?: string;
  readonly className?: string;
  /** Leave out this department and every department below it, such as when choosing a new parent for it. */
  readonly excludeSubtreeOf?: string;
  /** Also offer disabled departments. Defaults to `false`; the current value is always shown. */
  readonly includeInactive?: boolean;
}

function belowOrSelf(
  departments: readonly DepartmentOption[],
  rootId: string,
): Set<string> {
  const children = new Map<string, string[]>();
  for (const department of departments) {
    if (department.parentId === null) continue;
    const siblings = children.get(department.parentId) ?? [];
    siblings.push(department.id);
    children.set(department.parentId, siblings);
  }
  const result = new Set<string>();
  const pending = [rootId];
  while (pending.length) {
    const id = pending.pop() as string;
    if (result.has(id)) continue;
    result.add(id);
    pending.push(...(children.get(id) ?? []));
  }
  return result;
}

function itemLabel(department: DepartmentPathOption): string {
  return department.path;
}

function isSameDepartment(
  item: DepartmentPathOption,
  current: DepartmentPathOption,
): boolean {
  return item.id === current.id;
}

/**
 * Picks one department from the organisation tree, searched by its path or code in the browser. The value is the
 * department's id (`''` for none). Use inside react-hook-form's `Controller` like `UserPicker`: `value={field.value}`,
 * `onChange={field.onChange}`, `onBlur={field.onBlur}`, `invalid={fieldState.invalid}`.
 */
export function DepartmentPicker({
  value,
  onChange,
  id,
  onBlur,
  invalid,
  disabled,
  placeholder,
  className,
  excludeSubtreeOf,
  includeInactive = false,
}: DepartmentPickerProps): ReactElement {
  const { t } = useTranslation();
  // Load every department, so a disabled one the value still names shows its title.
  const { departments, error, retry } = useDepartmentOptions(true);
  const selected = useMemo(
    () => departments?.find((department) => department.id === value) ?? null,
    [departments, value],
  );
  const items = useMemo(() => {
    if (!departments) return [];
    const excluded = excludeSubtreeOf
      ? belowOrSelf(departments, excludeSubtreeOf)
      : new Set<string>();
    return departments.filter(
      (department) =>
        !excluded.has(department.id) &&
        (includeInactive || department.active || department.id === value),
    );
  }, [departments, excludeSubtreeOf, includeInactive, value]);

  if (error) {
    if (error instanceof ApiClientError && error.status === 401)
      return <SessionExpiredAlert />;
    return (
      <div
        role='alert'
        className='flex items-center gap-2 text-sm text-destructive'
      >
        <span>{t('org.departmentPicker.loadFailed')}</span>
        <Button type='button' variant='outline' size='sm' onClick={retry}>
          {t('status.retry')}
        </Button>
      </div>
    );
  }

  return (
    <Combobox
      items={items}
      value={selected}
      onValueChange={(department: DepartmentPathOption | null) =>
        onChange(department?.id ?? '', department)
      }
      itemToStringLabel={itemLabel}
      isItemEqualToValue={isSameDepartment}
      disabled={disabled || !departments}
    >
      <ComboboxInput
        id={id}
        className={className}
        disabled={disabled || !departments}
        placeholder={
          departments
            ? (placeholder ?? t('org.departmentPicker.placeholder'))
            : t('status.loading')
        }
        aria-invalid={invalid || undefined}
        onBlur={onBlur}
        showClear={!!selected && !disabled}
      />
      <ComboboxContent>
        <ComboboxEmpty>{t('org.departmentPicker.empty')}</ComboboxEmpty>
        <ComboboxList>
          {(department: DepartmentPathOption) => (
            <ComboboxItem key={department.id} value={department}>
              <span className='flex min-w-0 flex-col'>
                <span className='truncate'>{department.title}</span>
                <span className='truncate text-xs text-muted-foreground'>
                  {department.active
                    ? department.path
                    : t('org.departmentPicker.inactivePath', {
                        path: department.path,
                      })}
                </span>
              </span>
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
