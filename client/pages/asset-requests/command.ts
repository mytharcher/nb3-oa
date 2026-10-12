import { useRef, useState } from 'react';
import { useApiClient } from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { createRequestId } from '../approvals/request-id.js';
import { statusOf } from './types.js';
export interface Command {
  method: 'POST' | 'PATCH';
  path: string;
  json: Record<string, unknown>;
  actor: string;
}
const prefix = 'oa:assetRequests:pending:';
export function readCommand(actor: string, scope: string): Command | null {
  try {
    const raw = sessionStorage.getItem(prefix + actor + ':' + scope);
    const value = raw ? (JSON.parse(raw) as Command) : null;
    return value?.actor === actor ? value : null;
  } catch {
    return null;
  }
}
export function clearCommands(actor: string) {
  for (let i = sessionStorage.length - 1; i >= 0; i--) {
    const key = sessionStorage.key(i);
    if (
      key &&
      (key.startsWith(prefix + actor + ':') ||
        key.startsWith('oa:assetRequests:upload:' + actor + ':') ||
        key === 'oa:assetRequests:draft:' + actor)
    )
      sessionStorage.removeItem(key);
  }
}
/** A failed network command is persisted in full: an old key can never be reused with edited values. */
export function useCommand(scope: string) {
  const api = useApiClient();
  const { session } = useAuthentication();
  const actor = session?.user.id ?? '';
  const [storedPending, setStoredPending] = useState<Command | null>(() =>
    readCommand(actor, scope),
  );
  const pending = storedPending?.actor === actor ? storedPending : null;
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<unknown>();
  const busyRef = useRef(false);
  const [identity, setIdentity] = useState(actor + ':' + scope);
  if (identity !== actor + ':' + scope) {
    setIdentity(actor + ':' + scope);
    setStoredPending(readCommand(actor, scope));
    setError(undefined);
  }
  async function execute<T>(
    input?: Omit<Command, 'actor'>,
  ): Promise<T | undefined> {
    if (busyRef.current || !actor) return;
    const command =
      pending ??
      (input
        ? {
            ...input,
            actor,
            json: {
              ...input.json,
              requestId: input.json.requestId ?? createRequestId(),
            },
          }
        : undefined);
    if (!command || command.actor !== actor) return;
    busyRef.current = true;
    setBusy(true);
    setError(undefined);
    setStoredPending(command);
    sessionStorage.setItem(
      prefix + actor + ':' + scope,
      JSON.stringify(command),
    );
    try {
      const result = await api.request<T>({
        method: command.method,
        path: command.path,
        json: command.json,
      });
      sessionStorage.removeItem(prefix + actor + ':' + scope);
      setStoredPending(null);
      return result;
    } catch (e) {
      setError(e);
      const status = statusOf(e);
      if (status && status < 500) {
        sessionStorage.removeItem(prefix + actor + ':' + scope);
        setStoredPending(null);
        if (status === 401 || status === 403) clearCommands(actor);
      }
      return undefined;
    } finally {
      busyRef.current = false;
      setBusy(false);
    }
  }
  return {
    execute,
    pending,
    busy,
    error,
    clearError: () => setError(undefined),
    actor,
  };
}
