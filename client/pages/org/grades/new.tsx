import type { ReactElement } from 'react';

import { CatalogCreateDialog } from '../catalog/catalog-dialogs.js';

export default function OrgCatalogNewPage(): ReactElement {
  return <CatalogCreateDialog kind='grades' />;
}
