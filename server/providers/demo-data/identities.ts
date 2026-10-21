import type { UserAdministrationService } from '@nocobase/app-plugin-authentication';
import type { DatabaseConnection, DatabaseManager } from '@nocobase/db';
import { currentDemo } from './context.js';
import { rememberUser } from './ownership.js';

/** Observe the public identity API instead of changing onboarding or writing plugin tables.
 * Newly created demo identities and their ownership always share the caller's transaction. */
export function installDemoIdentityTracking(
  api: UserAdministrationService,
  db: DatabaseManager,
): () => void {
  const original = {
    withConnection: api.withConnection.bind(api),
    create: api.create.bind(api),
    createServiceAccount: api.createServiceAccount.bind(api),
  };
  function bound(tx: DatabaseConnection): UserAdministrationService {
    const target = original.withConnection(tx);
    return new Proxy(target, {
      get(object, key) {
        if (key === 'withConnection') return bound;
        if (key === 'create')
          return async (
            input: Parameters<UserAdministrationService['create']>[0],
          ) => {
            const user = await object.create(input);
            if (currentDemo()) await rememberUser(tx, user.id);
            return user;
          };
        if (key === 'createServiceAccount')
          return async (
            input: Parameters<
              UserAdministrationService['createServiceAccount']
            >[0],
          ) => {
            const user = await object.createServiceAccount(input);
            if (currentDemo()) await rememberUser(tx, user.id);
            return user;
          };
        const value = Reflect.get(object, key) as unknown;
        return typeof value === 'function'
          ? (...args: unknown[]) =>
              Reflect.apply(value, object, args) as unknown
          : value;
      },
    });
  }
  api.withConnection = bound;
  api.create = (input) =>
    currentDemo()
      ? db.transaction((tx) => bound(tx).create(input))
      : original.create(input);
  api.createServiceAccount = (input) =>
    currentDemo()
      ? db.transaction((tx) => bound(tx).createServiceAccount(input))
      : original.createServiceAccount(input);
  return () => {
    Object.assign(api, original);
  };
}
