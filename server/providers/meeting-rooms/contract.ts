import { createServiceToken } from '@nocobase/service-provider';
import type { DatabaseConnection, RepositoryPolicy } from '@nocobase/db';
export interface MeetingRoom {
  id: string;
  name: string;
  location: string | null;
  facilities: string | null;
  capacity: number;
  active: boolean;
  requiresAdminConfirmation: boolean;
  version: number;
}
export interface MeetingBooking {
  id: string;
  seriesId: string | null;
  roomId: string;
  organizerEmployeeId: string;
  organizerUserId: string;
  title: string;
  companyTimeZone: string;
  attendeeUserIds: string[];
  status: 'pendingConfirmation' | 'confirmed' | 'cancelled' | 'rejected';
  startAt: Date | string;
  endAt: Date | string;
  confirmedBy: string | null;
  confirmedAt: Date | string | null;
  checkedInBy: string | null;
  checkedInAt: Date | string | null;
  reason: string | null;
  version: number;
}
export interface Command {
  actorId: string;
  requestId: string;
}
export interface BookingInput extends Command {
  roomId: string;
  title: string;
  attendeeUserIds: string[];
  date: string;
  startTime: string;
  endTime: string;
  recurrence?: { frequency: 'daily' | 'weekly'; count: number };
}
export const BOOKING_READ_FIELDS = [
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
export type MeetingBookingAction =
  'edit' | 'cancel' | 'confirm' | 'reject' | 'checkIn';
export interface MeetingRoomService {
  /** Business qualification only. HTTP/center callers must separately check each action grant, fields and record scope. */
  businessActions(
    record: MeetingBooking,
    actorId: string,
    tx: DatabaseConnection,
  ): Promise<MeetingBookingAction[]>;
  /** Full mutable future collection. Trusted internal read; does not grant access to any returned record. */
  futureCandidates(
    id: string,
    tx: DatabaseConnection,
  ): Promise<MeetingBooking[]>;

  getBooking(
    id: string,
    tx: DatabaseConnection,
    policy: RepositoryPolicy,
  ): Promise<MeetingBooking | undefined>;

  edit(
    input: Command & {
      id: string;
      target: 'this' | 'future';
      expectedVersions: Record<string, number>;
      roomId: string;
      title: string;
      attendeeUserIds: string[];
      date: string;
      startTime: string;
      endTime: string;
    },
    tx: DatabaseConnection,
    policy?: RepositoryPolicy,
  ): Promise<MeetingBooking[]>;
  cancelFuture(
    input: Command & {
      id: string;
      expectedVersions: Record<string, number>;
      reason?: string;
    },
    tx: DatabaseConnection,
    policy?: RepositoryPolicy,
  ): Promise<MeetingBooking[]>;

  saveRoom(
    input: Command &
      Omit<MeetingRoom, 'id' | 'version'> & {
        id?: string;
        expectedVersion?: number;
        reason: string;
      },
    tx: DatabaseConnection,
    policy?: RepositoryPolicy,
  ): Promise<MeetingRoom>;
  create(
    input: BookingInput,
    tx: DatabaseConnection,
    policy?: RepositoryPolicy,
  ): Promise<MeetingBooking[]>;
  act(
    input: Command & {
      id: string;
      expectedVersion: number;
      action: 'confirm' | 'reject' | 'cancel' | 'checkIn';
      reason?: string;
    },
    tx: DatabaseConnection,
    policy?: RepositoryPolicy,
  ): Promise<MeetingBooking>;
}
export const meetingRoomServiceToken = createServiceToken<MeetingRoomService>(
  'oa/meeting-room-service',
);
