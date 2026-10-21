import { useContext, type ReactElement, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  DrawerFormContext,
  DrawerFormFooterContext,
} from './drawer-form-context.js';

export interface PageHeaderProps {
  readonly title: ReactNode;
  readonly description?: ReactNode;
  /** Page-level actions, aligned to the right of the title from the `sm` breakpoint up. */
  readonly actions?: ReactNode;
}

/** The heading of a page: its only `h1`, an optional description, and the actions that apply to the whole page. */
export function PageHeader({
  actions,
  description,
  title,
}: PageHeaderProps): ReactElement {
  const drawerForm = useContext(DrawerFormContext);
  const footerTarget = useContext(DrawerFormFooterContext);
  if (drawerForm && !description)
    return actions && footerTarget ? (
      createPortal(actions, footerTarget)
    ) : (
      <></>
    );
  return (
    <header className='flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between'>
      {drawerForm && actions && footerTarget
        ? createPortal(actions, footerTarget)
        : null}
      <div className='min-w-0'>
        {!drawerForm && (
          <h1 className='font-heading text-2xl font-semibold tracking-tight'>
            {title}
          </h1>
        )}
        {description ? (
          <p className='mt-1 max-w-2xl text-sm leading-6 text-muted-foreground'>
            {description}
          </p>
        ) : null}
      </div>
      {actions && !drawerForm ? (
        <div className='flex shrink-0 items-center gap-2'>{actions}</div>
      ) : null}
    </header>
  );
}
