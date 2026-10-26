import {
  defineAppConfig,
  envBoolean,
  envString,
} from '@nocobase/app-server/config';
import { z } from 'zod';
import type { WecomAttendanceConfig } from '../providers/wecom-attendance/contract.js';
const schema = z.object({
  enabled: z.boolean(),
  corpId: z.string(),
  secret: z.string(),
  mappings: z.array(
    z.object({
      wecomUserId: z.string().min(1).max(128),
      userId: z.string().min(1).max(64),
    }),
  ),
});
export default defineAppConfig<WecomAttendanceConfig>({
  defaults: { enabled: false, corpId: '', secret: '', mappings: [] },
  env: {
    OA_WECOM_ATTENDANCE_ENABLED: envBoolean('enabled', {
      description: 'Enable dedicated WeCom attendance synchronization.',
    }),
    OA_WECOM_ATTENDANCE_CORP_ID: envString('corpId', {
      required: false,
      description: 'WeCom corporation identity for attendance.',
    }),
    OA_WECOM_ATTENDANCE_SECRET: envString('secret', {
      required: false,
      description:
        'Dedicated attendance application secret; never use a browser configuration.',
      secret: true,
    }),
  },
  validate: (value, context) => {
    const result = schema.safeParse(value);
    if (!result.success) {
      context.error(
        'mappings',
        'Supply explicit WeCom and OA user identifiers in a mapping array.',
      );
      return;
    }
    if (
      value.enabled &&
      (!value.corpId.trim() || !value.secret.trim() || !value.mappings.length)
    )
      context.error(
        'enabled',
        'An enabled source requires corporation identity, attendance secret and user mappings.',
      );
    if (
      new Set(value.mappings.map((m) => m.userId)).size !==
        value.mappings.length ||
      new Set(value.mappings.map((m) => m.wecomUserId)).size !==
        value.mappings.length
    )
      context.error('mappings', 'Each identity must have exactly one mapping.');
  },
});
