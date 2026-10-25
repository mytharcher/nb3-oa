import { createServiceToken } from '@nocobase/service-provider';
import type { DatabaseConnection, RepositoryPolicy } from '@nocobase/db';
export const PERSONAL_SCHEDULE_FIELDS = [
  'id',
  'ownerUserId',
  'title',
  'description',
  'startAt',
  'endAt',
  'version',
  'sourceBookingId',
] as const;
export interface PersonalSchedule {
  id: string;
  ownerUserId: string;
  title: string;
  description: string;
  startAt: Date;
  endAt: Date;
  version: number;
  sourceBookingId: string | null;
}
export interface ScheduleInput {
  title: string;
  description: string;
  startAt: string;
  endAt: string;
}
export interface PersonalScheduleService {
  /** Trusted meeting domain integration. Call only after authorizing a booking mutation, in its transaction. */
  syncMeeting(
    booking: {
      id: string;
      organizerUserId: string;
      attendeeUserIds: string[];
      title: string;
      startAt: Date | string;
      endAt: Date | string;
      status: string;
    },
    connection: DatabaseConnection,
  ): Promise<void>;
  list(
    actorId: string,
    connection: DatabaseConnection,
    policy: RepositoryPolicy,
    interval?: { startAt: string; endAt: string },
  ): Promise<PersonalSchedule[]>;
  get(
    id: string,
    actorId: string,
    connection: DatabaseConnection,
    policy: RepositoryPolicy,
  ): Promise<PersonalSchedule>;
  create(
    input: ScheduleInput,
    actorId: string,
    connection: DatabaseConnection,
    policy: RepositoryPolicy,
  ): Promise<PersonalSchedule>;
  edit(
    id: string,
    expectedVersion: number,
    input: ScheduleInput,
    actorId: string,
    connection: DatabaseConnection,
    policy: RepositoryPolicy,
  ): Promise<PersonalSchedule>;
  remove(
    id: string,
    expectedVersion: number,
    actorId: string,
    connection: DatabaseConnection,
    policy: RepositoryPolicy,
  ): Promise<void>;
}
export const personalScheduleServiceToken =
  createServiceToken<PersonalScheduleService>('oa/personal-schedule-service');
