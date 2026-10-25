import { z } from 'zod';

export class WecomAttendanceError extends Error {
  constructor(public readonly code: string) {
    super(code);
  }
}
export const checkinSchema = z.object({
  userid: z.string().min(1),
  checkin_type: z.enum(['上班打卡', '下班打卡']),
  checkin_time: z.number().int().positive(),
  sch_checkin_time: z.number().int().nonnegative().optional(),
  exception_type: z.string().optional(),
  groupid: z.number().int().optional(),
  schedule_id: z.number().int().optional(),
  timeline_id: z.number().int().optional(),
});
export type WecomCheckin = z.infer<typeof checkinSchema>;
const envelope = z.object({ errcode: z.number().int().optional() });
const tokenSchema = envelope.extend({
  access_token: z.string().min(1),
  expires_in: z.number().positive(),
});
const recordsSchema = envelope.extend({ checkindata: z.array(checkinSchema) });
/** Fixed vendor origin; transport injection is only an internal testing seam. Never log URLs/tokens/raw payloads. */
export class WecomAttendanceClient {
  private token?: { value: string; until: number };
  constructor(
    private readonly config: { corpId: string; secret: string },
    private readonly transport: typeof fetch = fetch,
  ) {}
  private async request(path: string, body?: unknown): Promise<unknown> {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const response = await this.transport(
          `https://qyapi.weixin.qq.com/cgi-bin/${path}`,
          {
            method: body ? 'POST' : 'GET',
            ...(body
              ? {
                  headers: { 'content-type': 'application/json' },
                  body: JSON.stringify(body),
                }
              : {}),
            signal: AbortSignal.timeout(15000),
            redirect: 'error',
          },
        );
        if (response.status === 429 || response.status >= 500) {
          if (attempt < 2) {
            await new Promise((resolve) =>
              setTimeout(resolve, 200 * 2 ** attempt),
            );
            continue;
          }
          throw new WecomAttendanceError('WECOM_UNAVAILABLE');
        }
        if (!response.ok) throw new WecomAttendanceError('WECOM_HTTP_REJECTED');
        return await response.json();
      } catch (error) {
        if (error instanceof WecomAttendanceError) throw error;
        if (attempt === 2) throw new WecomAttendanceError('WECOM_UNAVAILABLE');
      }
    }
    throw new WecomAttendanceError('WECOM_UNAVAILABLE');
  }
  private async accessToken() {
    if (this.token && this.token.until > Date.now()) return this.token.value;
    const query = new URLSearchParams({
      corpid: this.config.corpId,
      corpsecret: this.config.secret,
    });
    const data = tokenSchema.safeParse(
      await this.request(`gettoken?${query.toString()}`),
    );
    if (
      !data.success ||
      (data.data.errcode !== undefined && data.data.errcode !== 0)
    )
      throw new WecomAttendanceError('WECOM_AUTH_REJECTED');
    this.token = {
      value: data.data.access_token,
      until: Date.now() + Math.max(0, data.data.expires_in - 60) * 1000,
    };
    return this.token.value;
  }
  async read(
    userids: string[],
    start: number,
    end: number,
  ): Promise<WecomCheckin[]> {
    if (
      !userids.length ||
      userids.length > 100 ||
      end <= start ||
      end - start > 90000
    )
      throw new WecomAttendanceError('WECOM_INVALID_WINDOW');
    for (let attempt = 0; attempt < 2; attempt++) {
      const token = await this.accessToken();
      const response = await this.request(
        `checkin/getcheckindata?access_token=${encodeURIComponent(token)}`,
        {
          opencheckindatatype: 1,
          starttime: start,
          endtime: end - 1,
          useridlist: userids,
        },
      );
      const info = envelope.safeParse(response);
      if (
        info.success &&
        [40014, 42001].includes(info.data.errcode ?? 0) &&
        attempt === 0
      ) {
        this.token = undefined;
        continue;
      }
      if (!info.success || info.data.errcode !== 0)
        throw new WecomAttendanceError('WECOM_API_REJECTED');
      const data = recordsSchema.safeParse(response);
      if (
        !data.success ||
        data.data.checkindata.some(
          (r) =>
            !userids.includes(r.userid) ||
            r.checkin_time < start ||
            r.checkin_time >= end ||
            (r.exception_type ?? '')
              .split(/[;；]/)
              .some(
                (value) => !['', '正常', '迟到', '早退'].includes(value.trim()),
              ),
        )
      )
        throw new WecomAttendanceError('WECOM_INVALID_EVIDENCE');
      return data.data.checkindata;
    }
    throw new WecomAttendanceError('WECOM_AUTH_REJECTED');
  }
}
