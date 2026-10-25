import { useCallback, useMemo } from 'react';
import { useTranslation } from '@nocobase/i18n/client';
import { useAuthorizationClient } from '../administration/authorization/use-authorization-client.js';
import { titleText } from '../administration/authorization/i18n.js';
import { useLoad } from './hooks.js';
import type { ManagedUser } from '../administration/users/user-client.js';

/** Resolve only the visible users; batch name resolution across their identities. No permission snapshots. */
export function useUserAffiliations(
  users: readonly Pick<ManagedUser, 'id'>[],
  enabled: boolean,
) {
  const client = useAuthorizationClient();
  const { t } = useTranslation();
  const ids = JSON.stringify(users.map((user) => user.id));
  const stableIds = useMemo(() => JSON.parse(ids) as string[], [ids]);
  return useLoad(
    useCallback(async () => {
      if (!enabled || !stableIds.length) return {};
      const entries = await Promise.all(
        stableIds.map(async (id) => ({
          id,
          config: await client.inspectConfigured({ type: 'user', id }),
        })),
      );
      const subjects = [
        ...new Map(
          entries
            .flatMap((entry) => entry.config.identity?.subjects ?? [])
            .filter((subject) =>
              ['org.dutyRole', 'org.department', 'org.position'].includes(
                subject.type,
              ),
            )
            .map((subject) => [`${subject.type}:${subject.id}`, subject]),
        ).values(),
      ];
      const names = new Map<string, string>();
      for (const type of new Set(subjects.map((subject) => subject.type))) {
        const ids = subjects
          .filter((subject) => subject.type === type)
          .map((subject) => subject.id);
        for (let offset = 0; offset < ids.length; offset += 100) {
          const resolved = await client.resolveSubjects(
            'inspector',
            type,
            ids.slice(offset, offset + 100),
          );
          for (const entry of resolved)
            names.set(`${type}:${entry.id}`, titleText(entry.title, t));
        }
      }
      return Object.fromEntries(
        entries.map(({ id, config }) => [
          id,
          {
            admin: config.unrestricted,
            roles: (config.identity?.subjects ?? [])
              .filter((subject) => subject.type === 'org.dutyRole')
              .map(
                (subject) =>
                  names.get(`${subject.type}:${subject.id}`) ??
                  t('access.inherited'),
              ),
            organization: (config.identity?.subjects ?? [])
              .filter((subject) =>
                ['org.department', 'org.position'].includes(subject.type),
              )
              .map(
                (subject) =>
                  names.get(`${subject.type}:${subject.id}`) ??
                  t('access.inherited'),
              ),
          },
        ]),
      );
    }, [client, stableIds, enabled, t]),
  );
}
