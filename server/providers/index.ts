import type { ApplicationServiceProviderConstructor } from '@nocobase/app-server/application';

import AuditProvider from './audit/index.js';
import ApprovalNotificationsProvider from './approval-notifications/index.js';
import ApprovalDirectoryProvider from './approval-directory/index.js';
import LeaveProvider from './leave/index.js';
import EmployeesProvider from './employees/index.js';
import ImportProvider from './import/index.js';
import OrgProvider from './org/index.js';
import PlatformProvider from './platform/index.js';

export { auditServiceToken, type AuditService } from './audit/index.js';
export { orgServiceToken, type OrgService } from './org/contract.js';

// Each OA module owns `server/providers/<module>/` with an `index.ts` default-exporting its provider. Order is
// dependency order: audit first, since every module records into it; org before employees, which reads it.
const serviceProviders: readonly ApplicationServiceProviderConstructor[] = [
  AuditProvider,
  PlatformProvider,
  OrgProvider,
  EmployeesProvider,
  ApprovalDirectoryProvider,
  ApprovalNotificationsProvider,
  LeaveProvider,
  // Writes through the organisation and employee services.
  ImportProvider,
];

export default serviceProviders;
