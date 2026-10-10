/**
 * The platform module's settings items. Each settings page declares the same id in its client route's `authz`, and
 * every endpoint checks the matching action. Root holds them all; administrators grant them to other permission sets
 * in the permission workspace, where they are listed under the "OA platform" subsection of Administration.
 */
export const PLATFORM_SETTINGS = {
  calendar: 'oa.platform.calendar',
  dictionaries: 'oa.platform.dictionaries',
  rules: 'oa.platform.rules',
  sequences: 'oa.platform.sequences',
  auditLogs: 'oa.platform.auditLogs',
} as const;

export type PlatformSettingsId =
  (typeof PLATFORM_SETTINGS)[keyof typeof PLATFORM_SETTINGS];

/** The workspace subsection the items are placed in. */
export const PLATFORM_AUTHZ_SECTION = 'oa.platform';

/** The application's client namespace, where the titles below are translated (`client/locales/modules/platform.*`). */
export const APP_NAMESPACE = 'nb3-oa';

export const PLATFORM_SETTINGS_ACTIONS: Readonly<
  Record<PlatformSettingsId, readonly ('read' | 'update')[]>
> = {
  [PLATFORM_SETTINGS.calendar]: ['read', 'update'],
  [PLATFORM_SETTINGS.dictionaries]: ['read', 'update'],
  [PLATFORM_SETTINGS.rules]: ['read', 'update'],
  [PLATFORM_SETTINGS.sequences]: ['read'],
  [PLATFORM_SETTINGS.auditLogs]: ['read'],
};
