import { z } from 'zod';

import {
  EMPLOYEE_HISTORY_KINDS,
  EMPLOYEE_STATUSES,
  type EmployeeCompensation as EmployeeCompensationView,
  type EmployeeHistoryEntry,
} from '../../providers/employees/contract.js';
import type {
  DirectoryEntry,
  EmployeeSortField,
  EmployeeView,
} from '../../providers/employees/service.js';

const date = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/u, 'Expected a date as YYYY-MM-DD.')
  .meta({ description: 'A calendar date, `YYYY-MM-DD`.' });
const text = (max: number) => z.string().trim().max(max);
const optionalText = (max: number) => text(max).nullable().optional();

export const EmployeeStatus = z
  .enum(EMPLOYEE_STATUSES)
  .meta({ ref: 'EmployeeStatus' });

export const EmployeeParams = z.object({ employeeId: z.string().min(1) });

const NamedRef = z
  .object({ id: z.string(), title: z.string() })
  .meta({ ref: 'EmployeeNamedRef' });
const EmployeeUser = z
  .object({ id: z.string(), name: z.string(), email: z.string().nullable() })
  .meta({ ref: 'EmployeeUser' });
const EmployeeManager = z
  .object({ id: z.string(), name: z.string(), userId: z.string() })
  .meta({ ref: 'EmployeeManager' });

export const Employee: z.ZodType<EmployeeView> = z
  .object({
    id: z.string(),
    userId: z.string().optional(),
    code: z.string().optional(),
    name: z.string().optional(),
    managerId: z.string().nullable().optional(),
    positionId: z.string().nullable().optional(),
    gradeId: z.string().nullable().optional(),
    hireDate: z.string().nullable().optional(),
    probationEndDate: z.string().nullable().optional(),
    status: EmployeeStatus.optional(),
    lastWorkingDay: z.string().nullable().optional(),
    phone: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
    workLocation: z.string().nullable().optional(),
    emergencyContact: z.string().nullable().optional(),
    active: z.boolean().optional(),
    createdAt: z.string().optional(),
    updatedAt: z.string().optional(),
    user: EmployeeUser.nullable().meta({
      description: 'The bound account, resolved from the user directory.',
    }),
    manager: EmployeeManager.nullable().meta({
      description: 'The direct manager as recorded (`managerId`).',
    }),
    primaryDepartment: NamedRef.nullable().meta({
      description: 'The active primary department, from the organisation.',
    }),
    position: NamedRef.nullable(),
    grade: NamedRef.nullable(),
  })
  .meta({ ref: 'Employee' });

export const ListEmployeesQuery = z.object({
  q: z.string().trim().max(100).optional().meta({
    description: 'Matches the name or the employee code.',
  }),
  status: EmployeeStatus.optional(),
  active: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  departmentId: z.string().optional().meta({
    description:
      'Only employees whose primary department is this one or below it.',
  }),
  orderBy: z
    .string()
    .regex(/^(code|hireDate|updatedAt)( (asc|desc))?$/u)
    .optional()
    .transform((value) => {
      if (!value) return undefined;
      const [field, direction] = value.split(' ');
      return {
        field: field as EmployeeSortField,
        desc: direction === 'desc',
      };
    })
    .meta({
      description:
        '`code`, `hireDate` or `updatedAt`, followed by ` desc` for descending. Defaults to `updatedAt desc`.',
    }),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

const editable = {
  code: text(64).min(1).optional(),
  name: text(128).min(1).optional(),
  managerId: z.string().nullable().optional().meta({
    description: 'Employee id of the direct manager; `null` clears it.',
  }),
  positionId: z.string().nullable().optional(),
  gradeId: z.string().nullable().optional(),
  hireDate: date.nullable().optional(),
  probationEndDate: date.nullable().optional(),
  phone: optionalText(32),
  email: z.email().max(255).nullable().optional(),
  workLocation: optionalText(128),
  emergencyContact: optionalText(255),
};

export const CreateEmployeeInput = z.strictObject({
  ...editable,
  userId: z.string().min(1).meta({ description: 'The account to bind.' }),
  code: text(64).min(1),
  name: text(128).min(1),
  hireDate: date,
  status: z
    .enum(['probation', 'regular'])
    .default('probation')
    .meta({ description: 'The status the archive starts in.' }),
});

export const UpdateEmployeeInput = z.strictObject(editable);

export const CorrectStatusInput = z.strictObject({
  status: EmployeeStatus,
  lastWorkingDay: date.nullable().optional(),
  active: z.boolean().optional(),
  reason: text(500).min(1).meta({
    description: 'Why the data is corrected; recorded in the audit log.',
  }),
});

export const EmployeeProfile = z
  .object({
    employeeId: z.string().optional(),
    access: z.enum(['full', 'bank']).meta({
      description:
        '`full` with every controlled field, `bank` with the bank account fields only.',
    }),
    idType: z.string().nullable().optional(),
    idNumber: z.string().nullable().optional(),
    birthDate: z.string().nullable().optional(),
    address: z.string().nullable().optional(),
    education: z.string().nullable().optional(),
    school: z.string().nullable().optional(),
    major: z.string().nullable().optional(),
    bankName: z.string().nullable().optional(),
    bankAccount: z.string().nullable().optional(),
    bankAccountName: z.string().nullable().optional(),
    updatedAt: z.string().nullable().optional(),
  })
  .meta({ ref: 'EmployeeProfile' });

export const UpdateProfileInput = z.strictObject({
  idType: optionalText(32),
  idNumber: optionalText(64),
  birthDate: date.nullable().optional(),
  address: optionalText(500),
  education: optionalText(32),
  school: optionalText(128),
  major: optionalText(128),
  bankName: optionalText(128),
  bankAccount: optionalText(64),
  bankAccountName: optionalText(128),
});

export const EmployeeCompensation: z.ZodType<EmployeeCompensationView> = z
  .object({
    id: z.string(),
    employeeId: z.string(),
    gradeId: z.string().nullable(),
    baseSalary: z
      .string()
      .meta({ description: 'Decimal string with two places.' }),
    effectiveFrom: z.string(),
    sourceApplication: z.string().nullable(),
    note: z.string().nullable(),
    createdById: z.string().nullable(),
    createdAt: z.string(),
  })
  .meta({ ref: 'EmployeeCompensation' });

export const EmployeeHistory: z.ZodType<EmployeeHistoryEntry> = z
  .object({
    id: z.string(),
    employeeId: z.string(),
    kind: z.enum(EMPLOYEE_HISTORY_KINDS),
    before: z.record(z.string(), z.unknown()).nullable(),
    after: z.record(z.string(), z.unknown()).nullable(),
    effectiveAt: z.string(),
    sourceApplication: z.string().nullable(),
    note: z.string().nullable(),
    createdById: z.string().nullable(),
    createdAt: z.string(),
  })
  .meta({ ref: 'EmployeeHistory' });

export const ListDirectoryQuery = z.object({
  q: z.string().trim().max(100).optional().meta({
    description: 'Matches the name or the employee code.',
  }),
  departmentId: z.string().optional().meta({
    description: 'Only people whose primary department is this one or below.',
  }),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});

export const DirectoryEntrySchema: z.ZodType<DirectoryEntry> = z
  .object({
    id: z.string(),
    userId: z.string(),
    user: z.object({ id: z.string(), name: z.string() }).nullable(),
    code: z.string(),
    name: z.string(),
    manager: EmployeeManager.nullable(),
    primaryDepartment: NamedRef.nullable(),
    position: NamedRef.nullable(),
    workLocation: z.string().nullable(),
    phone: z.string().nullable().optional().meta({
      description: 'Absent when the viewer may not see this contact.',
    }),
    email: z.string().nullable().optional(),
  })
  .meta({ ref: 'DirectoryEntry' });

export const PageMeta = z.object({
  page: z.number(),
  pageSize: z.number(),
  total: z.number(),
});
