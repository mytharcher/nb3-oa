import type { LocaleResource } from '@nocobase/i18n';
import type enUS from './approvals.en-US.js';

const zhCN: LocaleResource<typeof enUS> = {
  notifications: {
    title: '审批动态',
    assigned: '您有一项待处理审批。',
    delegated: '您有一项需要代他人处理的审批。',
    copied: '有一份申请抄送给您。',
    reminder: '有一项审批正在等待您的处理。',
    escalated: '有一项超时审批已升级给您。',
    approved: '您的申请已通过。',
    rejected: '您的申请已驳回。',
    revision: '您的申请已退回，请修改后重新提交。',
    withdrawn: '您的申请已撤回。',
    terminated: '您的申请已终止。',
    result: '您的申请状态已更新。',
    attention: '有一项审批需要管理员处理。',
    deadline: '“{{name}}”将于 {{date}} 到期。',
  },
};

export default zhCN;
