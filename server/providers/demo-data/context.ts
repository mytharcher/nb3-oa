import { auditActorContext } from '../audit/permission-sets.js';
import { AsyncLocalStorage } from 'node:async_hooks';

/** Server-owned import context; never populated from an HTTP header or body. */
export interface DemoContext {
  id: string;
  locale: 'zh-CN' | 'en-US';
  baseDate: string;
  now?: Date;
  users: Set<string>;
  removing?: boolean;
  retired?: boolean;
  operationToken?: string;
  systemKey?: string;
  identities?: Record<string, string>;
}
export const demoContext = new AsyncLocalStorage<DemoContext>();
export const demoRequestActor = new AsyncLocalStorage<() => string | null>();
export const demoContexts = new Map<string, DemoContext>();
export function currentDemo(): DemoContext | undefined {
  return (
    demoContext.getStore() ??
    demoContexts.get(
      (demoRequestActor.getStore() ?? auditActorContext.getStore())?.() ?? '',
    )
  );
}
export const demoNow = (): Date => new Date(currentDemo()?.now ?? Date.now());
export const demoPrefix = (): string => currentDemo()?.id ?? 'oa-trial-v1';
export const demoUsername = (key: string): string =>
  currentDemo()
    ? `demo.${demoPrefix().slice(-8)}.${key.toLowerCase()}`
    : `trial.${key.toLowerCase()}`;
export const demoEmail = (key: string): string =>
  currentDemo()
    ? `${key.toLowerCase()}.${demoPrefix().slice(-8)}@example.test`
    : `${key.toLowerCase()}@oa-trial.example.test`;

// A directory snapshot is built before the lifecycle reads its record. Resolve its
// partition lazily from that record on the same transaction, including background
// jobs and a real administrator inspecting a demo process.
const recordPartitions = new WeakMap<object, DemoContext | null>();
export function demoRecordPartition(
  handle: unknown,
  record: Record<string, unknown> | undefined,
): void {
  if (!handle || typeof handle !== 'object' || !record) return;
  const applicant = record.applicantId ?? record.createdById;
  if (typeof applicant === 'string')
    recordPartitions.set(
      handle,
      demoContexts.get(applicant) ??
        (currentDemo()?.users.has(applicant) ? currentDemo() : null) ??
        null,
    );
}
export function demoPartition(handle?: object): DemoContext | undefined {
  return handle && recordPartitions.has(handle)
    ? (recordPartitions.get(handle) ?? undefined)
    : currentDemo();
}
export function inDemoPartition(userId: string, handle?: object): boolean {
  const scope = demoPartition(handle);
  const owner =
    demoContexts.get(userId) ??
    (currentDemo()?.users.has(userId) ? currentDemo() : undefined);
  return owner?.id === scope?.id;
}

/** Interactive demo sessions use real time and never inherit an import lease. */
export function registerDemoUser(userId: string, scope: DemoContext): void {
  const interactive = { ...scope };
  delete interactive.now;
  delete interactive.operationToken;
  demoContexts.set(userId, interactive);
}
