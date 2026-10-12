import { X } from 'lucide-react';
import { useRef, type ReactElement, type ReactNode } from 'react';

import { useAuthorizationTranslation } from '../i18n.js';
import { ApplicationSearch } from '#components/application-search';
import { ApplicationToolbar } from '#components/application-toolbar';
import { Button } from '#components/ui/button';

/** Authorization lists use the same filter toolbar as business lists. */
export function FilterBar({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}): ReactElement {
  return (
    <ApplicationToolbar className={className}>{children}</ApplicationToolbar>
  );
}

/** A search field that offers to clear itself while it holds text. */
export function SearchField({
  value,
  placeholder,
  label,
  className,
  disabled = false,
  onChange,
}: {
  value: string;
  placeholder: string;
  /** What the field searches, for anyone who cannot see the placeholder. */
  label: string;
  className?: string;
  disabled?: boolean;
  onChange: (value: string) => void;
}): ReactElement {
  const t = useAuthorizationTranslation();
  const inputRef = useRef<HTMLInputElement>(null);
  return (
    <ApplicationSearch
      ref={inputRef}
      aria-label={label}
      className={className}
      disabled={disabled}
      placeholder={placeholder}
      type='text'
      value={value}
      onChange={(event) => onChange(event.target.value)}
      endAdornment={
        value ? (
          <Button
            aria-label={t('filters.clearSearch', {
              label: label.toLowerCase(),
            })}
            variant='ghost'
            size='icon-xs'
            type='button'
            onClick={() => {
              onChange('');
              inputRef.current?.focus();
            }}
          >
            <X />
          </Button>
        ) : null
      }
    />
  );
}

/** Returns every filter in its bar to the default. Shown only while one is away from it. */
export function ClearFilterButton({
  onClear,
}: {
  onClear: () => void;
}): ReactElement {
  const t = useAuthorizationTranslation();
  return (
    <Button
      className='text-muted-foreground'
      size='sm'
      variant='ghost'
      onClick={onClear}
    >
      {t('filters.clear')}
    </Button>
  );
}

/** Pushes what follows to the right of the bar. */
export function FilterBarSpacer(): ReactElement {
  return <span className='flex-1' />;
}
