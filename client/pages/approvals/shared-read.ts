/** Share only an in-flight read for one API client, actor, permission revision and refresh generation.
 * Settled reads are removed immediately; no stale authorization cache survives navigation.
 */
const clients = new WeakMap<object, Map<string, PendingRead>>();
interface PendingRead {
  controller: AbortController;
  promise: Promise<unknown>;
  subscribers: number;
}
export function sharedRead<T>(
  client: object,
  key: string,
  request: (signal: AbortSignal) => Promise<T>,
): { promise: Promise<T>; release: () => void } {
  let reads = clients.get(client);
  if (!reads) {
    reads = new Map();
    clients.set(client, reads);
  }
  let pending = reads.get(key);
  if (!pending) {
    const controller = new AbortController();
    const entry: PendingRead = {
      controller,
      promise: request(controller.signal),
      subscribers: 0,
    };
    pending = entry;
    reads.set(key, entry);
    const remove = () => {
      if (reads.get(key) === entry) reads.delete(key);
    };
    void entry.promise.then(remove, remove);
  }
  const entry = pending;
  entry.subscribers++;
  let released = false;
  return {
    promise: entry.promise as Promise<T>,
    release: () => {
      if (released) return;
      released = true;
      entry.subscribers--;
      // React StrictMode remounts effects synchronously. Let that subscriber join
      // before cancelling; one unmount must not cancel another mounted reader.
      queueMicrotask(() => {
        if (entry.subscribers === 0) {
          if (reads.get(key) === entry) reads.delete(key);
          entry.controller.abort();
        }
      });
    },
  };
}
