import type { ComponentProps, ReactElement } from 'react';
import { cn } from 'cn';
import {
  DialogContent,
  DialogFooter,
  DialogHeader,
} from '#components/ui/dialog';

/** Controlled forms use the same right-side layout as route forms. Keep the
 * native form around both the scrolling body and its footer, so Enter and
 * submit buttons retain their form owner without moving DOM nodes. */
export function FormDrawerContent({
  className,
  ...props
}: ComponentProps<typeof DialogContent>): ReactElement {
  return (
    <DialogContent
      {...props}
      data-presentation='drawer'
      className={cn(
        'top-0 right-0 left-auto flex h-dvh max-h-dvh w-full max-w-full translate-x-0 translate-y-0 flex-col gap-0 overflow-hidden rounded-none p-0 sm:max-w-2xl data-open:slide-in-from-right data-open:zoom-in-100 data-closed:slide-out-to-right data-closed:zoom-out-100',
        '[&>form]:flex [&>form]:min-h-0 [&>form]:flex-1 [&>form]:flex-col [&>form]:gap-0 [&>form]:overflow-hidden [&>[data-slot=dialog-close]]:top-4 [&>[data-slot=dialog-close]]:right-4',
        className,
      )}
    />
  );
}

export function FormDrawerHeader({
  className,
  ...props
}: ComponentProps<typeof DialogHeader>): ReactElement {
  return (
    <DialogHeader
      {...props}
      className={cn('shrink-0 border-b p-4 pr-12 sm:p-6 sm:pr-14', className)}
    />
  );
}

export function FormDrawerBody({
  className,
  ...props
}: ComponentProps<'div'>): ReactElement {
  return (
    <div
      {...props}
      data-slot='form-drawer-body'
      className={cn(
        'flex min-h-0 min-w-0 flex-1 flex-col gap-4 overflow-y-auto overscroll-contain p-4 sm:p-6',
        className,
      )}
    />
  );
}

export function FormDrawerFooter({
  className,
  ...props
}: ComponentProps<typeof DialogFooter>): ReactElement {
  return (
    <DialogFooter
      {...props}
      className={cn(
        'm-0 shrink-0 flex-row flex-wrap justify-end gap-2 rounded-none bg-popover p-4 sm:p-6',
        className,
      )}
    />
  );
}
