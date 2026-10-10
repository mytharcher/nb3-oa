import type { OrgUser } from '../shared.js';

/** Plain text, or the translation descriptor a seeded duty role stores; render it with `titleText`. */
export type DutyRoleTitle =
  string | { readonly key: string; readonly ns: string };

export interface DutyRole {
  /** The stable code approval resolution looks up (`gm`, `cashier`, …). */
  readonly code: string;
  readonly title: DutyRoleTitle;
  readonly description: string | null;
  readonly active: boolean;
  readonly sortOrder: number;
  readonly memberCount: number;
}

export interface DutyRoleMember {
  readonly userId: string;
  readonly user: OrgUser;
}

/** What the list hands the role drawer. */
export interface DutyRolesOutletContext {
  readonly reload: () => void;
  readonly canUpdate: boolean;
}

/** What the role drawer hands the add-member dialog stacked on it. */
export interface DutyRoleOutletContext {
  readonly role: DutyRole;
  readonly roleTitle: string;
  readonly memberIds: readonly string[];
  /** Reloads the drawer's members and the list's counts. */
  readonly onMembersChanged: () => void;
}
