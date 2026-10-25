import { useMemo, type ReactElement } from 'react';
import { useParams } from 'react-router';
import { cn } from 'cn';
import { DrawerCloseGuardsContext } from './drawer-form-context.js';
import { RouteDialog } from './route-dialog.js';
import { RouteDrawer, type RouteDrawerProps } from './route-drawer.js';

/** Draft submission is a short confirmation over the readable draft, rather than a second side panel. */
export function RequestActionOverlay(props: RouteDrawerProps): ReactElement {
  // These are the existing action parameter names used by the business route modules.
  const { actionName, operation, action } = useParams();
  const guards = useMemo(() => new Set<() => boolean | Promise<boolean>>(), []);
  if ((actionName ?? operation ?? action) !== 'submit')
    return <RouteDrawer {...props} />;
  return (
    <DrawerCloseGuardsContext.Provider value={guards}>
      <RouteDialog
        {...props}
        className={cn(props.className, 'sm:max-w-md')}
        beforeClose={async () => {
          if (props.beforeClose && !(await props.beforeClose())) return false;
          for (const guard of [...guards]) if (!(await guard())) return false;
          return true;
        }}
        footer={
          props.footer == null ? undefined : (
            <div className='flex w-full flex-col-reverse gap-2 sm:flex-row sm:justify-end'>
              {props.footer}
            </div>
          )
        }
      />
    </DrawerCloseGuardsContext.Provider>
  );
}
