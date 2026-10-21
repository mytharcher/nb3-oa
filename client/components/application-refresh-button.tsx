import type { Ref } from 'react';
import { RefreshCw } from 'lucide-react';
import { Button } from '#components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#components/ui/tooltip';

/** Refresh is a secondary, named action with a consistent pending state. */
export function ApplicationRefreshButton({
  label,
  ref,
  loading = false,
  onClick,
}: {
  readonly label: string;
  readonly ref?: Ref<HTMLButtonElement>;
  readonly loading?: boolean;
  readonly onClick: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            ref={ref}
            type='button'
            variant='outline'
            size='icon'
            disabled={loading}
            aria-label={label}
            aria-busy={loading}
            onClick={onClick}
          />
        }
      >
        <RefreshCw className={loading ? 'animate-spin' : undefined} />
      </TooltipTrigger>
      <TooltipContent>{label}</TooltipContent>
    </Tooltip>
  );
}
