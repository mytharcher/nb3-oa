import type { LucideIcon } from 'lucide-react';
import {
  CalendarDays,
  ClipboardCheck,
  FilePen,
  ListTodo,
  MailOpen,
  ReceiptText,
  SendHorizontal,
  ShoppingCart,
} from 'lucide-react';

// Prototype only: the page is not connected to `/api/userTasks` yet. The shapes below follow the
// Task Center plugin's `TaskCenterTask` (sourceType → subject → status) so the page can switch to
// the real data source without changing its layout. `summary` has no counterpart in the plugin's
// index; see the gap notes in the page component.

export type TaskStatus = 'pending' | 'completed' | 'cancelled';
export interface PrototypeTask {
  readonly id: string;
  readonly sourceType: string;
  readonly sourceKey: string;
  readonly subject: string;
  readonly status: TaskStatus;
  readonly title: string;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly summary?: Readonly<Record<string, string | number>>;
}

export interface TaskSourceDefinition {
  readonly sourceType: string;
  /** Translation key of the source type name. */
  readonly label: string;
  readonly icon: LucideIcon;
  /** Per-source wording for the three index statuses, e.g. “In review” for my own requests. */
  readonly statusLabels?: Partial<Record<TaskStatus, string>>;
}

export interface TaskSubjectDefinition {
  readonly subject: string;
  /** Translation key of the subject name. */
  readonly label: string;
  readonly icon: LucideIcon;
}

/** Fixed “now” for the sample data, so relative times and day groups stay stable in the prototype. */
export const prototypeNow = new Date('2026-10-21T11:30:00+08:00');

export const taskSources: readonly TaskSourceDefinition[] = [
  {
    sourceType: 'approval.task',
    label: 'taskCenter.sources.approvalTask',
    icon: ClipboardCheck,
  },
  {
    sourceType: 'approval.mine',
    label: 'taskCenter.sources.approvalMine',
    icon: SendHorizontal,
    statusLabels: {
      pending: 'taskCenter.status.inReview',
      completed: 'taskCenter.status.finished',
      cancelled: 'taskCenter.status.withdrawn',
    },
  },
  {
    sourceType: 'approval.cc',
    label: 'taskCenter.sources.approvalCc',
    icon: MailOpen,
    statusLabels: {
      pending: 'taskCenter.status.unread',
      completed: 'taskCenter.status.read',
    },
  },
  {
    sourceType: 'oa.workItem',
    label: 'taskCenter.sources.workItem',
    icon: ListTodo,
  },
];

export const taskSubjects: readonly TaskSubjectDefinition[] = [
  { subject: 'leave', label: 'taskCenter.subjects.leave', icon: CalendarDays },
  {
    subject: 'reimbursement',
    label: 'taskCenter.subjects.reimbursement',
    icon: ReceiptText,
  },
  {
    subject: 'purchase',
    label: 'taskCenter.subjects.purchase',
    icon: ShoppingCart,
  },
  {
    subject: 'contract',
    label: 'taskCenter.subjects.contract',
    icon: FilePen,
  },
  {
    subject: 'workItem',
    label: 'taskCenter.subjects.workItem',
    icon: ListTodo,
  },
];

let sequence = 0;
function task(
  sourceType: string,
  subject: string,
  status: TaskStatus,
  title: string,
  createdAt: string,
  summary?: PrototypeTask['summary'],
): PrototypeTask {
  sequence += 1;
  const created = new Date(createdAt);
  const updated =
    status === 'pending'
      ? created
      : new Date(created.getTime() + (sequence % 5) * 3_600_000 + 1_800_000);
  return {
    id: `prototype-${sequence}`,
    sourceType,
    sourceKey: `${subject}-${sequence}`,
    subject,
    status,
    title,
    createdAt: created.toISOString(),
    updatedAt: updated.toISOString(),
    ...(summary ? { summary } : {}),
  };
}

const leave = (type: string, from: string, to: string, days: number) => ({
  type,
  from,
  to,
  days,
});
const expense = (amount: number, category: string, reason: string) => ({
  amount,
  category,
  reason,
});
const purchase = (item: string, quantity: number, budget: number) => ({
  item,
  quantity,
  budget,
});

export const prototypeTasks: readonly PrototypeTask[] = [
  task(
    'approval.task',
    'leave',
    'pending',
    '张晓雯的年假申请',
    '2026-10-21T09:12:00+08:00',
    leave('年假', '2026-10-27', '2026-10-29', 3),
  ),
  task(
    'approval.task',
    'reimbursement',
    'pending',
    '李明的差旅报销（上海客户拜访）',
    '2026-10-21T08:40:00+08:00',
    expense(4280.5, '差旅费', '上海客户现场拜访往返交通与住宿'),
  ),
  task(
    'approval.task',
    'purchase',
    'pending',
    '研发部采购申请：测试服务器',
    '2026-10-20T17:05:00+08:00',
    purchase('机架式测试服务器', 2, 56000),
  ),
  task(
    'approval.task',
    'leave',
    'pending',
    '王磊的病假申请',
    '2026-10-20T15:22:00+08:00',
    leave('病假', '2026-10-21', '2026-10-21', 1),
  ),
  task(
    'approval.task',
    'contract',
    'pending',
    '华东区域年度物流服务合同审批',
    '2026-10-20T11:48:00+08:00',
  ),
  task(
    'approval.task',
    'reimbursement',
    'pending',
    '陈静的办公用品报销',
    '2026-10-19T16:30:00+08:00',
    expense(368, '办公用品', '部门季度办公耗材补充'),
  ),
  task(
    'approval.task',
    'leave',
    'completed',
    '赵倩的调休申请',
    '2026-10-18T10:15:00+08:00',
    leave('调休', '2026-10-20', '2026-10-20', 0.5),
  ),
  task(
    'approval.task',
    'reimbursement',
    'completed',
    '周涛的招待费报销',
    '2026-10-17T14:02:00+08:00',
    expense(1560, '业务招待费', '合作伙伴季度复盘晚宴'),
  ),
  task(
    'approval.task',
    'purchase',
    'cancelled',
    '市场部采购申请：展会物料',
    '2026-10-16T09:45:00+08:00',
    purchase('展台搭建与印刷物料', 1, 18000),
  ),
  task(
    'approval.task',
    'contract',
    'completed',
    '办公楼保洁服务续签合同',
    '2026-10-15T13:20:00+08:00',
  ),
  task(
    'approval.mine',
    'leave',
    'pending',
    '我的年假申请（国庆后补休）',
    '2026-10-20T10:00:00+08:00',
    leave('年假', '2026-11-03', '2026-11-05', 3),
  ),
  task(
    'approval.mine',
    'reimbursement',
    'pending',
    '我的差旅报销（北京培训）',
    '2026-10-19T18:20:00+08:00',
    expense(2365, '差旅费', '参加北京产品培训的交通与住宿'),
  ),
  task(
    'approval.mine',
    'purchase',
    'completed',
    '我的采购申请：显示器',
    '2026-10-12T09:30:00+08:00',
    purchase('27 英寸显示器', 1, 2199),
  ),
  task(
    'approval.mine',
    'leave',
    'cancelled',
    '我的事假申请',
    '2026-10-08T08:50:00+08:00',
    leave('事假', '2026-10-10', '2026-10-10', 1),
  ),
  task(
    'approval.cc',
    'contract',
    'pending',
    '抄送：软件许可年度采购合同',
    '2026-10-21T07:55:00+08:00',
  ),
  task(
    'approval.cc',
    'reimbursement',
    'pending',
    '抄送：销售部团队建设费用报销',
    '2026-10-20T19:10:00+08:00',
    expense(6400, '团队建设费', '销售部第三季度团队建设活动'),
  ),
  task(
    'approval.cc',
    'leave',
    'completed',
    '抄送：刘洋的婚假申请',
    '2026-10-14T11:00:00+08:00',
    leave('婚假', '2026-10-24', '2026-11-04', 10),
  ),
  task(
    'oa.workItem',
    'workItem',
    'pending',
    '整理第四季度部门预算执行情况',
    '2026-10-21T10:05:00+08:00',
  ),
  task(
    'oa.workItem',
    'workItem',
    'pending',
    '确认新员工入职设备交付',
    '2026-10-20T14:40:00+08:00',
  ),
  task(
    'oa.workItem',
    'workItem',
    'completed',
    '提交月度考勤异常说明',
    '2026-10-11T09:00:00+08:00',
  ),
];
