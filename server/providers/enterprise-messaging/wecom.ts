import type {
  ChannelConfig,
  ChannelContext,
  ChannelInstance,
  ChannelPreparationInput,
  ChannelSendInput,
  ChannelSendResult,
  ValidatedChannelMessage,
} from '@nocobase/app-plugin-notification/server';
import { z } from 'zod';

interface WecomConfig extends ChannelConfig {
  type: 'oa-wecom-app';
  corpId: string;
  corpSecret: string;
  agentId: number;
}
interface Message {
  text: string;
}
interface Recipient {
  userId: string;
}
interface Prepared extends Message, Recipient {}
const inputSchema = z
  .object({
    to: z
      .string()
      .min(1)
      .max(128)
      .regex(/^[a-zA-Z0-9_\-.@]+$/)
      .refine((value) => value !== '@all'),
    text: z
      .string()
      .min(1)
      .refine((value) => Buffer.byteLength(value, 'utf8') <= 2048),
  })
  .strict();
const endpoint = 'https://qyapi.weixin.qq.com/cgi-bin/';

/** One explicit native recipient per delivery. No group broadcast or interactive decision callback. */
export class WecomAppChannel implements ChannelInstance<
  Message,
  Recipient,
  Prepared
> {
  static readonly type = 'oa-wecom-app';
  static readonly label = 'WeCom application messages';
  private token?: { value: string; until: number };
  constructor(
    _context: ChannelContext,
    private readonly config: WecomConfig,
  ) {}
  static validateConfig(config: WecomConfig) {
    if (
      !config.corpId?.trim() ||
      !config.corpSecret?.trim() ||
      !Number.isSafeInteger(config.agentId) ||
      config.agentId <= 0
    )
      throw new Error(
        'WeCom requires a corporation ID, application secret and positive application ID.',
      );
  }
  validateMessage(input: unknown): ValidatedChannelMessage<Message, Recipient> {
    const parsed = inputSchema.safeParse(input);
    if (!parsed.success)
      throw new Error(
        'WeCom requires one explicit user and text of at most 2048 bytes.',
      );
    return {
      message: { text: parsed.data.text },
      recipients: [{ userId: parsed.data.to }],
    };
  }
  async prepare({
    message,
    recipient,
  }: ChannelPreparationInput<Message, Recipient>): Promise<Prepared> {
    return { ...message, ...recipient };
  }
  async send({
    message,
    signal,
  }: ChannelSendInput<Prepared>): Promise<ChannelSendResult> {
    let token: string;
    // A token failure is known not to have submitted a message; a lost send response is uncertain.
    try {
      if (this.token && this.token.until > Date.now()) token = this.token.value;
      else {
        const url = new URL('gettoken', endpoint);
        url.searchParams.set('corpid', this.config.corpId);
        url.searchParams.set('corpsecret', this.config.corpSecret);
        const response = await fetch(url, { signal, redirect: 'error' });
        if (!response.ok)
          return failure(response.status === 429 || response.status >= 500);
        const result: unknown = await response.json();
        const parsed = z
          .object({
            errcode: z.literal(0),
            access_token: z.string().min(1),
            expires_in: z.number().positive(),
          })
          .safeParse(result);
        if (!parsed.success) return failure(false);
        token = parsed.data.access_token;
        this.token = {
          value: token,
          until: Date.now() + Math.max(0, parsed.data.expires_in - 60) * 1000,
        };
      }
    } catch {
      return failure(true);
    }
    try {
      const url = new URL('message/send', endpoint);
      url.searchParams.set('access_token', token);
      const response = await fetch(url, {
        method: 'POST',
        signal,
        redirect: 'error',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          touser: message.userId,
          msgtype: 'text',
          agentid: this.config.agentId,
          text: { content: message.text },
          safe: 1,
        }),
      });
      if (response.status === 429) return failure(true);
      if (response.status >= 400 && response.status < 500)
        return failure(false);
      if (!response.ok) return unknown();
      const result = z
        .object({
          errcode: z.number(),
          invaliduser: z.string().optional(),
          unlicenseduser: z.string().optional(),
        })
        .safeParse(await response.json());
      if (!result.success) return unknown();
      if ([40014, 42001].includes(result.data.errcode)) {
        this.token = undefined;
        return failure(true);
      }
      if (result.data.errcode !== 0)
        return failure([-1, 45009].includes(result.data.errcode));
      if (result.data.invaliduser || result.data.unlicenseduser)
        return failure(false);
      return { status: 'accepted' };
    } catch {
      return unknown();
    }
  }
}
function failure(retry: boolean): ChannelSendResult {
  return {
    status: 'failed',
    disposition: retry ? 'same_provider' : 'never',
    error: {
      category: 'provider',
      message:
        'WeCom did not accept the notification. Check application configuration and recipient access.',
    },
  };
}
function unknown(): ChannelSendResult {
  return {
    status: 'submission_unknown',
    error: {
      category: 'network',
      message: 'WeCom submission could not be confirmed.',
    },
  };
}
