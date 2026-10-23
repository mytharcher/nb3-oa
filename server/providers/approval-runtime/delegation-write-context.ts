import { AsyncLocalStorage } from 'node:async_hooks';

const speculative = new AsyncLocalStorage<boolean>();

/** Raised before changing delegation facts, so the business transaction rolls back. */
export class DelegationBoundaryRequired extends Error {
  constructor() {
    super('Delegation writes require the ordered cross-business boundary.');
  }
}

export function requireDelegationBoundary(): void {
  if (speculative.getStore()) throw new DelegationBoundaryRequired();
}

export function withDelegationAttempt<T>(
  probe: boolean,
  work: () => Promise<T>,
) {
  return speculative.run(probe, work);
}
