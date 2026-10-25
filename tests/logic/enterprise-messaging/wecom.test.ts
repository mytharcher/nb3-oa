import { afterEach, expect, it, vi } from 'vitest';
import type {
  ChannelContext,
  ChannelSendInput,
} from '@nocobase/app-plugin-notification/server';
import { WecomAppChannel } from '../../../server/providers/enterprise-messaging/wecom.js';
const config = {
  type: 'oa-wecom-app' as const,
  corpId: 'synthetic',
  corpSecret: 'test-only',
  agentId: 1,
};
const channel = () => new WecomAppChannel({} as ChannelContext, config);
const input = {
  message: {
    userId: 'employee-1',
    text: 'Open https://oa.example/main/taskCenter',
  },
  signal: new AbortController().signal,
} as ChannelSendInput<{ userId: string; text: string }>;
const token = () =>
  Response.json({
    errcode: 0,
    access_token: 'synthetic-token',
    expires_in: 7200,
  });
afterEach(() => vi.unstubAllGlobals());
it('rejects broadcasts, multiple recipients and oversized UTF-8 messages', () => {
  for (const to of ['@all', 'one|two', ''])
    expect(() => channel().validateMessage({ to, text: 'message' })).toThrow();
  expect(() =>
    channel().validateMessage({ to: 'one', text: '字'.repeat(700) }),
  ).toThrow();
  expect(
    channel().validateMessage({ to: 'one', text: 'message' }).recipients,
  ).toEqual([{ userId: 'one' }]);
});
it('sends one recipient and caches the application token without claiming transport idempotency', async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(token())
    .mockResolvedValue(Response.json({ errcode: 0 }));
  vi.stubGlobal('fetch', fetch);
  const instance = channel();
  expect(await instance.send(input)).toEqual({ status: 'accepted' });
  fetch.mockResolvedValue(Response.json({ errcode: 0 }));
  expect(await instance.send(input)).toEqual({ status: 'accepted' });
  expect(fetch).toHaveBeenCalledTimes(3);
  const body = JSON.parse(fetch.mock.calls[1][1].body);
  expect(body).toMatchObject({
    touser: 'employee-1',
    msgtype: 'text',
    agentid: 1,
    safe: 1,
  });
  expect(body).not.toHaveProperty('toparty');
});
it('does not claim delivery when the single recipient is invalid or unlicensed', async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(token())
    .mockResolvedValueOnce(
      Response.json({ errcode: 0, invaliduser: 'employee-1' }),
    );
  vi.stubGlobal('fetch', fetch);
  expect(await channel().send(input)).toMatchObject({
    status: 'failed',
    disposition: 'never',
  });
});
it('classifies token failure as not submitted and send timeout as unknown without exposing secrets', async () => {
  const fetch = vi.fn().mockRejectedValue(new Error('secret-url'));
  vi.stubGlobal('fetch', fetch);
  expect(await channel().send(input)).toMatchObject({
    status: 'failed',
    disposition: 'same_provider',
  });
  fetch.mockResolvedValueOnce(token());
  const result = await channel().send(input);
  expect(result.status).toBe('submission_unknown');
  expect(JSON.stringify(result)).not.toContain('secret-url');
});
it('refreshes an expired access token on the plugin-owned retry', async () => {
  const fetch = vi
    .fn()
    .mockResolvedValueOnce(token())
    .mockResolvedValueOnce(Response.json({ errcode: 42001 }))
    .mockResolvedValueOnce(token())
    .mockResolvedValueOnce(Response.json({ errcode: 0 }));
  vi.stubGlobal('fetch', fetch);
  const instance = channel();
  expect(await instance.send(input)).toMatchObject({
    status: 'failed',
    disposition: 'same_provider',
  });
  expect(await instance.send(input)).toEqual({ status: 'accepted' });
  expect(fetch).toHaveBeenCalledTimes(4);
});
