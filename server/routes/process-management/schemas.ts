import { z } from 'zod';
export const Action = z.enum(['appoint', 'reassign', 'terminate']);
export const Person = z.object({ id: z.string(), name: z.string() });
export const Process = z.object({
  kind: z.string(),
  domain: z.string(),
  category: z.literal('approval'),
  connected: z.boolean(),
  capabilities: z.array(z.string()),
});
export const Execution = z.object({
  id: z.string(),
  kind: z.string(),
  recordLabel: z.string(),
  number: z.string().nullable(),
  applicant: Person.nullable(),
  status: z.string(),
  currentStage: z.string().nullable(),
  version: z.number(),
  createdAt: z.string(),
  endedAt: z.string().nullable(),
});
export const Task = z.object({
  id: z.string(),
  runId: z.string(),
  stage: z.string(),
  status: z.string(),
  kind: z.string(),
  assignee: Person,
  actor: Person.nullable(),
  answer: z.string().nullable(),
  comment: z.string().nullable(),
  previousTaskId: z.string().nullable(),
  createdAt: z.string(),
  closedAt: z.string().nullable(),
  actions: z.array(Action),
});
export const Management = z.object({
  action: Action,
  allowed: z.boolean(),
  reason: z.enum(['unavailable', 'notConnected']).nullable(),
});
export const Detail = z.object({
  timeZone: z.string(),
  record: Execution,
  runs: z.array(
    z.object({
      id: z.string(),
      stage: z.string(),
      status: z.string(),
      startedAt: z.string(),
      endedAt: z.string().nullable(),
      outcome: z.string().nullable(),
      appoint: z.boolean(),
      definitionMissing: z.boolean(),
      tasks: z.array(Task),
    }),
  ),
  events: z.array(
    z.object({
      id: z.string(),
      runId: z.string().nullable(),
      kind: z.string(),
      stage: z.string().nullable(),
      actor: Person.nullable(),
      at: z.string(),
      comment: z.string().nullable(),
    }),
  ),
  transitions: z.array(
    z.object({
      id: z.string(),
      from: z.string().nullable(),
      to: z.string(),
      name: z.string(),
      actor: Person.nullable(),
      at: z.string(),
    }),
  ),
  actions: z.array(Management),
  commentsReadable: z.boolean(),
});
export const Definition = Process.extend({
  initial: z.string(),
  states: z.array(z.object({ name: z.string(), final: z.boolean() })),
  stages: z.array(
    z.object({
      name: z.string(),
      policy: z.string(),
      peopleSource: z.enum(['pools', 'subjects', 'dynamic']),
      pools: z.array(z.string()),
      covered: z.array(z.string()),
    }),
  ),
  frozen: z.array(z.string()),
  transitions: z.array(
    z.object({
      name: z.string(),
      from: z.array(z.string()),
      to: z.array(z.string()),
      manual: z.boolean(),
      conditions: z.record(z.string(), z.string()),
    }),
  ),
});
export const Params = z.object({
  kind: z.string().max(100),
  recordId: z.string().max(200).optional(),
});
export const Query = z
  .object({
    locale: z.enum(['zh-CN', 'en-US']).default('zh-CN'),
    search: z.string().max(200).default(''),
    kind: z.string().max(100).optional(),
    status: z.string().max(100).optional(),
    from: z.iso.date().optional(),
    to: z.iso.date().optional(),
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(20),
    orderBy: z.enum(['createdAt', 'endedAt', 'name']).default('createdAt'),
    direction: z.enum(['asc', 'desc']).default('desc'),
  })
  .refine((v) => !v.from || !v.to || v.from <= v.to, {
    message: 'Invalid date range',
    path: ['to'],
  });
export const OptionsInput = z.strictObject({
  action: Action,
  taskId: z.string().max(200).optional(),
  search: z.string().max(200).optional(),
  offset: z.number().int().min(0).default(0),
  limit: z.number().int().min(1).max(100).default(20),
});
export const Options = z.object({
  version: z.number(),
  taskId: z.string().optional(),
  runId: z.string().optional(),
  contentHash: z.string().optional(),
  places: z.array(z.string()).optional(),
  people: z.array(Person),
  nextOffset: z.number().nullable(),
});
export const Command = z
  .strictObject({
    action: Action,
    reason: z.string().trim().min(1).max(2000),
    requestId: z.uuid(),
    expectedVersion: z.number().int().min(0),
    taskId: z.string().max(200).optional(),
    runId: z.string().max(200).optional(),
    contentHash: z.string().max(200).optional(),
    to: z.string().max(200).optional(),
    place: z.string().max(200).optional(),
  })
  .refine(
    (v) =>
      v.action === 'terminate' ||
      Boolean(v.to && v.taskId && v.runId && v.contentHash),
    {
      message: 'A current task, run, content and recipient are required',
      path: ['to'],
    },
  );
export type ExecutionDto = z.infer<typeof Execution>;
export type DetailDto = z.infer<typeof Detail>;
export type DefinitionDto = z.infer<typeof Definition>;
export type CommandInput = z.infer<typeof Command>;
