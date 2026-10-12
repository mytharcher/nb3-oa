import { createContext, useContext } from 'react';
import { useProcessResource } from './resource.js';
import type { DetailDto } from '../../../server/routes/process-management/schemas.js';
type Resource = ReturnType<typeof useProcessResource<{ data: DetailDto }>>;
export const ExecutionContext = createContext<Resource | null>(null);
export function useExecution() {
  const value = useContext(ExecutionContext);
  if (!value) throw new Error('Execution context missing');
  return value;
}
