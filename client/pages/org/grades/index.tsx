import type { ReactElement } from 'react';

import { CatalogPage } from '../catalog/catalog-page.js';

/** Settings → grades: the shared catalogue list (`../catalog/`). */
export default function OrgCatalogPage(): ReactElement {
  return <CatalogPage kind='grades' />;
}
