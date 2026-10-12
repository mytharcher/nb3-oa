import { cn } from 'cn';
import type { ReactElement } from 'react';

import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#components/ui/tooltip';

/**
 * Text in a table cell that ends in an ellipsis where its column limits it, with the full text in a tooltip only when
 * it is cut off (guideline T1.11).
 */
export function TruncatedText({
  text,
  className,
}: {
  readonly text: string;
  readonly className?: string;
}): ReactElement {
  return (
    <Tooltip
      onOpenChange={(open, details) => {
        // A value that fits needs no tooltip.
        const trigger = details.trigger;
        if (open && trigger && trigger.scrollWidth <= trigger.clientWidth) {
          details.cancel();
        }
      }}
    >
      <TooltipTrigger
        render={<span className={cn('block max-w-60 truncate', className)} />}
      >
        {text}
      </TooltipTrigger>
      <TooltipContent className='max-w-sm whitespace-normal wrap-anywhere'>
        {text}
      </TooltipContent>
    </Tooltip>
  );
}
