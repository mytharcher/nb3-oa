import {
  createRepositoryLifecycleStore,
  type LifecycleStore,
} from '@nocobase/lifecycle';

/** SQLite may return an integer foreign reference stored in VARCHAR as "N.0". */
export function canonicalTransitionReference(id: string): string {
  return /^\d+\.0$/.test(id) && Number.isSafeInteger(Number(id))
    ? String(Number(id))
    : id;
}

/**
 * The public SDK store converts integer journal references to numbers on write.
 * Our application journals use string transitionId fields. Normalize the exact
 * SQLite representation on public reads, including historical rows, without
 * changing SDK code or rewriting immutable journals.
 */
export function createAppLifecycleStore(
  ...input: Parameters<typeof createRepositoryLifecycleStore>
): LifecycleStore {
  function wrap(store: LifecycleStore): LifecycleStore {
    return new Proxy(store, {
      get(target, property) {
        if (property === 'transaction')
          return <T>(
            callback: (child: LifecycleStore) => Promise<T>,
            options?: Parameters<LifecycleStore['transaction']>[1],
          ) => target.transaction((child) => callback(wrap(child)), options);
        if (property === 'findTransition')
          return (id: string) =>
            target.findTransition(canonicalTransitionReference(id));
        if (property === 'listTransitions')
          return (...args: Parameters<LifecycleStore['listTransitions']>) =>
            target.listTransitions(args[0], args[1], {
              ...args[2],
              ...(args[2]?.after
                ? { after: canonicalTransitionReference(args[2].after) }
                : {}),
            });
        if (property === 'findEffectRun')
          return async (
            ...args: Parameters<LifecycleStore['findEffectRun']>
          ) => {
            const run = await target.findEffectRun(...args);
            return run
              ? {
                  ...run,
                  transitionId: canonicalTransitionReference(run.transitionId),
                }
              : run;
          };
        if (property === 'createEffectRun')
          return async (
            ...args: Parameters<LifecycleStore['createEffectRun']>
          ) => {
            const run = await target.createEffectRun(...args);
            return {
              ...run,
              transitionId: canonicalTransitionReference(run.transitionId),
            };
          };
        if (property === 'listEffectRuns')
          return async (
            ...args: Parameters<LifecycleStore['listEffectRuns']>
          ) =>
            (await target.listEffectRuns(...args)).map((run) => ({
              ...run,
              transitionId: canonicalTransitionReference(run.transitionId),
            }));
        const member: unknown = Reflect.get(target, property);
        return typeof member === 'function'
          ? (member as (...args: unknown[]) => unknown).bind(target)
          : member;
      },
    });
  }
  return wrap(createRepositoryLifecycleStore(...input));
}
