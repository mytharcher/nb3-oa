import { ApiClientError } from '@nocobase/app-client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';

/** Settings items the organisation pages check; the server registers and enforces the same ids. */
export const ORG_SETTINGS = {
  departments: 'oa.org.departments',
  positions: 'oa.org.positions',
  grades: 'oa.org.grades',
  dutyRoles: 'oa.org.dutyRoles',
} as const;

export type OrgSettingsItem = (typeof ORG_SETTINGS)[keyof typeof ORG_SETTINGS];

/** A user named by a record, as the organisation endpoints return it beside the id. */
export interface OrgUser {
  readonly id: string;
  readonly name: string;
  readonly username?: string | null;
  readonly email?: string | null;
}

export interface ListBody<T> {
  readonly data: T[];
  readonly meta: { readonly total: number };
}

/** Whether the signed-in user holds the item's `update` action; pending counts as no. */
export function useCanUpdate(item: OrgSettingsItem): boolean {
  const { can, isPending } = useCan({
    resource: { type: 'settings', id: item },
    action: 'update',
  });
  return can && !isPending;
}

/** Reasons the organisation endpoints answer that a form shows below a field. */
const FIELD_REASONS: Readonly<Record<string, string>> = {
  DEPARTMENT_CODE_EXISTS: 'code',
  POSITION_CODE_EXISTS: 'code',
  GRADE_CODE_EXISTS: 'code',
  PARENT_CYCLE: 'parentId',
  EXECUTIVE_TOP_LEVEL_ONLY: 'executiveId',
  PARENT_NOT_FOUND: 'parentId',
};

/**
 * The form field a failed write is about, from its `reason` or the field violation the server named
 * (`USER_NOT_FOUND` names `managerId`, `executiveId` or `userId`).
 */
export function violatedField(error: unknown): string | undefined {
  if (!(error instanceof ApiClientError) || !error.reason) return undefined;
  const fixed = FIELD_REASONS[error.reason];
  if (fixed) return fixed;
  if (error.reason !== 'USER_NOT_FOUND') return undefined;
  const payload = error.payload as
    { error?: { fieldViolations?: { field?: string }[] } } | undefined;
  return payload?.error?.fieldViolations?.[0]?.field;
}

/** The translated explanation of a failed write; never the server's own message (guideline I3). */
export function useErrorText(): (error: unknown) => string {
  const { t } = useTranslation();
  return (error) => {
    if (error instanceof ApiClientError) {
      switch (error.reason) {
        case 'DEPARTMENT_CODE_EXISTS':
        case 'POSITION_CODE_EXISTS':
        case 'GRADE_CODE_EXISTS':
          return t('org.errors.codeTaken');
        case 'EXECUTIVE_TOP_LEVEL_ONLY':
          return t('org.errors.executiveTopLevelOnly');
        case 'PARENT_CYCLE':
          return t('org.errors.parentCycle');
        case 'PARENT_NOT_FOUND':
          return t('org.errors.parentNotFound');
        case 'USER_NOT_FOUND':
          return t('org.errors.userNotFound');
        default:
          break;
      }
      if (error.status === 404) return t('org.errors.notFound');
      if (error.status === 403) return t('org.errors.forbidden');
    }
    return t('org.errors.requestFailed');
  };
}

/** The `className` every `SelectContent` takes (guideline I12). */
export const SELECT_CONTENT_CLASS =
  'w-auto max-w-[min(var(--container-sm),var(--available-width))] min-w-(--anchor-width) [&_[data-slot=select-item]>:first-child]:whitespace-normal';
