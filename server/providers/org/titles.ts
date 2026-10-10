import {
  parseAuthorizationTitle,
  type AuthorizationTitle,
} from '@nocobase/authorization/core';

import enUS from '../../locales/en-US.js';
import zhCN from '../../locales/zh-CN.js';
import { APP_NAMESPACE } from './constants.js';

/**
 * A stored title. A seeded row (a duty role) stores a JSON translation descriptor, the way permission-set titles are
 * stored; a row someone created or renamed stores its plain text.
 */
export function readTitle(raw: unknown): AuthorizationTitle {
  const text = typeof raw === 'string' ? raw : '';
  if (!text.startsWith('{')) return text;
  try {
    return parseAuthorizationTitle(JSON.parse(text)) ?? text;
  } catch {
    return text;
  }
}

function lookup(resource: unknown, key: string): string | undefined {
  let value: unknown = resource;
  for (const part of key.split('.')) {
    if (!value || typeof value !== 'object') return undefined;
    value = (value as Record<string, unknown>)[part];
  }
  return typeof value === 'string' ? value : undefined;
}

/**
 * Every text a title is shown as, so a search in either shipped language finds a seeded row. The first entry is the
 * English text, which also gives a stable sort order.
 */
export function titleTexts(title: AuthorizationTitle): readonly string[] {
  if (typeof title === 'string') return [title];
  if (title.ns !== APP_NAMESPACE) return [title.key];
  const texts = [lookup(enUS, title.key), lookup(zhCN, title.key)].filter(
    (text): text is string => text !== undefined,
  );
  return texts.length ? texts : [title.key];
}

/** The text a title sorts by. */
export function sortText(title: AuthorizationTitle): string {
  return titleTexts(title)[0] ?? '';
}

/** Whether a title matches a search literally (`%` and `_` mean themselves), in any shipped language. */
export function titleMatches(
  title: AuthorizationTitle,
  search: string | undefined,
): boolean {
  const needle = search?.trim().toLowerCase();
  if (!needle) return true;
  return titleTexts(title).some((text) => text.toLowerCase().includes(needle));
}
