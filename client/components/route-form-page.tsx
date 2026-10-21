import { RouteFormCloseGuardContext } from '#hooks/use-route-form-close-guard';
import { useRef, useState, type ReactElement, type ReactNode } from 'react';
import {
  DrawerFormContext,
  DrawerFormFooterContext,
} from './drawer-form-context.js';
import { cn } from 'cn';
import { RouteDrawer } from './route-drawer.js';

export interface RouteFormPageProps {
  readonly title: ReactNode;
  readonly className?: string;
  readonly children?: ReactNode;
  readonly printable?: boolean;
  readonly beforeClose?: () => boolean | Promise<boolean>;
}

/**
 * OA request forms use the same drawer at workbench, list and detail entries.
 * Configuration and business forms share the same right-side presentation.
 * Existing navigation guards protect close; actions keep their React ownership.
 */
export function RouteFormPage({
  title,
  className,
  printable = false,
  beforeClose,
  children,
}: RouteFormPageProps): ReactElement {
  const closeGuardRef = useRef<(() => boolean | Promise<boolean>) | undefined>(
    undefined,
  );
  const [footerTarget, setFooterTarget] = useState<HTMLDivElement | null>(null);
  return (
    <RouteDrawer
      beforeClose={() =>
        beforeClose ? beforeClose() : (closeGuardRef.current?.() ?? true)
      }
      printable={printable}
      title={title}
      className={cn('text-sm sm:max-w-2xl', className)}
      footer={<div ref={setFooterTarget} className='contents' />}
    >
      <RouteFormCloseGuardContext.Provider value={closeGuardRef}>
        <DrawerFormContext.Provider value>
          <DrawerFormFooterContext.Provider value={footerTarget}>
            {children}
          </DrawerFormFooterContext.Provider>
        </DrawerFormContext.Provider>
      </RouteFormCloseGuardContext.Provider>
    </RouteDrawer>
  );
}
