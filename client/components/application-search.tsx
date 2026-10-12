import type { ComponentProps, ReactNode } from 'react';
import { cn } from 'cn';
import { Search } from 'lucide-react';
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from '#components/ui/input-group';

/** Preserve the owner's input events, composition handling and ref while sharing
 * one search presentation across record lists and administration workspaces. */
export function ApplicationSearch({
  className,
  endAdornment,
  ...props
}: ComponentProps<typeof InputGroupInput> & {
  readonly endAdornment?: ReactNode;
}) {
  return (
    <InputGroup
      data-slot='application-search'
      className={cn('w-full sm:w-64', className)}
    >
      <InputGroupInput
        {...props}
        aria-label={
          props['aria-label'] ?? (props.id ? undefined : props.placeholder)
        }
      />
      <InputGroupAddon>
        <Search aria-hidden='true' />
      </InputGroupAddon>
      {endAdornment ? (
        <InputGroupAddon align='inline-end'>{endAdornment}</InputGroupAddon>
      ) : null}
    </InputGroup>
  );
}
