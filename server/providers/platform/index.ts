export { FrozenCalendar, type CalendarSnapshot } from './frozen-calendar.js';
import { authorizationToken } from '@nocobase/app-plugin-authorization/server';
import type { Application } from '@nocobase/app-server/application';
import { loggingToken } from '@nocobase/app-server/logging';
import { databaseManagerToken } from '@nocobase/db';
import { ServiceProvider } from '@nocobase/service-provider';

import { auditServiceToken } from '../audit/index.js';
import {
  APP_NAMESPACE,
  PLATFORM_AUTHZ_SECTION,
  PLATFORM_SETTINGS,
  PLATFORM_SETTINGS_ACTIONS,
} from './authz.js';
import { calendarServiceToken, createCalendarService } from './calendar.js';
import {
  createDictionaryService,
  dictionaryServiceToken,
} from './dictionaries.js';
import { createRuleService, ruleServiceToken } from './rules.js';
import { createSequenceService, sequenceServiceToken } from './sequences.js';

export {
  calendarServiceToken,
  type ApprovalCalendarLike,
  type CalendarDayKind,
  type CalendarService,
  type DayHalf,
  type LocalDate,
  type WorkdaysBetweenOptions,
  type WorkHours,
} from './calendar.js';
export {
  dictionaryServiceToken,
  localizeLabel,
  type DictionaryEntry,
  type DictionaryLabel,
  type DictionaryService,
} from './dictionaries.js';
export { PlatformError, type PlatformErrorCode } from './errors.js';
export {
  ruleServiceToken,
  type RuleService,
  type RuleVersion,
} from './rules.js';
export {
  formatSequenceNumber,
  sequenceServiceToken,
  type SequenceService,
} from './sequences.js';
export { PLATFORM_SETTINGS } from './authz.js';

/** How often the calendar is rebuilt to pick up other processes' edits. */
const CALENDAR_REFRESH_MS = 10 * 60_000;

const SETTINGS_TITLES: Readonly<Record<string, string>> = {
  [PLATFORM_SETTINGS.calendar]: 'platform.authz.calendar',
  [PLATFORM_SETTINGS.dictionaries]: 'platform.authz.dictionaries',
  [PLATFORM_SETTINGS.rules]: 'platform.authz.rules',
  [PLATFORM_SETTINGS.sequences]: 'platform.authz.sequences',
  [PLATFORM_SETTINGS.auditLogs]: 'platform.authz.auditLogs',
};

/**
 * Provider of the `platform` OA module: work calendar, dictionaries, document sequences and versioned approval
 * rules, plus the settings items of their pages and of the audit log page.
 */
export default class PlatformProvider extends ServiceProvider<Application> {
  public readonly name: string = 'oa/platform-provider';
  private refreshTimer: ReturnType<typeof setInterval> | undefined;

  public override register(): void {
    const { container } = this.app;
    container.singleton(ruleServiceToken, () =>
      createRuleService(
        container.resolve(databaseManagerToken),
        container.resolve(auditServiceToken),
      ),
    );
    container.singleton(calendarServiceToken, () =>
      createCalendarService(
        container.resolve(databaseManagerToken),
        container.resolve(ruleServiceToken),
        container.resolve(auditServiceToken),
        {
          onReloadError: (error) =>
            container
              .resolve(loggingToken)
              .getLogger('oa-platform')
              .error({ error }, 'Reloading the work calendar failed'),
        },
      ),
    );
    container.singleton(dictionaryServiceToken, () =>
      createDictionaryService(
        container.resolve(databaseManagerToken),
        container.resolve(auditServiceToken),
      ),
    );
    container.singleton(sequenceServiceToken, () =>
      createSequenceService(container.resolve(calendarServiceToken)),
    );
  }

  public override async boot(): Promise<void> {
    // An application assembled without the authorization plugin (some framework tests) has nothing to register into.
    if (!this.app.container.has(authorizationToken)) return;
    const authz = this.app.container.resolve(authorizationToken);
    authz.ui.sections.add({
      name: PLATFORM_AUTHZ_SECTION,
      title: { key: 'platform.authz.section', ns: APP_NAMESPACE },
      parent: 'administration',
    });
    for (const [id, actions] of Object.entries(PLATFORM_SETTINGS_ACTIONS)) {
      authz.settings.add({
        id,
        title: { key: SETTINGS_TITLES[id], ns: APP_NAMESPACE },
        actions: actions.map((action) => ({
          name: action,
          title: { key: `platform.authz.actions.${action}`, ns: APP_NAMESPACE },
        })),
      });
      authz.ui.place(
        { type: 'settings', id },
        { section: PLATFORM_AUTHZ_SECTION },
      );
    }
  }

  public override async start(): Promise<void> {
    const calendar = this.app.container.resolve(calendarServiceToken);
    // A start whose database tasks did not create the tables (automatic tasks disabled, a failed earlier task) keeps
    // the default calendar and logs, instead of refusing to start; the periodic refresh loads it once they exist.
    await calendar
      .reload()
      .catch((error: unknown) =>
        this.app.container
          .resolve(loggingToken)
          .getLogger('oa-platform')
          .warn(
            { error },
            'Loading the work calendar failed; using the default calendar until the next refresh',
          ),
      );
    this.refreshTimer = setInterval(() => {
      calendar
        .reload()
        .catch((error: unknown) =>
          this.app.container
            .resolve(loggingToken)
            .getLogger('oa-platform')
            .error({ error }, 'Refreshing the work calendar failed'),
        );
    }, CALENDAR_REFRESH_MS);
    this.refreshTimer.unref?.();
  }

  public override async shutdown(): Promise<void> {
    if (this.refreshTimer) clearInterval(this.refreshTimer);
    this.refreshTimer = undefined;
  }
}

export { LocalDateTimeError } from './time-zone.js';
