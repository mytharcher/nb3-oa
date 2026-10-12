// @vitest-environment node
import { afterEach, expect, it, vi } from 'vitest';
import { createRequestKey } from '../../client/lib/request-key.js';
import { createRequestId } from '../../client/pages/approvals/request-id.js';

afterEach(() => vi.unstubAllGlobals());

it('generates UUID v4 keys without randomUUID on HTTP origins', () => {
  vi.stubGlobal('crypto', {
    getRandomValues: crypto.getRandomValues.bind(crypto),
  });
  const keys = Array.from({ length: 100 }, () => createRequestKey());
  expect(new Set(keys).size).toBe(keys.length);
  for (const key of [...keys, createRequestId()])
    expect(key).toMatch(
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
});

it('never invokes randomUUID even when the browser provides it', () => {
  const randomUUID = vi.fn(() => {
    throw new Error('Forbidden browser API');
  });
  vi.stubGlobal('crypto', {
    getRandomValues: crypto.getRandomValues.bind(crypto),
    randomUUID,
  });
  createRequestKey();
  createRequestId();
  expect(randomUUID).not.toHaveBeenCalled();
});
