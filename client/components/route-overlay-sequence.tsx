import { useContext, useState, type ReactNode } from 'react';
import { RouteOverlayHandoffContext } from './route-overlay-handoff.js';

/** Share one entrance across loading, error and form components in the same view. */
export function RouteOverlaySequence({ children }: { children: ReactNode }) {
  const parent = useContext(RouteOverlayHandoffContext);
  const [sequence] = useState(() => {
    let entered = false;
    return {
      hasEntered: () => entered,
      enter: () => {
        entered = true;
      },
    };
  });
  return (
    <RouteOverlayHandoffContext.Provider value={parent || sequence}>
      {children}
    </RouteOverlayHandoffContext.Provider>
  );
}
