import {
  defineAppConfig,
  type AppConfigFactory,
} from '@nocobase/app-server/config';
import type { ApprovalNotificationConfig } from '../providers/approval-notifications/contract.js';

const oaApprovals: AppConfigFactory<ApprovalNotificationConfig> =
  defineAppConfig(() => ({
    inbox: 'inbox',
    email: null,
    alarm: null,
    administrators: [],
  }));

export default oaApprovals;
