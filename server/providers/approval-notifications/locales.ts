import { demoLocaleFor } from '../demo-data/context.js';

/** Keep ordinary recipients on the app default without mixing sample languages. */
export function notificationLocaleGroups(
  userIds: readonly string[],
  defaultLocale: string,
): Map<string, string[]> {
  const groups = new Map<string, string[]>();
  for (const userId of new Set(userIds)) {
    const locale = demoLocaleFor(userId) ?? defaultLocale;
    const recipients = groups.get(locale) ?? [];
    recipients.push(userId);
    groups.set(locale, recipients);
  }
  return groups;
}
