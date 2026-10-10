import { ORG_SETTINGS, type OrgSettingsItem } from '../shared.js';

/**
 * Positions (岗位) and grades (职级) are the same kind of page: a flat catalogue with a code, a title and one integer
 * (a sort order for positions, the comparable rank for grades), disabled rather than deleted. One implementation
 * serves both; copy lives under `org.positions.*` and `org.grades.*` with the same shape.
 */
export type CatalogKind = 'positions' | 'grades';

export interface CatalogRow {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly active: boolean;
  /** Positions only. */
  readonly sortOrder?: number;
  /** Grades only: higher is more senior. */
  readonly rank?: number;
}

export interface CatalogConfig {
  readonly kind: CatalogKind;
  readonly item: OrgSettingsItem;
  /** The integer column: `sortOrder` (optional, default 0) or `rank` (required). */
  readonly numberField: 'sortOrder' | 'rank';
}

export const CATALOGS: Readonly<Record<CatalogKind, CatalogConfig>> = {
  positions: {
    kind: 'positions',
    item: ORG_SETTINGS.positions,
    numberField: 'sortOrder',
  },
  grades: { kind: 'grades', item: ORG_SETTINGS.grades, numberField: 'rank' },
};

/** What the list hands its create and edit dialogs through the outlet. */
export interface CatalogOutletContext {
  readonly reload: () => void;
}
