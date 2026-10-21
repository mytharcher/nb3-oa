import { useMemo, type ReactElement } from 'react';
import { DrawerCloseGuardsContext } from './drawer-form-context.js';

import { RouteOverlay, type RouteOverlayProps } from './route-overlay.js';

export type RouteDrawerProps = RouteOverlayProps;

/** A child route presented as a modal panel docked to the right edge of the viewport. */
export function RouteDrawer(props: RouteDrawerProps): ReactElement {
  const guards = useMemo(() => new Set<() => boolean | Promise<boolean>>(), []);
  return (
    <DrawerCloseGuardsContext.Provider value={guards}>
      <RouteOverlay
        {...props}
        drawer
        beforeClose={async () => {
          if (props.beforeClose && !(await props.beforeClose())) return false;
          for (const guard of [...guards]) if (!(await guard())) return false;
          return true;
        }}
      />
    </DrawerCloseGuardsContext.Provider>
  );
}
