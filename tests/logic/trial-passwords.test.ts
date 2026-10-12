// @vitest-environment node
import { expect, it } from 'vitest';
import { userAdministrationServiceToken } from '@nocobase/app-plugin-authentication';
import { databaseManagerToken } from '@nocobase/db';
import { startOrgTestApp } from './org/helpers.ts';
import {
  trialAccounts,
  trialEmail,
  trialUsername,
} from '../../cli/commands/lib/trial-data/accounts.ts';
import {
  defaultTrialPasswords,
  resetTrialPasswords,
} from '../../cli/commands/lib/trial-data/passwords.ts';
import { trialSession } from '../../cli/commands/lib/trial-data/http.ts';
it('resets only matching trial identities through public authentication, preserves disabled state and rejects old passwords', async () => {
  const fixture = await startOrgTestApp();
  try {
    const app = fixture.testApp.application,
      users = app.container.resolve(userAdministrationServiceToken);
    const old = 'Isolated-old-trial-2026!';
    const control = await users.create({
      name: 'Preserved test account',
      email: 'control@example.test',
      username: 'control_fixture',
      password: old,
    });
    for (const p of trialAccounts)
      await users.create({
        name: p.name,
        email: trialEmail(p.key),
        username: trialUsername(p.key),
        password: old,
      });
    const candidate = await users.create({
      name: '示例·待入职员工',
      email: trialEmail('newhire'),
      username: trialUsername('newhire'),
      password: old,
    });
    await users.disable(candidate.id);
    await trialSession(app, 'employee', old);
    const passwords = defaultTrialPasswords();
    await resetTrialPasswords(app, control.id, passwords);
    await expect(trialSession(app, 'employee', old)).rejects.toThrow('401');
    await trialSession(app, 'employee', passwords.employee);
    expect((await users.get(candidate.id))?.disabledAt).not.toBeNull();
    expect(
      await app.container
        .resolve(databaseManagerToken)
        .repository('auditLogs')
        .count({ filter: { action: 'trialUser.resetPassword' } }),
    ).toBe(28);
    expect(await users.get(control.id)).toMatchObject({
      name: 'Preserved test account',
    });
    // Collision validation occurs before any reset and rolls the transaction back.
    const employee = await app.container
      .resolve(databaseManagerToken)
      .repository('user')
      .findOne({ filter: { email: trialEmail('employee') } });
    await users.update(String(employee!.id), {
      name: 'Changed fixture identity',
    });
    await expect(
      resetTrialPasswords(app, control.id, passwords),
    ).rejects.toThrow('collision');
    await trialSession(app, 'gm', passwords.gm);
  } finally {
    await fixture.close();
  }
}, 120000);
