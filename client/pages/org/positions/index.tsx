import type { ReactElement } from 'react';

import { CatalogPage } from '../catalog/catalog-page.js';

/** Settings → positions: the shared catalogue list (`../catalog/`). */
export default function OrgCatalogPage(): ReactElement {
  return <CatalogPage kind='positions' />;
}
