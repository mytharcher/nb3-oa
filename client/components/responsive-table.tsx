import { useTranslation } from '@nocobase/i18n/client';
import { cn } from 'cn';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import {
  useId,
  useLayoutEffect,
  useRef,
  useState,
  type ComponentProps,
  type KeyboardEvent,
} from 'react';

import { Button } from '#components/ui/button';
import { Table } from '#components/ui/table';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from '#components/ui/tooltip';

/** Application-owned scroll controls compose the untouched shadcn table.
 * Every column remains accessible without pinning arbitrary business fields. */
export function ResponsiveTable({
  containerClassName,
  ...props
}: ComponentProps<typeof Table> & { readonly containerClassName?: string }) {
  const { t } = useTranslation();
  const ref = useRef<HTMLDivElement>(null);
  const hintId = useId();
  const [scroll, setScroll] = useState({
    overflow: false,
    left: false,
    right: false,
  });

  useLayoutEffect(() => {
    const frame = ref.current;
    const viewport = frame?.querySelector<HTMLElement>(
      '[data-slot="table-container"]',
    );
    const table = viewport?.querySelector('table');
    if (!viewport || !table) return;
    const measure = () => {
      const max = viewport.scrollWidth - viewport.clientWidth;
      const next = {
        overflow: max > 1,
        left: viewport.scrollLeft > 1,
        right: viewport.scrollLeft < max - 1,
      };
      setScroll((previous) =>
        previous.overflow === next.overflow &&
        previous.left === next.left &&
        previous.right === next.right
          ? previous
          : next,
      );
    };
    measure();
    viewport.addEventListener('scroll', measure, { passive: true });
    window.addEventListener('resize', measure);
    const observer =
      typeof ResizeObserver === 'undefined'
        ? undefined
        : new ResizeObserver(measure);
    observer?.observe(viewport);
    observer?.observe(table);
    return () => {
      observer?.disconnect();
      viewport.removeEventListener('scroll', measure);
      window.removeEventListener('resize', measure);
    };
  }, []);

  const move = (direction: number) => {
    const viewport = ref.current?.querySelector<HTMLElement>(
      '[data-slot="table-container"]',
    );
    viewport?.scrollBy({
      left: direction * Math.max(1, viewport.clientWidth * 0.8),
      behavior: 'auto',
    });
  };
  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    // Nested inputs, menus and links must keep their own keyboard behavior.
    if (event.target !== event.currentTarget || !scroll.overflow) return;
    if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
      event.preventDefault();
      move(event.key === 'ArrowLeft' ? -1 : 1);
    }
  };

  return (
    <div
      ref={ref}
      data-slot='responsive-table'
      role={scroll.overflow ? 'region' : undefined}
      aria-label={scroll.overflow ? t('tableScroll.region') : undefined}
      aria-describedby={scroll.overflow ? hintId : undefined}
      tabIndex={scroll.overflow ? 0 : undefined}
      onKeyDown={onKeyDown}
      className={cn(
        '@container min-w-0 max-w-full outline-none focus-visible:ring-2 focus-visible:ring-ring [&>[data-slot=table-container]]:overscroll-x-contain',
        containerClassName,
      )}
    >
      {scroll.overflow ? (
        <div
          data-slot='table-scroll-controls'
          className='flex items-center justify-between gap-2 border-b bg-background px-3 py-1'
        >
          <p id={hintId} className='min-w-0 text-xs text-muted-foreground'>
            {t('tableScroll.hint')}
          </p>
          <div className='flex shrink-0 gap-1'>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant='ghost'
                    size='icon'
                    aria-label={t('tableScroll.left')}
                    disabled={!scroll.left}
                    onClick={() => move(-1)}
                  />
                }
              >
                <ChevronLeft />
              </TooltipTrigger>
              <TooltipContent>{t('tableScroll.left')}</TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger
                render={
                  <Button
                    variant='ghost'
                    size='icon'
                    aria-label={t('tableScroll.right')}
                    disabled={!scroll.right}
                    onClick={() => move(1)}
                  />
                }
              >
                <ChevronRight />
              </TooltipTrigger>
              <TooltipContent>{t('tableScroll.right')}</TooltipContent>
            </Tooltip>
          </div>
        </div>
      ) : null}
      <Table {...props} />
    </div>
  );
}
