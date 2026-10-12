import { useContext, useState, type ReactElement, type ReactNode } from 'react';
import {
  DrawerFormContext,
  DrawerFormFooterContext,
} from './drawer-form-context.js';
import { RouteChildPage } from './route-child-page.js';
import { RouteDrawer } from './route-drawer.js';
import { RouteOverlayContext } from './use-route-overlay.js';

export interface RouteFormPageProps {
  readonly title: ReactNode;
  readonly presentation?: 'drawer' | 'page';
  readonly children?: ReactNode;
  readonly printable?: boolean;
}

/**
 * OA request forms use the same drawer at workbench, list and detail entries.
 * Configuration forms may retain a covering page at their root entry.
 * Existing navigation guards protect close; actions keep their React ownership.
 */
export function RouteFormPage({
  title,
  presentation = 'drawer',
  printable = false,
  children,
}: RouteFormPageProps): ReactElement {
  const parentOverlay = useContext(RouteOverlayContext);
  const [footerTarget, setFooterTarget] = useState<HTMLDivElement | null>(null);
  if (presentation === 'page' && !parentOverlay)
    return <RouteChildPage>{children}</RouteChildPage>;
  return (
    <RouteDrawer
      printable={printable}
      title={title}
      className='text-sm sm:max-w-2xl'
      footer={<div ref={setFooterTarget} className='contents' />}
    >
      <DrawerFormContext.Provider value>
        <DrawerFormFooterContext.Provider value={footerTarget}>
          {children}
        </DrawerFormFooterContext.Provider>
      </DrawerFormContext.Provider>
    </RouteDrawer>
  );
}
