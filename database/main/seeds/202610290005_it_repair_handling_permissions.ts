import { defineSeed } from '@nocobase/db';
import { encodeAuthorizationTitle } from '@nocobase/authorization/core';
/** New, explicitly assigned capabilities; existing permission assignments are never broadened. */
export default defineSeed({
  name: '202610290005_it_repair_handling_permissions',
  async run(context) {
    const { query } = context;
    const repository = context.repository.bind(context);
    for (const key of ['itRepair.acceptanceDays', 'itRepair.followUpDays'])
      if (!(await repository('approvalRules').exists({ filter: { key } })))
        await repository('approvalRules').createOne({
          values: {
            key,
            value: 2,
            effectiveFrom: new Date(0),
            createdAt: new Date(),
            updatedBy: null,
            note: null,
          },
        });
    const processKey = 'oa-process-manager-itRepair';
    if (
      !(await query
        .selectFrom('authorizationPermissionSets')
        .select('id')
        .where('key', '=', processKey)
        .executeTakeFirst())
    )
      await query
        .insertInto('authorizationPermissionSets')
        .values({
          id: processKey,
          key: processKey,
          title: encodeAuthorizationTitle({
            ns: 'nb3-oa',
            key: 'processManagement.kinds.itRepair',
          }),
          grants: JSON.stringify([
            {
              resource: { type: 'page', id: 'oa.processManagement' },
              actions: [{ action: 'access' }],
            },
            {
              resource: {
                type: 'composite',
                id: 'oa.processManagement.itRepair',
              },
              actions: [
                { action: 'definitionRead' },
                { action: 'historyRead' },
              ],
            },
          ]),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .execute();
    const roles = {
      employee: ['comment', 'supplement', 'cancel', 'accept', 'return', 'rate'],
      engineer: [
        'view',
        'claim',
        'release',
        'start',
        'comment',
        'internal',
        'wait',
        'resume',
        'resolve',
        'link',
      ],
      leader: [
        'view',
        'requestSupplement',
        'triage',
        'assign',
        'priority',
        'comment',
        'internal',
        'approvePause',
        'reviewCancel',
        'duplicate',
        'link',
      ],
      exception: ['view', 'manageClose'],
    };
    for (const [role, actions] of Object.entries(roles)) {
      const key = `oa-it-repairs-handling-${role}`;
      if (
        await query
          .selectFrom('authorizationPermissionSets')
          .select('id')
          .where('key', '=', key)
          .executeTakeFirst()
      )
        continue;
      await query
        .insertInto('authorizationPermissionSets')
        .values({
          id: key,
          key,
          title: encodeAuthorizationTitle({
            ns: 'nb3-oa',
            key: `itRepairs.roles.${role}`,
          }),
          grants: JSON.stringify([
            {
              resource: { type: 'composite', id: 'oa.itRepairs' },
              actions: actions.map((action) => ({
                action,
                policy: {
                  type: 'composite',
                  scopes: {
                    itRepairs:
                      role === 'employee'
                        ? 'oa.itRepairsOwned'
                        : 'oa.itRepairsVisible',
                  },
                },
              })),
            },
          ]),
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .execute();
    }
  },
});
