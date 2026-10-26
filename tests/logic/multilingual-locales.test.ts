// @vitest-environment node

import { I18nRuntime, resolveLocalesContribution } from '@nocobase/i18n';
import type { LocaleLoaders, LocaleLoader } from '@nocobase/i18n';
import { describe, expect, it } from 'vitest';

import clientLocales from '../../client/locales/index.js';
import serverLocales from '../../server/locales/index.js';
import clientPlugins from '../../client/plugins.js';
import serverPlugins from '../../server/plugins.js';

const supported = [
  'en-US',
  'es-ES',
  'fr-FR',
  'de-DE',
  'pt-BR',
  'ru-RU',
  'id-ID',
  'vi-VN',
  'zh-CN',
  'zh-TW',
  'ja-JP',
  'ko-KR',
];
const namespace = 'nb3-oa';

function entries(resource: unknown, prefix = ''): Record<string, string> {
  if (!resource || typeof resource !== 'object')
    throw new Error('Invalid locale resource');
  return Object.fromEntries(
    Object.entries(resource).flatMap(([key, value]) => {
      const name = (prefix ? `${prefix}.${key}` : key).replace(
        /_(?:zero|one|two|few|many|other)$/u,
        '',
      );
      return typeof value === 'string'
        ? [[name, value]]
        : Object.entries(entries(value, name));
    }),
  );
}

function placeholders(value: string): string[] {
  return [
    ...value.matchAll(
      /\{\{[^{}]+\}\}|(?<!\{)\{[a-zA-Z][\w.]*\}(?!\})|<\/?[a-zA-Z][\w]*>/gu,
    ),
  ]
    .map(([token]) => token)
    .sort();
}

async function loadResource(
  loader: LocaleLoader,
): Promise<Record<string, unknown>> {
  const loaded = await loader();
  return ('default' in loaded ? loaded.default : loaded) as Record<
    string,
    unknown
  >;
}

function violations(
  english: Record<string, string>,
  translated: Record<string, string>,
): string[] {
  return Object.entries(english).flatMap(([key, value]) => {
    const actual = translated[key];
    if (actual === undefined || (value.trim() && !actual.trim()))
      return [`${key}: empty or missing`];
    return JSON.stringify(placeholders(actual)) ===
      JSON.stringify(placeholders(value))
      ? []
      : [`${key}: interpolation changed`];
  });
}

describe('twelve application languages', () => {
  it('offers exactly the requested languages on both sides', () => {
    expect(Object.keys(clientLocales).sort()).toEqual([...supported].sort());
    expect(Object.keys(serverLocales).sort()).toEqual([...supported].sort());
  });

  for (const [side, loaders] of Object.entries({
    client: clientLocales,
    server: serverLocales,
  })) {
    it.each(supported)(
      `${side} %s contains every English key and preserves interpolation`,
      async (locale) => {
        const englishResource = await loadResource(loaders['en-US']);
        const translatedResource = await loadResource(loaders[locale]);
        const { overrides: englishOverrides = {}, ...englishCore } =
          englishResource;
        const { overrides: translatedOverrides = {}, ...translatedCore } =
          translatedResource;
        const english = entries(englishCore);
        const translated = entries(translatedCore);
        expect(Object.keys(translated).sort()).toEqual(
          Object.keys(english).sort(),
        );
        expect(violations(english, translated)).toEqual([]);
        // Extra namespaces can supply languages missing from installed plugins.
        expect(
          violations(entries(englishOverrides), entries(translatedOverrides)),
        ).toEqual([]);
      },
    );
  }

  for (const [side, plugins, appLoaders] of [
    ['client', clientPlugins.plugins, clientLocales],
    ['server', serverPlugins.plugins, serverLocales],
  ] as const) {
    it.each(supported)(
      `${side} plugins have complete %s resources without English fallback`,
      async (locale) => {
        const application = await loadResource(appLoaders[locale]);
        const overrides = application.overrides as
          Record<string, object> | undefined;
        for (const plugin of plugins) {
          if (!plugin.locales) continue;
          const contribution = await resolveLocalesContribution(plugin.locales);
          const loaders = (
            'default' in contribution ? contribution.default : contribution
          ) as LocaleLoaders;
          if (!loaders['en-US']) continue;
          const english = entries(await loadResource(loaders['en-US']));
          const native = loaders[locale]
            ? entries(await loadResource(loaders[locale]))
            : {};
          const overridden = entries(overrides?.[plugin.packageName] ?? {});
          expect({
            namespace: plugin.packageName,
            issues: violations(english, { ...native, ...overridden }),
          }).toEqual({ namespace: plugin.packageName, issues: [] });
        }
      },
    );
  }

  it.each(supported)(
    'loads %s through the real runtime and applies namespace overrides',
    async (locale) => {
      const runtime = new I18nRuntime({
        defaultLocale: 'en-US',
        locales: supported,
        applicationNamespace: namespace,
      });
      runtime.registerApplicationNamespace(namespace, clientLocales);
      runtime.registerNamespace('@nocobase/app-plugin-users', {
        'en-US': () =>
          Promise.resolve({ default: { nav: { users: 'fallback' } } }),
      });
      await runtime.init(locale);
      const resource = (await clientLocales[locale]()).default;
      expect(runtime.getLocale()).toBe(locale);
      for (const count of [0, 1, 2, 5, 21]) {
        const details = runtime.i18n.t('taskCenter.bulk.approveTitle', {
          ns: namespace,
          lng: locale,
          count,
          returnDetails: true,
        });
        expect({ locale: details.usedLng, count }).toEqual({ locale, count });
        expect(details.res).not.toBe('taskCenter.bulk.approveTitle');
      }
      expect(runtime.getFixedT(namespace, locale)('actions.save')).toBe(
        resource.actions.save,
      );
      expect(
        runtime.getFixedT('@nocobase/app-plugin-users', locale)('nav.users'),
      ).toBe(resource.overrides['@nocobase/app-plugin-users'].nav.users);
    },
  );
});
