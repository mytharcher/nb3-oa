import { createContext } from 'react';

/** A complex form nested in a record drawer uses that drawer's title and spacing. */
export const DrawerFormContext = createContext(false);

/** React portals keep form actions mounted in the drawer's fixed footer. */
export const DrawerFormFooterContext = createContext<HTMLElement | null>(null);

/** A drawer can contain several independently mounted parameter forms. */
export const DrawerCloseGuardsContext = createContext<Set<
  () => boolean | Promise<boolean>
> | null>(null);
