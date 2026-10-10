import type {
  ApprovalDirectory,
  TaskRow,
} from '@nocobase/app-plugin-approval/server';
import {
  createServiceToken,
  type ServiceToken,
} from '@nocobase/service-provider';

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
    recordId: string;
    applicantId: string;
    state: string;
    transitionId: string;
  }): Promise<void>;
  alarm(input: {
    recordId: string;
    recipients: readonly string[];
    eventId: string;
    reason: string;
  }): Promise<void>;
}

export const approvalNotificationServiceToken: ServiceToken<ApprovalNotificationService> =
  createServiceToken<ApprovalNotificationService>('oa/approval-notifications');

/** Channels are explicit names: configuring an unrelated channel never subscribes it to OA events. */
export interface ApprovalNotificationConfig {
  readonly inbox: string | null;
  readonly email: string | null;
  readonly alarm: string | null;
  readonly administrators: readonly string[];
}
