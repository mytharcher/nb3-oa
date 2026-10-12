import { z } from 'zod';
export const Id = z.string().regex(/^[A-Za-z0-9_-]{1,128}$/);
export const Date = z.iso.date();
export const Params = z.object({ id: Id }).strict();
export const TaskParams = Params.extend({
  taskId: z.string().min(1).max(200),
}).strict();
const Command = z.object({
  requestId: z.string().min(1).max(128),
  reason: z.string().trim().min(1).max(2000),
});
export const Create = Command.extend({
  id: Id,
  requisitionId: Id,
  targetAccountId: z.string().min(1).max(64).optional(),
  requisitionVersion: z.number().int().nonnegative(),
  account: z
    .object({
      name: z.string().trim().min(1).max(200),
      email: z.email(),
      username: z.string().min(1).max(200).optional(),
      password: z.string().min(8).max(128),
    })
    .strict(),
  employee: z
    .object({
      code: z.string().trim().min(1).max(200),
      name: z.string().trim().min(1).max(200),
      managerId: Id.nullable(),
      hireDate: Date,
      careerStartDate: Date.nullable(),
      probationEndDate: Date,
    })
    .strict(),
  mentorEmployeeId: Id.nullable().optional(),
  workstationRequirement: z
    .string()
    .trim()
    .min(1)
    .max(2000)
    .nullable()
    .optional(),
  baseSalary: z.string().regex(/^\d{1,12}\.\d{2}$/),
}).strict();
export const TaskAction = Command.extend({
  expectedVersion: z.number().int().positive(),
  action: z.enum([
    'claim',
    'release',
    'complete',
    'forceComplete',
    'transfer',
    'reassignMentor',
  ]),
  targetUserId: Id.optional(),
  attachmentIds: z.array(z.uuid()).max(10).optional(),
  facts: z.record(z.string(), z.string().max(100000)).optional(),
  assetUnits: z
    .array(
      z
        .object({
          code: z.string().trim().min(1).max(64),
          serialNumber: z.string().trim().min(1).max(200),
        })
        .strict(),
    )
    .min(1)
    .max(100)
    .optional(),
}).strict();
export const Cancel = Command.extend({
  expectedVersion: z.number().int().positive(),
}).strict();
const User = z.object({ id: Id, name: z.string() }).strict();
export const Record = z
  .object({
    id: Id,
    creatorId: Id,
    creator: User,
    employeeId: Id,
    userId: Id,
    user: User,
    requisitionId: Id,
    departmentId: Id,
    positionId: Id,
    gradeId: Id,
    hireDate: Date,
    mentorEmployeeId: Id.nullable().optional(),
    mentorName: z.string().nullable().optional(),
    workstationRequirement: z.string().nullable().optional(),
    status: z.enum(['handling', 'completed', 'cancelled']),
    version: z.number().int().positive(),
  })
  .strict();
export const Task = z
  .object({
    id: z.string(),
    onboardingId: Id,
    kind: z.string(),
    status: z.enum(['open', 'claimed', 'completed', 'cancelled']),
    assigneeId: Id.nullable(),
    assignee: User.nullable(),
    targetUserId: Id.nullable(),
    target: User.nullable(),
    dutyRoleCode: z.string().nullable(),
    dueDate: Date,
    facts: z
      .partialRecord(
        z.enum([
          'accountId',
          'deviceReference',
          'workstation',
          'badgeReference',
          'mentorEmployeeId',
          'plan',
          'privateFactsId',
          'sourceTaskId',
          'returnReceipt',
          'assetReceiptId',
          'attachmentIds',
        ]),
        z.string(),
      )
      .nullable(),
    forced: z.boolean(),
    version: z.number().int().positive(),
  })
  .strict();
export const TimelineEntry = z
  .object({
    id: z.string(),
    at: z.iso.datetime(),
    action: z.enum([
      'onboarding.create',
      'onboarding.cancel',
      'onboarding.task.claim',
      'onboarding.task.release',
      'onboarding.task.transfer',
      'onboarding.task.reassignMentor',
      'onboarding.task.complete',
      'onboarding.task.forceComplete',
      'onboarding.reminder.queued',
      'onboarding.reminder.sent',
    ]),
    actor: User.nullable(),
    taskId: z.string().optional(),
    kind: z.string().optional(),
    from: User.optional(),
    to: User.optional(),
    assetReceiptId: z.string().optional(),
    sourceTaskId: z.string().optional(),
    forced: z.boolean().optional(),
    parentCompleted: z.boolean().optional(),
    accountEnabled: z.boolean().optional(),
  })
  .strict();
export const Detail = z
  .object({
    record: Record,
    tasks: z.array(
      Task.extend({
        actions: z.array(
          z.enum([
            'claim',
            'release',
            'complete',
            'forceComplete',
            'transfer',
            'reassignMentor',
          ]),
        ),
      }),
    ),
    timeline: z.array(TimelineEntry),
    timeZone: z.string(),
    canCancel: z.boolean(),
  })
  .strict();
export const Salary = z
  .object({
    compensationId: Id,
    baseSalary: z.string(),
    gradeId: Id,
    effectiveFrom: Date,
  })
  .strict();
export const Bank = z
  .object({
    bankName: z.string(),
    bankAccount: z.string(),
    bankAccountName: z.string(),
    socialInsuranceReference: z.string(),
  })
  .strict()
  .partial()
  .nullable();

export const ListQuery = z
  .object({
    page: z.coerce.number().int().positive().default(1),
    pageSize: z.coerce.number().int().positive().max(100).default(20),
    status: z.enum(['handling', 'completed', 'cancelled']).optional(),
  })
  .strict();
export const Meta = z
  .object({ page: z.number(), pageSize: z.number(), total: z.number() })
  .strict();

export const CreateOptions = z.object({ canCreate: z.boolean() }).strict();

export const TransferCandidates = z.array(User);
