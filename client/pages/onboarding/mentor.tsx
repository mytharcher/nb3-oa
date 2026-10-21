import { useEffect, useRef, useState } from 'react';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '#components/ui/combobox';
import { UserName } from '#components/user-name';
import { Failure } from '../work-items/states.js';
import { useOnboardingResource } from './resource.js';
type Person = { id: string; name: string; code: string };
/** Directory authorization remains independent of onboarding actions. */
export function Mentor({
  value,
  onChange,
  disabled,
  exclude,
  invalid,
  id = 'fact-mentorEmployeeId',
}: {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
  exclude: string;
  invalid?: boolean;
  id?: string;
}) {
  const { t } = useTranslation();
  const [query, setQuery] = useState('');
  const [debounced, setDebounced] = useState('');
  const [composing, setComposing] = useState(false);
  const composingRef = useRef(false);
  const [picked, setPicked] = useState<Person | null>(null);
  const grant = useCan({
    resource: { type: 'composite', id: 'oa.employees.directory' },
    action: 'view',
  });
  const allowed = grant.can && !grant.isPending && !grant.error;
  const r = useOnboardingResource<{ data: Person[]; meta?: { total: number } }>(
    allowed ? 'directory' : null,
    { q: debounced, page: '1', pageSize: '100' },
  );
  useEffect(() => {
    if (composing) return;
    const timeout = setTimeout(() => setDebounced(query.trim()), 300);
    return () => clearTimeout(timeout);
  }, [query, composing]);
  const current = (r.data?.data ?? []).filter(
    (person) => person.id !== exclude,
  );
  const selected = value
    ? picked?.id === value
      ? picked
      : (current.find((person) => person.id === value) ?? {
          id: value,
          name: t('onboarding.historicalPersonUnavailable'),
          code: '',
        })
    : null;
  const items =
    selected && !current.some((person) => person.id === selected.id)
      ? [selected, ...current]
      : current;
  return allowed ? (
    <div className='flex flex-col gap-2'>
      <Combobox
        items={items}
        filter={null}
        value={selected}
        disabled={disabled}
        itemToStringLabel={(person: Person) => person.name}
        isItemEqualToValue={(a: Person, b: Person) => a.id === b.id}
        onValueChange={(person: Person | null) => {
          if (composingRef.current) return;
          setPicked(person);
          onChange(person?.id ?? '');
        }}
        onInputValueChange={(text, details) => {
          if (
            details.reason === 'input-change' ||
            details.reason === 'input-clear'
          )
            setQuery(text);
        }}
        onOpenChange={(open) => {
          if (!open) setQuery('');
        }}
      >
        <ComboboxInput
          id={id}
          aria-invalid={invalid || undefined}
          placeholder={t('onboarding.employeeSearch')}
          showClear={!!selected}
          onCompositionStart={() => {
            composingRef.current = true;
            setComposing(true);
          }}
          onCompositionEnd={(event) => {
            composingRef.current = false;
            setComposing(false);
            setQuery(event.currentTarget.value);
          }}
          onKeyDown={(event) => {
            if (
              event.key === 'Enter' &&
              (event.nativeEvent.isComposing || composingRef.current)
            )
              event.preventDefault();
          }}
        />
        <ComboboxContent>
          <ComboboxEmpty>
            {r.loading || query.trim() !== debounced
              ? t('onboarding.loading')
              : t('onboarding.noPeople')}
          </ComboboxEmpty>
          <ComboboxList>
            {(person: Person) => (
              <ComboboxItem key={person.id} value={person}>
                <UserName name={person.name} />
                {person.code ? (
                  <span className='text-xs text-muted-foreground'>
                    {person.code}
                  </span>
                ) : null}
              </ComboboxItem>
            )}
          </ComboboxList>
        </ComboboxContent>
      </Combobox>
      {(r.data?.meta?.total ?? r.data?.data.length ?? 0) >= 100 ? (
        <p className='text-sm text-muted-foreground'>
          {t('onboarding.directoryCap')}
        </p>
      ) : null}
      {r.error ? (
        <Failure module='onboarding' error={r.error} retry={r.reload} />
      ) : null}
    </div>
  ) : (
    <p>{t('onboarding.mentorDenied')}</p>
  );
}
