/**
 * Request and response schemas of the platform module's routes. Response schemas are typed against the views the
 * routes build from the services (`views.ts`), so the API document cannot drift from what is returned.
 */
import { z } from 'zod';

import { CALENDAR_DAY_KINDS } from '../../providers/platform/working-calendar.js';
import {
  RULE_DOMAINS,
  RULE_VALUE_TYPES,
} from '../../providers/platform/rule-definitions.js';
import type {
  AuditLogView,
  CalendarDayView,
  DictionaryEntryView,
  DictionaryTypeView,
  RuleSummaryView,
  RuleVersionView,
  SequenceView,
  WorkCalendarView,
} from './views.js';

const localDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .meta({ description: 'A local date of the calendar time zone, YYYY-MM-DD.' });
const pageQuery = {
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
};

// Work calendar

const WorkHoursSchema = z
  .object({
    start: z.string().meta({ description: 'HH:mm, local time.' }),
    end: z.string().meta({ description: 'HH:mm, local time.' }),
  })
  .meta({ ref: 'PlatformWorkHours' });

export const WorkCalendarSchema: z.ZodType<WorkCalendarView> = z
  .object({
    timeZone: z
      .string()
      .meta({ description: 'IANA time zone the calendar computes in.' }),
    today: localDate,
    workHours: WorkHoursSchema.meta({
      description: 'The working window in effect today.',
    }),
  })
  .meta({ ref: 'PlatformWorkCalendar' });

export const CalendarDayKindSchema = z.enum(CALENDAR_DAY_KINDS);

export const CalendarDaySchema: z.ZodType<CalendarDayView> = z
  .object({
    date: localDate,
    kind: CalendarDayKindSchema,
    note: z.string().nullable(),
    updatedAt: z.string(),
  })
  .meta({ ref: 'PlatformCalendarDay' });

export const CalendarDaysQuery = z.object({
  year: z.coerce.number().int().min(1970).max(2200),
});
export const CalendarDayParams = z.object({ date: localDate });
export const SetCalendarDayInput = z.strictObject({
  kind: CalendarDayKindSchema,
  note: z.string().trim().max(255).nullable().optional(),
});
export const ImportCalendarDaysInput = z.strictObject({
  year: z.number().int().min(1970).max(2200),
  entries: z
    .array(
      z.strictObject({
        date: localDate,
        kind: CalendarDayKindSchema,
        note: z.string().trim().max(255).nullable().optional(),
      }),
    )
    .max(366),
  replace: z.boolean().meta({
    description:
      'Remove the year’s explicit days missing from `entries`, so the import replaces the year’s schedule.',
  }),
});
export const CalendarImportResultSchema = z
  .object({
    created: z.number().int(),
    updated: z.number().int(),
    unchanged: z.number().int(),
    removed: z.number().int(),
  })
  .meta({ ref: 'PlatformCalendarImportResult' });

// Dictionaries

export const DictionaryTypeSchema: z.ZodType<DictionaryTypeView> = z
  .object({
    type: z.string(),
    extraFields: z.array(
      z.object({
        name: z.string(),
        type: z.enum(['boolean', 'integer', 'number', 'enum']),
        nullable: z.boolean(),
        min: z.number().optional(),
        options: z.array(z.string()).optional(),
      }),
    ),
  })
  .meta({ ref: 'PlatformDictionaryType' });

const LabelSchema = z
  .object({
    'zh-CN': z.string().optional(),
    'en-US': z.string().optional(),
  })
  .meta({
    ref: 'PlatformDictionaryLabel',
    description: 'The label in each language.',
  });

export const DictionaryEntrySchema: z.ZodType<DictionaryEntryView> = z
  .object({
    id: z.string(),
    type: z.string(),
    code: z.string(),
    label: LabelSchema,
    sortOrder: z.number().int(),
    active: z.boolean(),
    // Each type declares its own attributes (see `extraFields` of the type); the shape depends on the type.
    extra: z.record(z.string(), z.unknown()).nullable(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .meta({ ref: 'PlatformDictionaryEntry' });

export const DictionaryTypeParams = z.object({ type: z.string() });
export const DictionaryEntryParams = z.object({
  type: z.string(),
  entryId: z.string(),
});
export const DictionaryEntriesQuery = z.object({
  includeInactive: z.enum(['true', 'false']).optional().meta({
    description:
      'Include disabled entries; needs the dictionaries settings read permission.',
  }),
});
const LabelInput = z.strictObject({
  'zh-CN': z.string().trim().max(100).optional(),
  'en-US': z.string().trim().max(100).optional(),
});
// `extra` is validated against the type's declared fields by the service; its shape depends on the type.
const ExtraInput = z
  .record(z.string(), z.union([z.boolean(), z.number(), z.null()]))
  .nullable();
export const CreateDictionaryEntryInput = z.strictObject({
  code: z
    .string()
    .regex(/^[A-Za-z][A-Za-z0-9_-]{0,63}$/)
    .meta({
      description: 'Stable code other records store; cannot change later.',
    }),
  label: LabelInput,
  sortOrder: z.number().int().min(0).max(1_000_000).optional(),
  active: z.boolean().optional(),
  extra: ExtraInput.optional(),
});
export const UpdateDictionaryEntryInput = z.strictObject({
  label: LabelInput.optional(),
  sortOrder: z.number().int().min(0).max(1_000_000).optional(),
  active: z.boolean().optional(),
  extra: ExtraInput.optional(),
});

// Approval rules

export const RuleVersionSchema: z.ZodType<RuleVersionView> = z
  .object({
    id: z.string(),
    key: z.string(),
    // A number, a time zone name or a working window, depending on the key's `type`.
    value: z.unknown(),
    effectiveFrom: z.string(),
    updatedBy: z.string().nullable(),
    updatedByName: z.string().nullable(),
    note: z.string().nullable(),
    createdAt: z.string(),
  })
  .meta({ ref: 'PlatformRuleVersion' });

export const RuleSummarySchema: z.ZodType<RuleSummaryView> = z
  .object({
    key: z.string(),
    domain: z.enum(RULE_DOMAINS),
    type: z.enum(RULE_VALUE_TYPES),
    area: z.enum(['rules', 'calendar']),
    min: z.number().optional(),
    options: z.array(z.string()).optional(),
    max: z.number().optional(),
    allowFuture: z.boolean(),
    // The key's default, typed as its `type`.
    defaultValue: z.unknown(),
    current: RuleVersionSchema.nullable(),
    scheduled: z.array(RuleVersionSchema),
  })
  .meta({ ref: 'PlatformRuleSummary' });

export const RulesQuery = z.object({
  area: z.enum(['rules', 'calendar']).default('rules'),
});
export const RuleKeyParams = z.object({ key: z.string() });
export const RuleVersionParams = z.object({
  key: z.string(),
  versionId: z.string(),
});
export const CreateRuleVersionInput = z.strictObject({
  // Validated against the key's type by the service: a number, a time zone name or `{ start, end }`.
  value: z.unknown(),
  effectiveFrom: z.iso.datetime({ offset: true }).optional().meta({
    description:
      'When the version takes effect; now when omitted. Never in the past.',
  }),
  note: z.string().trim().max(500).nullable().optional(),
});

// Sequences

export const SequenceSchema: z.ZodType<SequenceView> = z
  .object({
    prefix: z.string(),
    period: z.string().meta({ description: 'yyyyMM' }),
    next: z
      .number()
      .int()
      .meta({ description: 'The number the next document receives.' }),
  })
  .meta({ ref: 'PlatformSequence' });
export const SequencesQuery = z.object({
  prefix: z.string().optional(),
  ...pageQuery,
});

// Audit logs

export const AuditLogSchema: z.ZodType<AuditLogView> = z
  .object({
    id: z.string(),
    actorId: z.string().nullable(),
    actorName: z.string().nullable(),
    action: z.string(),
    targetType: z.string(),
    targetId: z.string().nullable(),
    // JSON snapshots of the changed fields; their shape depends on `targetType`.
    before: z.unknown(),
    after: z.unknown(),
    reason: z.string().nullable(),
    at: z.string(),
  })
  .meta({ ref: 'PlatformAuditLog' });
export const AuditLogsQuery = z.object({
  targetType: z.string().optional(),
  targetId: z.string().optional(),
  actorId: z.string().optional(),
  action: z.string().optional(),
  from: z.iso
    .datetime({ offset: true })
    .optional()
    .meta({ description: 'At or after this instant.' }),
  to: z.iso
    .datetime({ offset: true })
    .optional()
    .meta({ description: 'Before this instant.' }),
  orderBy: z.enum(['at', '-at']).default('-at').meta({
    description: '`at` oldest first, `-at` newest first (the default).',
  }),
  ...pageQuery,
});
export const AuditLogParams = z.object({
  auditLogId: z.string().regex(/^\d+$/),
});
export const AuditFacetsSchema = z
  .object({ targetTypes: z.array(z.string()), actions: z.array(z.string()) })
  .meta({ ref: 'PlatformAuditFacets' });
