import type { ResourceOption, AuthorizationOptions } from './types.js';
import { resources } from './model.js';

/** OA owns this presentation map; plugin registration groups are not navigation. */
export const domainNames = [
  'personal',
  'office',
  'organization',
  'hr',
  'finance',
  'procurement',
  'administration',
  'configuration',
  'system',
] as const;
export type DomainName = (typeof domainNames)[number];
export function resourceDomain(resource: ResourceOption): DomainName {
  const key = `${resource.group ?? ''} ${resource.value}`.toLowerCase();
  if (
    /configuration|platform|numbering|dictionary|workflow|process.management/.test(
      key,
    )
  )
    return 'configuration';
  if (/workbench|task.center|inbox|notification.inbox|approvals/.test(key))
    return 'personal';
  if (/knowledge|announcement|work.item|meeting|vehicle|general/.test(key))
    return 'office';
  if (/org\.|department|position|duty.role|job.grade/.test(key))
    return 'organization';
  if (
    /employee|leave|overtime|outing|attendance|onboard|recruit|transfer|departure|probation|training|headcount/.test(
      key,
    )
  )
    return 'hr';
  if (/expense|reimbursement|payment|loan|budget|finance|travel/.test(key))
    return 'finance';
  if (/purchase|procurement|contract|vendor/.test(key)) return 'procurement';
  if (/asset|suppl|seal|certificate/.test(key)) return 'administration';
  return 'system';
}
export function domainResources(options: AuthorizationOptions) {
  const all = [
    ...new Map(
      resources(options).map((item) => [`${item.type}:${item.value}`, item]),
    ).values(),
  ];
  return domainNames
    .map((value) => ({
      value,
      resources: all.filter((item) => resourceDomain(item) === value),
    }))
    .filter((domain) => domain.resources.length);
}
