import { createRequestKey } from '#lib/request-key';
import { useEffect, useRef, useState } from 'react';
import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
export interface Pending {
  actor: string;
  scope: string;
  path: string;
  method: 'POST' | 'PATCH';
  requestKey: string;
  json?: Record<string, unknown>;
  file?: { name: string; size: number; hash: string; version: number };
}
const prefix = 'oa:templatePrint:pending:';
const storageKey = (actor: string, scope: string) =>
  prefix + actor + ':' + scope;
export function readPending(actor: string, scope: string): Pending | null {
  try {
    const raw = sessionStorage.getItem(storageKey(actor, scope));
    const value = raw ? (JSON.parse(raw) as Pending) : null;
    return value?.actor === actor &&
      value.scope === scope &&
      typeof value.requestKey === 'string' &&
      value.path.startsWith('printTemplates')
      ? value
      : null;
  } catch {
    return null;
  }
}
export function clearActor(actor: string) {
  for (let i = sessionStorage.length - 1; i >= 0; i--) {
    const key = sessionStorage.key(i);
    if (key?.startsWith(prefix + actor + ':')) sessionStorage.removeItem(key);
  }
}
export async function fileHash(file: File) {
  const bytes = await file.arrayBuffer();
  const hash = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(hash)]
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}
export class FileMismatch extends Error {}
export function useCommand(scope: string) {
  const api = useApiClient();
  const { session } = useAuthentication();
  const actor = session?.user.id ?? '';
  const [identity, setIdentity] = useState(actor + ':' + scope);
  const [pending, setPending] = useState<Pending | null>(() =>
    readPending(actor, scope),
  );
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const [error, setError] = useState<unknown>();
  const actorRef = useRef(actor);
  useEffect(() => {
    actorRef.current = actor;
  }, [actor]);
  const previousActorRef = useRef(actor);
  useEffect(() => {
    if (previousActorRef.current !== actor) {
      clearActor(previousActorRef.current);
      previousActorRef.current = actor;
    }
  }, [actor]);
  if (identity !== actor + ':' + scope) {
    setIdentity(actor + ':' + scope);
    setPending(readPending(actor, scope));
    setError(undefined);
  }
  async function execute<T>(
    input: Omit<Pending, 'actor' | 'scope' | 'requestKey'>,
    file?: File,
  ): Promise<T | undefined> {
    if (!actor || busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(undefined);
    try {
      const command = pending ?? {
        ...input,
        actor,
        scope,
        requestKey: createRequestKey(),
      };
      let body: FormData | undefined;
      if (command.file) {
        if (
          !file ||
          file.name !== command.file.name ||
          file.size !== command.file.size ||
          (await fileHash(file)) !== command.file.hash
        )
          throw new FileMismatch();
        body = new FormData();
        body.append('file', file);
        body.append('version', String(command.file.version));
        body.append('requestKey', command.requestKey);
      }
      if (actorRef.current !== actor) return;
      sessionStorage.setItem(storageKey(actor, scope), JSON.stringify(command));
      setPending(command);
      const result = await api.request<T>({
        path: command.path,
        method: command.method,
        ...(body
          ? { body }
          : { json: { ...command.json, requestKey: command.requestKey } }),
      });
      sessionStorage.removeItem(storageKey(actor, scope));
      if (actorRef.current === actor) setPending(null);
      return actorRef.current === actor ? result : undefined;
    } catch (e) {
      if (actorRef.current === actor) setError(e);
      if (e instanceof ApiClientError && e.status < 500) {
        sessionStorage.removeItem(storageKey(actor, scope));
        setPending(null);
        if ([401, 403].includes(e.status)) clearActor(actor);
      }
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  return {
    actor,
    pending: pending?.actor === actor ? pending : null,
    busy,
    busyRef,
    error,
    execute,
    abandon: () => {
      if (busyRef.current) return;
      sessionStorage.removeItem(storageKey(actor, scope));
      setPending(null);
      setError(undefined);
    },
  };
}
