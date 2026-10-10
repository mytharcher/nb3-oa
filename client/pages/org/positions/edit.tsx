import type { ReactElement } from 'react';

import { CatalogEditDialog } from '../catalog/catalog-dialogs.js';

export default function OrgCatalogEditPage(): ReactElement {
  return <CatalogEditDialog kind='positions' />;
}
