// @vitest-environment node
import { it, expect, vi } from 'vitest';
import { WecomAttendanceClient } from '../../../server/providers/wecom-attendance/client.js';
it('refreshes an expired token once and preserves real late timestamps while rejecting unknown or missing evidence', async () => {
  const transport = vi.fn<typeof fetch>();
  const json = (value: unknown) =>
    new Response(JSON.stringify(value), {
      headers: { 'content-type': 'application/json' },
    });
  transport
    .mockResolvedValueOnce(json({ access_token: 'first', expires_in: 7200 }))
    .mockResolvedValueOnce(json({ errcode: 42001 }))
    .mockResolvedValueOnce(json({ access_token: 'second', expires_in: 7200 }))
    .mockResolvedValueOnce(
      json({
        errcode: 0,
        checkindata: [
          {
            userid: 'mapped',
            checkin_type: '上班打卡',
            checkin_time: 150,
            exception_type: '迟到',
          },
        ],
      }),
    );
  const client = new WecomAttendanceClient(
    { corpId: 'synthetic', secret: 'synthetic' },
    transport,
  );
  expect(await client.read(['mapped'], 100, 200)).toMatchObject([
    { checkin_time: 150, exception_type: '迟到' },
  ]);
  expect(transport).toHaveBeenCalledTimes(4);
  transport.mockResolvedValueOnce(
    json({
      errcode: 0,
      checkindata: [
        { userid: 'foreign', checkin_type: '上班打卡', checkin_time: 150 },
      ],
    }),
  );
  await expect(client.read(['mapped'], 100, 200)).rejects.toMatchObject({
    code: 'WECOM_INVALID_EVIDENCE',
  });
  transport.mockResolvedValueOnce(
    json({
      errcode: 0,
      checkindata: [
        {
          userid: 'mapped',
          checkin_type: '下班打卡',
          checkin_time: 150,
          exception_type: '未打卡',
        },
      ],
    }),
  );
  await expect(client.read(['mapped'], 100, 200)).rejects.toMatchObject({
    code: 'WECOM_INVALID_EVIDENCE',
  });
});
it('bounds transient retries and never follows a credential-bearing redirect', async () => {
  const transport = vi
    .fn<typeof fetch>()
    .mockResolvedValue(new Response('', { status: 503 }));
  await expect(
    new WecomAttendanceClient(
      { corpId: 'synthetic', secret: 'synthetic' },
      transport,
    ).read(['mapped'], 100, 200),
  ).rejects.toMatchObject({ code: 'WECOM_UNAVAILABLE' });
  expect(transport).toHaveBeenCalledTimes(3);
  expect(transport.mock.calls[0][1]).toMatchObject({ redirect: 'error' });
});
