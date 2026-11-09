import { useState, type PropsWithChildren } from 'react';
import {
  createAppSidebarPreferenceStore,
  SidebarPreferenceProvider,
} from '../../client/layouts/use-sidebar-preference.js';

/** Manual shell fixtures use the same application-scoped store as createApp. */
export function TestSidebarPreferenceProvider({ children }: PropsWithChildren) {
  const [store] = useState(() => createAppSidebarPreferenceStore('/main'));
  return (
    <SidebarPreferenceProvider value={store}>
      {children}
    </SidebarPreferenceProvider>
  );
}
