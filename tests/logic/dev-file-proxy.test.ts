// @vitest-environment node
import { expect, it } from 'vitest';
import { createApplicationDevProxy } from '../../vite.config.js';

it('forwards protected content mounts while preserving API and WebSocket mounts', () => {
  const proxy = createApplicationDevProxy(
    '/local.+/',
    'https://example.test/remote/',
  )!;
  for (const pathname of [
    '/local.+/uploads/announcements/document.txt',
    '/local.+/private/certificates/file.pdf',
    '/local.+/api/auth/get-session',
    '/local.+/ws',
  ]) {
    const option = Object.entries(proxy).find(([pattern]) =>
      new RegExp(pattern).test(pathname),
    )?.[1];
    expect(option).toBeDefined();
    expect(option?.target).toBe('https://example.test');
    expect(option?.rewrite?.(pathname)).toBe(
      '/remote' + pathname.slice('/local.+'.length),
    );
    expect(option?.cookiePathRewrite).toBe('/local.+/');
    expect(option?.cookieDomainRewrite).toBe('');
    expect(typeof option?.configure).toBe('function');
  }
  for (const pathname of [
    '/local.+/uploads-other/file',
    '/local.+/privateer/file',
    '/localXX/uploads/file',
    '/local.+/client/page',
  ])
    expect(
      Object.keys(proxy).some((pattern) => new RegExp(pattern).test(pathname)),
    ).toBe(false);
});

it('does not install a content proxy without an explicit application target', () => {
  expect(createApplicationDevProxy('/main', undefined)).toBeUndefined();
  const proxy = createApplicationDevProxy('', 'http://127.0.0.1:14000/')!;
  expect(
    Object.keys(proxy).some((pattern) =>
      new RegExp(pattern).test('/uploads/file.txt'),
    ),
  ).toBe(true);
});
