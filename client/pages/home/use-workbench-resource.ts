import { useCenterResource } from '../approvals/use-center-resource.js';

/** Reuse identity-aware request state while the workbench reads the new index. */
export function useWorkbenchResource(query: Record<string, string>) {
  return useCenterResource(query, 'workbench/tasks');
}
