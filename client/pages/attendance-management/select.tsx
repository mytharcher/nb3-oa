import type { Ref } from 'react';
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#components/ui/select';
export function OptionSelect({
  id,
  value,
  options,
  onChange,
  disabled,
  invalid,
  ref,
  onBlur,
}: {
  id?: string;
  value: string;
  options: { value: string; label: string }[];
  onChange: (value: string) => void;
  disabled?: boolean;
  invalid?: boolean;
  ref?: Ref<HTMLButtonElement>;
  onBlur?: () => void;
}) {
  return (
    <Select
      items={options}
      value={value || null}
      onValueChange={(v) => onChange(v ?? '')}
      disabled={disabled}
    >
      <SelectTrigger
        id={id}
        ref={ref}
        onBlur={onBlur}
        aria-invalid={invalid || undefined}
        className='w-full'
      >
        <SelectValue />
      </SelectTrigger>
      <SelectContent className='w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal'>
        <SelectGroup>
          {options.map((option) => (
            <SelectItem
              key={option.value}
              value={option.value}
              className='whitespace-normal'
            >
              {option.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  );
}
