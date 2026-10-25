import { expect, it } from 'vitest';
import { authReturnPath } from '../../../client/lib/auth-return-path.js';

it('keeps application deep links while refusing foreign, encoded or looping callbacks', () => {
  expect(authReturnPath('/approvals/mine/leave/123?tab=history')).toBe(
    '/approvals/mine/leave/123?tab=history',
  );
  for (const target of [
    null,
    'https://evil.example',
    '//evil.example',
    '/\\evil.example',
    '/%2fevil.example',
    '/%255cevil.example',
    '/%0aevil.example',
    '/login',
    '/api/auth/callback/id',
    '/one/../login',
    '/one/..//evil.example',
    '/LOGIN',
    '/%zz',
  ])
    expect(authReturnPath(target)).toBe('/');
  expect(authReturnPath('/one/../taskCenter')).toBe('/taskCenter');
});

it('keeps encoded query and hash values intact', () => {
  for (const target of [
    '/search?q=R%26D',
    '/search?q=a%23b#section',
    '/search?q=a%2Fb%25c',
    '/search?q=line%0Abreak',
    '/approvals/mine/leave/%E5%8D%95%E5%8F%B7?tab=history',
  ])
    expect(authReturnPath(target)).toBe(target);
  expect(authReturnPath('/%6cogin')).toBe('/');
  expect(authReturnPath('/%2e%2e/login')).toBe('/');
});
