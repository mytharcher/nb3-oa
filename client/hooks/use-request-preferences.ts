import { useApiClient } from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useEffect, useRef, useState } from 'react';
import {
  employeeRequestKeys,
  type EmployeeRequestKey,
  type RequestPreferences,
} from '../../shared/request-catalog.js';

export function useRequestPreferences(enabled = true) {
  const api = useApiClient();
  const { session } = useAuthentication();
  const userId = session?.user.id ?? '';
  const [reload, setReload] = useState(0);
  const [result, setResult] = useState<{
    userId: string;
    data?: RequestPreferences;
    error?: unknown;
  }>();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<unknown>();
  const identityRef = useRef(userId);
  useEffect(() => {
    identityRef.current = userId;
  }, [userId]);
  useEffect(() => {
    if (!userId || !enabled) return;
    const controller = new AbortController();
    const storageKey = `nb3-oa:request-favorites:${userId}`;
    const load = async () => {
      let legacy: EmployeeRequestKey[] | undefined;
      try {
        const stored: unknown = JSON.parse(
          localStorage.getItem(storageKey) ?? 'null',
        );
        if (Array.isArray(stored))
          legacy = [
            ...new Set(
              stored.filter(
                (key): key is EmployeeRequestKey =>
                  typeof key === 'string' &&
                  employeeRequestKeys.some((allowed) => allowed === key),
              ),
            ),
          ].slice(0, 6);
      } catch {
        /* Browser storage is optional; server preferences remain usable. */
      }
      const response = await api.request<{ data: RequestPreferences }>({
        path: legacy ? 'requestPreferences/migrate' : 'requestPreferences',
        method: legacy ? 'POST' : 'GET',
        ...(legacy ? { json: { favorites: legacy } } : {}),
        signal: controller.signal,
      });
      if (legacy) {
        try {
          localStorage.removeItem(storageKey);
        } catch {
          /* Migration is idempotent. */
        }
      }
      if (!controller.signal.aborted)
        setResult({ userId, data: response.data });
    };
    void load().catch((error: unknown) => {
      if (!controller.signal.aborted) setResult({ userId, error });
    });
    return () => controller.abort();
  }, [api, userId, reload, enabled]);
  const current = result?.userId === userId ? result : undefined;
  const save = async (favorites: EmployeeRequestKey[] | null) => {
    if (saving || !current?.data) return;
    setSaving(true);
    setSaveError(undefined);
    try {
      const { data } = await api.request<{ data: RequestPreferences }>({
        path: 'requestPreferences',
        method: 'PUT',
        json: { favorites },
      });
      if (identityRef.current === userId) setResult({ userId, data });
    } catch (error) {
      if (identityRef.current === userId) setSaveError(error);
    } finally {
      setSaving(false);
    }
  };
  const record = (key: EmployeeRequestKey) => {
    if (!current?.data) return;
    // Navigation is never held hostage by a non-essential preference write.
    void api
      .request<{ data: RequestPreferences }>({
        path: 'requestPreferences/recent',
        method: 'POST',
        json: { key },
      })
      .then(({ data }) => {
        if (identityRef.current === userId)
          setResult((previous) =>
            previous?.userId === userId
              ? {
                  ...previous,
                  data: {
                    favorites: previous.data
                      ? previous.data.favorites
                      : data.favorites,
                    recent: data.recent,
                  },
                }
              : previous,
          );
      })
      .catch(() => undefined);
  };
  return {
    data: current?.data,
    error: current?.error,
    saving,
    saveError,
    save,
    record,
    retry: () => setReload((value) => value + 1),
  };
}
