import {
  ClipboardCheck,
  ListTodo,
  MailOpen,
  SendHorizontal,
  BellRing,
} from 'lucide-react';

export const taskSources = [
  {
    sourceType: 'approval.task',
    label: 'taskCenter.sources.approvalTask',
    icon: ClipboardCheck,
  },
  {
    sourceType: 'approval.application',
    label: 'taskCenter.sources.approvalMine',
    icon: SendHorizontal,
  },
  {
    sourceType: 'approval.cc',
    label: 'taskCenter.sources.approvalCc',
    icon: MailOpen,
  },
  {
    sourceType: 'oa.workItem',
    label: 'taskCenter.sources.workItem',
    icon: ListTodo,
  },
  {
    sourceType: 'oa.announcementReceipt',
    label: 'approvalCenter.kinds.announcementReceipt',
    icon: BellRing,
  },
] as const;
export interface PersonalTask {
  id: string;
  sourceType: string;
  sourceKey: string;
  subject: string;
  title: string;
  recordId?: string;
  businessStatus?: string;
  status: 'pending' | 'completed' | 'cancelled';
  createdAt: string;
  updatedAt: string;
}
export interface TaskCenterData {
  tasks: PersonalTask[];
  total: number;
  counts: { pending: number; closed: number; all: number };
  facets: { sourceType: string; subject: string; pending: number }[];
}
