import type {
  ApprovalDirectory,
  TaskRow,
} from '@nocobase/app-plugin-approval/server';
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

/** Application-owned translated business context, never a raw exception message. */
export interface ApprovalNotificationDetail {
  key: string;
  values?: Readonly<Record<string, string | number>>;
}

export interface ApprovalNotificationService {
  task(input: {
    task: TaskRow;
    reason: string;
    directory?: ApprovalDirectory;
    applicantId?: string;
    kind?: string;
    at?: string;
  }): Promise<void>;
  result(input: {
    kind?: string;
    recordId: string;
    applicantId: string;
    state: string;
    transitionId: string;
  }): Promise<void>;
  alarm(input: {
    kind?: string;
    recordId: string;
    recipients: readonly string[];
    eventId: string;
    reason: string;
    detail?: ApprovalNotificationDetail;
  }): Promise<void>;
}

export const approvalNotificationServiceToken: ServiceToken<ApprovalNotificationService> =
  createServiceToken<ApprovalNotificationService>('oa/approval-notifications');

/** Channels are explicit names: configuring an unrelated channel never subscribes it to OA events. */
export interface ApprovalNotificationConfig {
  readonly inbox: string | null;
  /** Explicit deployment-owned user binding; no email/name guessing. */
  readonly enterpriseMessaging?: {
    channel: string;
    users: Readonly<Record<string, string>>;
  };
  readonly email: string | null;
  readonly alarm: string | null;
  readonly administrators: readonly string[];
}
