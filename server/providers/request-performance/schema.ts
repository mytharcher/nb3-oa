import { AsyncLocalStorage } from 'node:async_hooks';
import type { DatabaseConnection } from '@nocobase/db';

type Collections = Pick<
  DatabaseConnection['collections'],
  'getPhysical' | 'invalidate'
>;
type Schema = Awaited<ReturnType<Collections['getPhysical']>>;
const reads = new AsyncLocalStorage<
  Map<Collections, Map<string, Promise<Schema>>>
>();

/** Schema descriptions only; no rows, identities, decisions or policies are cached. */
export function withRequestSchemaReads<T>(work: () => Promise<T>): Promise<T> {
  return reads.run(new Map(), work);
}

/** The public getPhysical API bypasses the registry cache and re-inspects PG catalogs
 * for every authorization check. Share its in-flight/result read only in this HTTP
 * request; concurrent requests share only the still-running schema inspection,
 * never a settled schema or any business rows. Explicit transaction connections retain their own registry and semantics.
 */
export function installRequestSchemaReads(
  collections: Collections,
): () => void {
  const original = collections.getPhysical;
  const invalidate = collections.invalidate;
  let generation = 0;
  const inFlight = new Map<string, Promise<Schema>>();
  collections.getPhysical = async (name) => {
    const context = reads.getStore();
    if (!context) return original.call(collections, name);
    let cache = context.get(collections);
    if (!cache) {
      cache = new Map();
      context.set(collections, cache);
    }
    const key = JSON.stringify([generation, name]);
    let pending = cache.get(key);
    if (!pending) {
      pending = inFlight.get(key);
      if (!pending) {
        pending = original.call(collections, name);
        inFlight.set(key, pending);
        const inspection = pending;
        const release = () => {
          if (inFlight.get(key) === inspection) inFlight.delete(key);
        };
        void pending.then(release, release);
      }
      cache.set(key, pending);
      const current = pending;
      void pending.catch(() => {
        if (cache.get(key) === current) cache.delete(key);
      });
    }
    const schema = await pending;
    return schema === undefined ? undefined : structuredClone(schema);
  };
  collections.invalidate = (...args: Parameters<Collections['invalidate']>) => {
    generation++;
    return invalidate.apply(collections, args);
  };
  return () => {
    collections.getPhysical = original;
    collections.invalidate = invalidate;
  };
}
