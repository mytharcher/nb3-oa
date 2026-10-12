import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { ServiceProvider } from '@nocobase/service-provider';
import type { Application } from '@nocobase/app-server/application';
import {
  authorizationToken,
  defineDatabasePermission,
  condition,
  anyScope,
} from '@nocobase/app-plugin-authorization/server';
import {
  defineCompositeResource,
  defineRecordAccess,
} from '@nocobase/authorization/core';
import { databaseManagerToken } from '@nocobase/db';
import { jobExecutorServiceToken } from '@nocobase/app-server/jobs';
import {
  createLifecycleJobs,
  type LifecycleJobs,
} from '@nocobase/lifecycle/jobs';
import {
  notificationServiceToken,
  type NotificationConfig,
} from '@nocobase/app-plugin-notification';
import { i18nToken } from '@nocobase/app-server/i18n';
import { auditServiceToken } from '../audit/index.js';
import { employeeServiceToken } from '../employees/contract.js';
import {
  organizationServiceToken,
  registerDepartmentScopes,
} from '../org/index.js';
import { orgServiceToken } from '../org/contract.js';
import { calendarServiceToken } from '../platform/index.js';
import { meetingRoomServiceToken } from './contract.js';
import { createMeetingRoomService } from './service.js';
export * from './contract.js';
export { MeetingRoomError, createMeetingRoomService } from './service.js';
export const ROOM_FIELDS = [
  'id',
  'name',
  'location',
  'facilities',
  'capacity',
  'active',
  'requiresAdminConfirmation',
  'version',
] as const;
export const BOOKING_FIELDS = [
  'id',
  'seriesId',
  'roomId',
  'organizerEmployeeId',
  'organizerUserId',
  'title',
  'companyTimeZone',
  'attendeeUserIds',
  'status',
  'startAt',
  'endAt',
  'confirmedBy',
  'confirmedAt',
  'checkedInBy',
  'checkedInAt',
  'reason',
  'version',
  'statusChangedAt',
] as const;
const title = (key: string) => ({
  key: `meetingRooms.authz.${key}`,
  ns: 'nb3-oa',
});
export default class MeetingRoomsProvider extends ServiceProvider<Application> {
  public readonly name = 'oa/meeting-rooms-provider';
  private jobs?: LifecycleJobs;
  private service?: ReturnType<typeof createMeetingRoomService>;
  public override register() {
    const c = this.app.container;
    c.singleton(meetingRoomServiceToken, () => {
      const executors = c.resolve(jobExecutorServiceToken);
      this.jobs = createLifecycleJobs({
        jobs: executors.getJobExecutor('oa-meeting-rooms'),
        schedule: executors.getScheduleExecutor('oa-meeting-rooms'),
        jobName: 'oa-meeting-booking-effect',
        sweepEveryMs: 600000,
      });
      this.service = createMeetingRoomService({
        db: c.resolve(databaseManagerToken),
        audit: c.resolve(auditServiceToken),
        employees: c.resolve(employeeServiceToken),
        users: c.resolve(userAdministrationServiceToken),
        org: c.resolve(orgServiceToken),
        calendar: c.resolve(calendarServiceToken),
        dispatcher: this.jobs,
        notify: async (booking, key) => {
          // A non-sensitive prompt needs no automatic grant to booking details. Routes re-authorize every detail request.
          const config =
              this.app.config.get<NotificationConfig>('notification'),
            channelName = this.app.config.get<{ inbox: string | null }>(
              'oaApprovals',
            )?.inbox,
            channel = channelName ? config?.channels[channelName] : undefined;
          if (
            !channelName ||
            !channel ||
            channel.enabled === false ||
            channel.provider !== 'in-app'
          )
            return;
          const i18n = c.resolve(i18nToken),
            locale = i18n.getDefaultLocale();
          await i18n.ensureLocaleLoaded(locale);
          const t = i18n.getFixedT('nb3-oa', locale);
          await c.resolve(notificationServiceToken).send({
            idempotencyKey: key,
            source: { type: 'oa.meetingBooking', referenceId: booking.id },
            messages: {
              [channelName]: {
                to: [
                  ...new Set([
                    booking.organizerUserId,
                    ...booking.attendeeUserIds,
                  ]),
                ],
                title: t('meetingRooms.notifications.title'),
                body: t('meetingRooms.notifications.body'),
              },
            },
          });
        },
      });
      return this.service;
    });
  }
  public override async boot() {
    const authz = this.app.container.resolve(authorizationToken);
    for (const name of ['meetingRooms', 'meetingBookings'])
      authz.database.collections.add({ name, title: title('title') });
    const owned = authz.recordAccess.define(
      defineRecordAccess('oa.meetingBookingsOwned', (a) =>
        a
          .title(title('owned'))
          .collections('meetingBookings')
          .resolver(({ principal }) =>
            principal.type === 'user'
              ? condition('organizerUserId', '$eq', principal.id)
              : false,
          ),
      ),
    );
    const participant = authz.recordAccess.define(
      defineRecordAccess('oa.meetingBookingsParticipating', (a) =>
        a
          .title(title('participating'))
          .collections('meetingBookings')
          .resolver(async ({ principal }) => {
            if (principal.type !== 'user') return false;
            // Scope resolution uses only membership facts, never a raw business detail response.
            const rows = await this.app.container
              .resolve(databaseManagerToken)
              .repository<{ id: string; attendeeUserIds: string[] }>(
                'meetingBookings',
              )
              .findMany({ select: (s) => s.fields('id', 'attendeeUserIds') });
            const ids = rows
              .filter((r) => r.attendeeUserIds.includes(principal.id))
              .map((r) => r.id);
            return ids.length
              ? anyScope(ids.map((id) => condition('id', '$eq', id)))
              : false;
          }),
      ),
    );
    const readable = authz.recordAccess.define(
      defineRecordAccess('oa.meetingBookingsReadable', (a) =>
        a
          .title(title('readable'))
          .collections('meetingBookings')
          .resolver(async ({ principal }) => {
            if (principal.type !== 'user') return false;
            const rows = await this.app.container
              .resolve(databaseManagerToken)
              .repository<{ id: string; attendeeUserIds: string[] }>(
                'meetingBookings',
              )
              .findMany({ select: (s) => s.fields('id', 'attendeeUserIds') });
            return anyScope([
              condition('organizerUserId', '$eq', principal.id),
              ...rows
                .filter((b) => b.attendeeUserIds.includes(principal.id))
                .map((b) => condition('id', '$eq', b.id)),
            ]);
          }),
      ),
    );
    const departments = registerDepartmentScopes(
      authz,
      this.app.container.resolve(organizationServiceToken),
      {
        prefix: 'oa.meetingBookings',
        targets: [
          { collection: 'meetingBookings', ownerField: 'organizerUserId' },
        ],
      },
    );
    const roomRead = defineDatabasePermission((p) =>
      p.collection('meetingRooms').read((r) => r.fields(...ROOM_FIELDS)),
    );
    const bookingRead = defineDatabasePermission((p) =>
      p.collection('meetingBookings').read((r) => r.fields(...BOOKING_FIELDS)),
    );
    authz.compositeResources.define(
      defineCompositeResource('oa.meetingRooms', (r) =>
        r
          .title(title('title'))
          .action('view', (a) =>
            a.title(title('view')).grant('meetingRooms', roomRead),
          )
          .action('manage', (a) =>
            a
              .title(title('manage'))
              .grant('meetingRooms', roomRead.create('*').update('*')),
          ),
      ),
    );
    const all = { key: 'allRecords', collections: ['meetingBookings'] };
    authz.compositeResources.define(
      defineCompositeResource('oa.meetingBookings', (r) =>
        r
          .title(title('bookings'))
          .action('view', (a) =>
            a
              .title(title('view'))
              .grant(
                'meetingBookings',
                bookingRead
                  .options(
                    owned,
                    participant,
                    readable,
                    all,
                    departments.myDepartments,
                    departments.myDepartmentsAndBelow,
                    departments.headedDepartments,
                  )
                  .default(owned),
              ),
          )
          .action('create', (a) =>
            a
              .title(title('create'))
              .grant(
                'meetingBookings',
                bookingRead.create('*').options(owned).default(owned),
              ),
          )
          .action('edit', (a) =>
            a
              .title(title('edit'))
              .grant(
                'meetingBookings',
                bookingRead
                  .update('*')
                  .options(
                    owned,
                    participant,
                    readable,
                    all,
                    departments.myDepartments,
                    departments.myDepartmentsAndBelow,
                    departments.headedDepartments,
                  )
                  .default(owned),
              ),
          )
          .action('cancel', (a) =>
            a
              .title(title('cancel'))
              .grant(
                'meetingBookings',
                bookingRead
                  .update('*')
                  .options(
                    owned,
                    participant,
                    readable,
                    all,
                    departments.myDepartments,
                    departments.myDepartmentsAndBelow,
                    departments.headedDepartments,
                  )
                  .default(owned),
              ),
          )
          .action('confirm', (a) =>
            a
              .title(title('confirm'))
              .grant(
                'meetingBookings',
                bookingRead
                  .update('*')
                  .options(
                    owned,
                    participant,
                    readable,
                    all,
                    departments.myDepartments,
                    departments.myDepartmentsAndBelow,
                    departments.headedDepartments,
                  )
                  .default(owned),
              ),
          )
          .action('reject', (a) =>
            a
              .title(title('reject'))
              .grant(
                'meetingBookings',
                bookingRead
                  .update('*')
                  .options(
                    owned,
                    participant,
                    readable,
                    all,
                    departments.myDepartments,
                    departments.myDepartmentsAndBelow,
                    departments.headedDepartments,
                  )
                  .default(owned),
              ),
          )
          .action('checkIn', (a) =>
            a
              .title(title('checkIn'))
              .grant(
                'meetingBookings',
                bookingRead
                  .update('*')
                  .options(
                    owned,
                    participant,
                    readable,
                    all,
                    departments.myDepartments,
                    departments.myDepartmentsAndBelow,
                    departments.headedDepartments,
                  )
                  .default(owned),
              ),
          ),
      ),
    );
    authz.ui.sections.add({
      name: 'oa.meetingRooms',
      parent: 'administration',
      title: title('title'),
    });
    for (const id of ['oa.meetingRooms', 'oa.meetingBookings'])
      authz.ui.place({ type: 'composite', id }, { section: 'oa.meetingRooms' });
  }
  public override async start() {
    this.app.container.resolve(meetingRoomServiceToken);
    await this.jobs!.start(this.service!.runtime);
  }
  public override async shutdown() {
    await this.jobs?.shutdown();
  }
}
