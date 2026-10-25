import { createServiceToken } from '@nocobase/service-provider';
import type { RepositoryRecord } from '@nocobase/db';
export interface WecomAttendanceConfig {
  enabled: boolean;
  corpId: string;
  secret: string;
  mappings: { wecomUserId: string; userId: string }[];
}
export interface WecomAttendanceRun extends RepositoryRecord {
  id: string;
  actorId: string;
  requestKey: string;
  startDate: string;
  endDate: string;
  state: 'running' | 'completed' | 'failed';
  errorCode: string | null;
  configurationHash: string;
  reason: string;
  committedRecords: number;
  completedBatches: number;
  completedKeys: string[];
  attempts: number;
  leaseToken: string | null;
  leaseUntil: string | null;
  createdAt: string;
  updatedAt: string;
}
export interface WecomAttendanceService {
  status(): { enabled: boolean; configured: boolean; mappedUsers: number };
  sync(input: {
    actorId: string;
    requestKey: string;
    startDate: string;
    endDate: string;
    reason: string;
  }): Promise<WecomAttendanceRun>;
}
export const wecomAttendanceServiceToken =
  createServiceToken<WecomAttendanceService>('oa/wecom-attendance');
