import { createContext } from 'react';

/** The route loader already opened a panel; its replacement must not enter again. */
export const RouteOverlayHandoffContext = createContext<
  boolean | { hasEntered: () => boolean; enter: () => void }
>(false);
