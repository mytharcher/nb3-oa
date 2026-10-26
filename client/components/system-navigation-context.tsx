import { createContext, useContext } from 'react';
import type { RouteNavigationItem } from '../routing/route-navigation.js';

interface SystemNavigationState {
  readonly items: readonly RouteNavigationItem[];
  readonly loading: boolean;
  readonly failed: boolean;
  readonly retry: () => void;
}

// The shell and entry share one authorization check, including permission revisions and retries.
export const SystemNavigationContext = createContext<SystemNavigationState>({
  items: [],
  loading: true,
  failed: false,
  retry: () => {},
});

export function useSystemNavigation() {
  return useContext(SystemNavigationContext);
}
