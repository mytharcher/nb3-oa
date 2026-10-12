import type { LifecycleRecord, JsonObject } from '@nocobase/lifecycle';

export const TRAVEL_LIFECYCLE = 'oa.travel';
export interface TravelRecord extends LifecycleRecord {
  id: string;
  applicantId: string;
  createdById: string;
  number: string | null;
  departmentId: string | null;
  reason: string;
  destination: string;
  international: boolean;
  startAt: string;
  endAt: string;
  companionIds: string[];
  attachments: string[];
  transportCents: number;
  lodgingCents: number;
  allowanceCents: number;
  amountCents: number;
  needsLoan: boolean;
  needsBooking: boolean;
  approvalGrantedAt: string | null;
  originalHeadApproverId: string | null;
  bookingInformation: string | null;
  exceptionReason: string | null;
  cancelledAt: string | null;
  cancellationId: string | null;
  standardSnapshot: JsonObject | null;
  managerApproverId: string | null;
  headMerged: JsonObject | null;
  ruleSnapshot: JsonObject | null;
  headApproverId: string | null;
  executiveApproverId: string | null;
  gmApproverId: string | null;
  gmMerged: JsonObject | null;
  authorizationId: string | null;
  authorizationSourceId: string | null;
  approvalGeneration: number;
  status: string;
  lifecycleVersion: number;
  createdAt: string;
}
export type TravelInput = Pick<
  TravelRecord,
  | 'destination'
  | 'international'
  | 'startAt'
  | 'endAt'
  | 'companionIds'
  | 'attachments'
  | 'transportCents'
  | 'lodgingCents'
  | 'allowanceCents'
  | 'needsLoan'
  | 'needsBooking'
  | 'reason'
>;
import { createServiceToken } from '@nocobase/service-provider';
import type { TravelService } from './service.js';
export const travelServiceToken =
  createServiceToken<TravelService>('oa/travel-service');
