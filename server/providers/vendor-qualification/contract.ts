import type { ApprovalService } from '@nocobase/app-plugin-approval/server';
import type { LifecycleRecord } from '@nocobase/lifecycle';
import { createServiceToken } from '@nocobase/service-provider';
import type { DatabaseConnection } from '@nocobase/db';
import type { CommitteeVersion } from './committee.js';
export const VENDOR_QUALIFICATION_KIND = 'oa.vendorQualification';
export type VendorQualificationState =
  | 'draft'
  | 'revision'
  | 'purchasing'
  | `committee_v${number}`
  | 'removalReview'
  | 'qualified'
  | 'removed'
  | 'rejected'
  | 'withdrawn'
  | 'terminated';
export interface VendorQualificationInput {
  operation: 'qualify' | 'remove';
  vendorId: string;
  name: string;
  category: string;
  reason: string;
  quoteCents: number;
  cases: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
  attachments: readonly string[];
  qualificationExpiry: string | null;
}
export interface VendorQualificationRecord
  extends VendorQualificationInput, LifecycleRecord {
  id: string;
  applicantId: string;
  createdById: string;
  departmentId: string | null;
  number: string | null;
  status: VendorQualificationState;
  lifecycleVersion: number;
  sourceVendorVersion: number | null;
  committeeVersion: number | null;
  committeeSnapshot: CommitteeVersion | null;
  ruleSnapshot: Readonly<Record<string, unknown>>;
  createdAt: Date;
  updatedAt: Date;
}
/** Narrow business facts facade; HTTP/security surface remains local to this module. */
export interface VendorQualificationService {
  listForCenter(
    actorId: string,
    view: 'all' | 'pending' | 'done' | 'copied',
    policy: import('@nocobase/db').RepositoryPolicy,
  ): Promise<
    (VendorQualificationRecord & {
      applicant: { id: string; name: string } | null;
      createdBy: { id: string; name: string } | null;
    })[]
  >;
  approvals: Pick<ApprovalService, 'tasksOf' | 'runsFor' | 'actionsOf'>;
  action(
    id: string,
    actorId: string,
    input: Omit<
      import('@nocobase/app-plugin-approval/server').PerformInput,
      'actor'
    >,
    policy?: import('@nocobase/db').RepositoryPolicy,
  ): Promise<unknown>;
  maintenanceReassign(
    input: Parameters<ApprovalService['reassign']>[0],
  ): ReturnType<ApprovalService['reassign']>;
  approvedQualificationOf(
    vendorId: string,
    connection: DatabaseConnection,
  ): Promise<{
    id: string;
    vendorId: string;
    qualificationExpiry: string;
  } | null>;
}
export const vendorQualificationServiceToken =
  createServiceToken<VendorQualificationService>('oa/vendor-qualification');
