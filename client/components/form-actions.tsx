import { useContext, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { DrawerFormFooterContext } from './drawer-form-context.js';

/** Keep React ownership, including field state, while mounting actions in the
 * fixed drawer footer. Submit buttons must name their native form explicitly. */
export function FormActions({ children }: { readonly children: ReactNode }) {
  const target = useContext(DrawerFormFooterContext);
  return target ? createPortal(children, target) : <>{children}</>;
}
