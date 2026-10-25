import { operationPolicyKey } from '../../../shared/access-grants.js';
import { parseRoleGrantTitle } from '../../../shared/access-titles.js';
import type {
  AppAuthorization,
  PermissionSetsApi,
} from '@nocobase/app-plugin-authorization/server';
import type {
  AuthorizationSubject,
  AuthorizationContext,
} from '@nocobase/authorization/core';
import type { DatabaseConnection } from '@nocobase/db';
import type { z } from 'zod';
import {
  applyChanges,
  fail,
  revision,
  snapshot,
  subjectSnapshot,
} from './model.js';
import type { SubjectGrants } from './schemas.js';

export const roleTypes = new Set([
  'user',
  'authenticated',
  'org.dutyRole',
  'org.departmentHead',
  'org.reportingManager',
  'org.position',
  'org.department',
]);

/** Resolve outside the write transaction; the locked snapshot revision binds this impact to the write. */
export async function validateSubjects(
  authz: AppAuthorization,
  subjects: readonly AuthorizationSubject[],
  context: { authz: AuthorizationContext },
) {
  for (const type of new Set(subjects.map((subject) => subject.type))) {
    const ids = [
      ...new Set(
        subjects
          .filter((subject) => subject.type === type)
          .map((subject) => subject.id),
      ),
    ];
    const administration = authz.subjects.get(type)?.administration;
    if (!administration) fail('IMPACT_UNAVAILABLE', 'FAILED_PRECONDITION');
    if (administration.selection.type === 'fixed') {
      const fixedId = administration.selection.id;
      if (ids.some((id) => id !== fixedId))
        fail('IMPACT_UNAVAILABLE', 'FAILED_PRECONDITION');
    } else {
      for (let offset = 0; offset < ids.length; offset += 100) {
        const batch = ids.slice(offset, offset + 100);
        const resolved = await administration.selection.resolve(batch, context);
        if (batch.some((id) => !resolved.some((entry) => entry.id === id)))
          fail('IMPACT_UNAVAILABLE', 'FAILED_PRECONDITION');
      }
    }
  }
}

type Snapshot = Awaited<ReturnType<typeof snapshot>>;
type Input = z.infer<typeof SubjectGrants>;
type Change = Input['changes'][number];
type Definition = Snapshot['sets'][number];

function covers(set: Definition, change: Change) {
  return set.grants.filter(
    (grant) =>
      grant.resource.type === change.resource.type &&
      [change.resource.id, '*'].includes(grant.resource.id),
  );
}
function writable(set: Definition, subject: AuthorizationSubject) {
  return (
    (!set.protection || set.protection.allow.includes('update')) &&
    (!set.protection?.assignableTo ||
      set.protection.assignableTo.includes(subject.type))
  );
}

/** Route each operation, never infer an ambiguous destination for a newly enabled operation. */
export function planSubjectGrants(
  authz: AppAuthorization,
  current: Snapshot,
  subject: AuthorizationSubject,
  input: Input,
) {
  const own = current.sets.filter((set) =>
    current.assignments.some(
      (entry) =>
        entry.permissionSet === set.key &&
        entry.subject.type === subject.type &&
        entry.subject.id === subject.id,
    ),
  );
  const groups = new Map<string, { source?: Definition; changes: Change[] }>();
  const seen = new Set<string>();
  for (const change of input.changes) {
    const identity = JSON.stringify([
      change.resource.type,
      change.resource.id,
      change.action,
    ]);
    if (seen.has(identity)) fail('DUPLICATE_CHANGE');
    seen.add(identity);
    const modules = own.filter((set) => covers(set, change).length > 0);
    const sources = modules.filter((set) =>
      covers(set, change).some((grant) =>
        grant.actions.some((entry) => entry.action === change.action),
      ),
    );
    const entries = sources.flatMap((set) =>
      covers(set, change).flatMap((grant) =>
        grant.actions.filter((entry) => entry.action === change.action),
      ),
    );
    if (
      new Set(
        entries.map((entry) =>
          operationPolicyKey(change.resource.type, entry.policy),
        ),
      ).size > 1
    )
      fail('MULTIPLE_SOURCES', 'FAILED_PRECONDITION');
    if (
      sources.some((set) =>
        covers(set, change).some(
          (grant) =>
            grant.resource.id === '*' &&
            grant.actions.some((entry) => entry.action === change.action),
        ),
      )
    )
      fail('CUSTOM_POLICY_READ_ONLY');
    let targets: (Definition | undefined)[] = sources;
    if (sources.length) {
      if (change.permissionSet !== undefined) fail('INVALID_TARGET');
    } else {
      if (change.value === null) {
        if (change.permissionSet) fail('INVALID_TARGET');
        continue;
      }
      const candidates = modules.filter((set) => writable(set, subject));
      if (change.permissionSet !== undefined) {
        const target = candidates.find(
          (set) => set.key === change.permissionSet,
        );
        if (!target) fail('INVALID_TARGET');
        targets = [target];
      } else {
        if (candidates.length > 1)
          fail('TARGET_REQUIRED', 'FAILED_PRECONDITION');
        targets = [candidates[0]];
      }
    }
    for (const source of targets) {
      const key = source
        ? `set:${source.key}`
        : `new:${JSON.stringify(change.resource)}`;
      const group = groups.get(key) ?? { source, changes: [] };
      group.changes.push(change);
      groups.set(key, group);
    }
  }
  return [...groups.values()].map(({ source, changes }) => {
    // Equivalent duplicate entries in one set collapse only for operations explicitly edited.
    const touched = new Set(
      changes.map((change) =>
        JSON.stringify([
          change.resource.type,
          change.resource.id,
          change.action,
        ]),
      ),
    );
    const included = new Set<string>();
    const existing = (source?.grants ?? [])
      .map((grant) => ({
        ...grant,
        actions: grant.actions.filter((entry) => {
          const key = JSON.stringify([
            grant.resource.type,
            grant.resource.id,
            entry.action,
          ]);
          if (!touched.has(key)) return true;
          if (included.has(key)) return false;
          included.add(key);
          return true;
        }),
      }))
      .filter((grant) => grant.actions.length);
    const grants = applyChanges(
      authz,
      existing,
      changes.map((change) => ({
        resource: change.resource,
        action: change.action,
        enabled: change.value !== null,
        scopes: change.value?.scopes,
      })),
    );
    const shared = Boolean(
      source &&
      current.assignments.some(
        (entry) =>
          entry.permissionSet === source.key &&
          (entry.subject.type !== subject.type ||
            entry.subject.id !== subject.id),
      ),
    );
    return {
      source,
      changes,
      grants,
      shared,
      copy: !source || (shared && input.sharedSets === 'split'),
    };
  });
}

export async function saveSubjectGrants(
  authz: AppAuthorization,
  sets: PermissionSetsApi<DatabaseConnection>,
  subject: AuthorizationSubject,
  input: Input,
  options: {
    authorize: (action: 'create' | 'delete') => Promise<void>;
    titleFor: (
      resource: { type: string; id: string },
      number: number,
    ) => import('@nocobase/authorization/core').AuthorizationTitle;
  },
) {
  const current =
    input.revisionScope === 'subject'
      ? await subjectSnapshot(sets, subject)
      : await snapshot(sets);
  if (current.revision !== input.expectedRevision)
    fail('VERSION_CONFLICT', 'ABORTED');
  const plans = planSubjectGrants(authz, current, subject, input);
  // Preflight every operation and every capability before creating, revoking or updating anything.
  for (const plan of plans)
    if (plan.source) {
      sets.assertWritable(plan.source.key, 'update');
      if (!writable(plan.source, subject)) fail('SUBJECT_NOT_ALLOWED');
      if (plan.copy) {
        sets.assertWritable(plan.source.key, 'revoke');
        if (plan.source.protection) fail('PROTECTED_PERMISSION_SET');
      } else if (!plan.grants.length && !plan.shared) {
        sets.assertWritable(plan.source.key, 'revoke');
        sets.assertWritable(plan.source.key, 'delete');
      }
    }
  if (plans.some((plan) => plan.copy && plan.grants.length))
    await options.authorize('create');
  if (
    plans.some(
      (plan) =>
        plan.source && !plan.copy && !plan.shared && !plan.grants.length,
    )
  )
    await options.authorize('delete');
  const titleDefinitions = plans.some((plan) => plan.copy && plan.grants.length)
    ? await sets.list()
    : current.sets;
  const numbering = new Map<string, number>();
  for (const { source, changes, grants, shared, copy } of plans) {
    if (copy) {
      if (grants.length) {
        const module = changes[0].resource.id
          .replace(/^oa\./, '')
          .replace(/[^a-zA-Z0-9-]/g, '-')
          .slice(0, 80);
        const baseKey = `oa-${module}-${subject.type.replace(/[^a-zA-Z0-9-]/g, '-')}-${revision([subject, changes[0].resource, source?.key]).slice(0, 16)}`;
        let key = baseKey;
        for (let suffix = 1; await sets.get(key); suffix += 1) {
          if (suffix > 1000) fail('KEY_CONFLICT', 'ABORTED');
          key = `${baseKey}-${suffix}`;
        }
        const resource = changes[0].resource;
        const prototype = parseRoleGrantTitle(options.titleFor(resource, 1));
        const titleKey = revision(
          prototype ? [prototype.module, prototype.role] : resource,
        );
        const number =
          (numbering.get(titleKey) ??
            Math.max(
              0,
              ...titleDefinitions.flatMap((set) => {
                const title = parseRoleGrantTitle(set.title);
                return title &&
                  revision([title.module, title.role]) === titleKey
                  ? [title.number]
                  : [];
              }),
            )) + 1;
        numbering.set(titleKey, number);
        sets.assertWritable(key, 'create');
        sets.assertWritable(key, 'assign');
        await sets.create({
          key,
          title: options.titleFor(resource, number),
          grants,
        });
        await sets.assign({ permissionSet: key, subject });
      }
      if (source)
        for (const assignment of current.assignments.filter(
          (entry) =>
            entry.permissionSet === source.key &&
            entry.subject.type === subject.type &&
            entry.subject.id === subject.id,
        ))
          await sets.revoke(assignment.id);
    } else if (source) {
      if (!grants.length && !shared) {
        for (const assignment of current.assignments.filter(
          (entry) =>
            entry.permissionSet === source.key &&
            entry.subject.type === subject.type &&
            entry.subject.id === subject.id,
        ))
          await sets.revoke(assignment.id);
        await sets.delete(source.key);
      } else
        await sets.update(source.key, {
          key: source.key,
          title: source.title,
          grants,
        });
    }
  }
  return input.revisionScope === 'subject'
    ? subjectSnapshot(sets, subject)
    : snapshot(sets);
}
