import { useResource } from '../approvals/use-resource.js';
import type { Balance, LeaveType } from '../leave-balances/types.js';

export interface MeetingSummary {
  date: string;
  timeZone: string;
  total: number;
  items: {
    id: string;
    title: string;
    startAt: string;
    endAt: string;
    status: string;
  }[];
}

/** The leave card's reads, for a page that refreshes them together with its own. */
export function useLeaveCardData() {
  const balances = useResource<Balance[]>('leaveBalances/me');
  const options = useResource<{ leaveTypes: LeaveType[] }>(
    'leaveRequests/options',
  );
  return { balances, options };
}
export type LeaveCardData = ReturnType<typeof useLeaveCardData>;

/** Today's meetings; `enabled` false skips the read for a viewer without the grant. */
export function useMeetingSummary(enabled = true) {
  return useResource<MeetingSummary>(enabled ? 'workbench/meetings' : null);
}
