import { currentDemo } from '../../../../server/providers/demo-data/context.js';
import type { Application } from '@nocobase/app-server/application';
import type { TrialRole } from './accounts.js';
import { trialEmail } from './accounts.js';

export interface TrialSession {
  userId: string;
  request(
    path: string,
    body?: unknown,
    method?: string,
  ): Promise<Record<string, unknown>>;
  upload(
    path: string,
    file: File,
    headers?: Record<string, string>,
    fields?: Record<string, string>,
  ): Promise<Record<string, unknown>>;
}

export async function trialSession(
  app: Application,
  role: TrialRole,
  password: string,
): Promise<TrialSession> {
  const origin =
    app.config.get<string>('app.publicOrigin') ?? 'http://localhost';
  // Application.fetch is the internal handler; the standalone host strips publicBasePath before dispatch.
  const api = `${origin}/api`;
  const scope = currentDemo();
  let cookie = '';
  let userId: string;
  const serviceKey = role === 'system' ? scope?.systemKey : undefined;
  if (serviceKey) userId = scope!.identities!.system;
  else {
    const login = await app.fetch(
      new Request(`${api}/auth/sign-in/email`, {
        method: 'POST',
        headers: { 'content-type': 'application/json', origin },
        body: JSON.stringify({ email: trialEmail(role), password }),
      }),
    );
    if (!login.ok)
      throw new Error(`Trial sign-in ${role} failed (${login.status}).`);
    const data = (await login.json()) as { user: { id: string } };
    cookie = login.headers
      .getSetCookie()
      .map((value) => value.split(';')[0])
      .join('; ');
    userId = data.user.id;
  }
  const call = async (
    path: string,
    body?: unknown,
    multipart?: FormData,
    method?: string,
    extraHeaders?: Record<string, string>,
  ): Promise<Record<string, unknown>> => {
    if (scope?.now && (body !== undefined || multipart))
      scope.now = new Date(scope.now.getTime() + 60000);
    const headers = new Headers({ ...extraHeaders, cookie, origin });
    if (serviceKey) headers.set('x-api-key', serviceKey);
    if (body !== undefined) headers.set('content-type', 'application/json');
    const response = await app.fetch(
      new Request(`${api}${path}`, {
        method: method ?? (body !== undefined || multipart ? 'POST' : 'GET'),
        headers,
        body:
          multipart ?? (body === undefined ? undefined : JSON.stringify(body)),
      }),
    );
    const answer = (await response.json()) as Record<string, unknown>;
    if (!response.ok) {
      const error = answer.error as
        { reason?: string; code?: string; message?: string } | undefined;
      // Never echo request bodies, passwords, cookie values or private field responses.
      throw new Error(
        `${role} ${path}: HTTP ${response.status} ${error?.reason ?? error?.code ?? error?.message ?? 'request failed'}`,
      );
    }
    return answer;
  };
  return {
    userId,
    request: (path, body, method) => call(path, body, undefined, method),
    upload: (path, file, headers, fields) => {
      const form = new FormData();
      form.set('file', file);
      for (const [key, value] of Object.entries(fields ?? {}))
        form.set(key, value);
      return call(path, undefined, form, undefined, headers);
    },
  };
}

export function recordOf(
  value: Record<string, unknown>,
): Record<string, unknown> {
  const data = (value.data ?? value) as Record<string, unknown>;
  return (data.record ?? data) as Record<string, unknown>;
}

export const dataOf = (
  value: Record<string, unknown>,
): Record<string, unknown> => (value.data ?? value) as Record<string, unknown>;
