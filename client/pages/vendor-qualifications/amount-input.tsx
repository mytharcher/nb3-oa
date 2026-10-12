import { Input } from '#components/ui/input';
/** Preserve a decimal proposal string until exact safe-integer cent validation at save. */
export function AmountInput({
  id,
  value,
  disabled,
  onChange,
  unit,
}: {
  id: string;
  value: string;
  disabled: boolean;
  onChange: (value: string) => void;
  unit: string;
}) {
  return (
    <div className='flex items-center gap-2'>
      <Input
        id={id}
        inputMode='decimal'
        value={value}
        disabled={disabled}
        onChange={(event) => onChange(event.target.value)}
        aria-describedby={`${id}-unit`}
      />
      <span
        id={`${id}-unit`}
        className='shrink-0 text-sm text-muted-foreground'
      >
        {unit}
      </span>
    </div>
  );
}
