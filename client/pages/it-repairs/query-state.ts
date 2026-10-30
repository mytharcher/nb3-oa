import { useBusinessResource } from '#hooks/use-business-resource';
const keys = [
  'q',
  'status',
  'groupId',
  'assigneeId',
  'category',
  'priority',
  'from',
  'to',
  'dateField',
  'overdue',
  'cohort',
  'sort',
  'direction',
] as const;
export function repairQuery(params: URLSearchParams): Record<string, string> {
  return Object.fromEntries(
    keys.flatMap((k) => (params.get(k) ? [[k, params.get(k)!]] : [])),
  );
}
export interface Options {
  groups: { id: string; title: string }[];
  engineers: { id: string; name: string }[];
  actorId: string;
  timeZone: string;
}
export function useRepairOptions() {
  return useBusinessResource<{ data: Options }>('itRepairs/queryOptions');
}
