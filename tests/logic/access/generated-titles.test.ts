import {
  fromSet,
  toInput,
} from '../../../client/pages/administration/authorization/pages/permission-sets/drafts.js';
import { expect, it } from 'vitest';
import { createTestI18nRuntime } from '@nocobase/i18n/testing';
import {
  roleGrantTitle,
  parseRoleGrantTitle,
  renderAccessTitle,
} from '../../../shared/access-titles.js';
import enUS from '../../../client/locales/modules/access.en-US.js';
import zhCN from '../../../client/locales/modules/access.zh-CN.js';
import { parseAuthorizationTitle } from '@nocobase/authorization/core';
import { localizeRoleScopes } from '../../../client/pages/administration/users/role-scopes.js';

it('preserves the platform descriptor and translates dynamic titles and copy ordinals on language switches', async () => {
  const runtime = await createTestI18nRuntime({
    application: { namespace: 'nb3-oa', resources: enUS },
  });
  const chinese = await createTestI18nRuntime({
    locale: 'zh-CN',
    application: { namespace: 'nb3-oa', resources: zhCN },
  });
  const payload = {
    module: { key: 'access.permissions', ns: 'nb3-oa' },
    role: { key: 'access.baseline', ns: 'nb3-oa' },
    number: 1,
  };
  const title = roleGrantTitle(payload);
  expect(parseAuthorizationTitle(JSON.parse(JSON.stringify(title)))).toEqual(
    title,
  );
  expect(parseRoleGrantTitle(title)).toEqual(payload);
  const set = { key: 'generated-test', title, grants: [] };
  expect(
    toInput(fromSet(set, (key, options) => runtime.i18n.t(key, options))).title,
  ).toEqual(title);
  expect(
    toInput(fromSet(set, (key, options) => chinese.i18n.t(key, options))).title,
  ).toEqual(title);
  const text = () =>
    renderAccessTitle(title, (key, options) => runtime.i18n.t(key, options));
  expect(text()).toBe(
    'Business permissions (Signed-in baseline access · independent grant 1)',
  );
  expect(
    renderAccessTitle(
      roleGrantTitle({ ...payload, number: 2 }),
      (key, options) => runtime.i18n.t(key, options),
    ),
  ).not.toBe(text());
  const chineseText = () =>
    renderAccessTitle(title, (key, options) => chinese.i18n.t(key, options));
  expect(chineseText()).toBe('业务权限（登录人员基础权限 · 独立授权 1）');
  const scopes = localizeRoleScopes(
    [
      {
        key: 'app',
        label: 'App',
        selection: 'multiple',
        options: [
          {
            value: 'set',
            label: 'fallback',
            labelI18nKey: title.key,
            labelI18nNs: title.ns,
          },
        ],
      },
    ],
    (key, ns, defaultValue, values) =>
      chinese.i18n.t(key, { ...values, ns, defaultValue }),
  );
  expect(scopes[0].options[0].label).toBe(chineseText());
});

it('keeps long literal names within the existing 255-character title storage without corrupting translation references', () => {
  const payload = {
    module: { key: 'access.permissions', ns: 'nb3-oa' },
    role: '长角色名称'.repeat(80),
    number: 1,
  };
  const title = roleGrantTitle(payload);
  const later = roleGrantTitle({ ...payload, number: 10 });
  expect(JSON.stringify(title).length).toBeLessThanOrEqual(255);
  expect(JSON.stringify(later).length).toBeLessThanOrEqual(255);
  expect(parseRoleGrantTitle(title)?.role).toBe(
    parseRoleGrantTitle(later)?.role,
  );
  expect(parseRoleGrantTitle(title)?.module).toEqual(payload.module);
});
