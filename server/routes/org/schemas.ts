import type { AuthorizationTitle } from '@nocobase/authorization/core';
import { z } from 'zod';

// Each exported schema is annotated with the value it produces, so a documented response cannot drift from the
// handler's: the handlers build these view types.

const nonEmpty = z.string().min(1);
const userId = nonEmpty.max(64);

// ---- Path and query ------------------------------------------------------------------------------------------------

export interface DepartmentParams {
  readonly departmentId: string;
}
export const DepartmentParams: z.ZodType<DepartmentParams> = z.object({
  departmentId: nonEmpty,
});

export interface DepartmentMemberParams extends DepartmentParams {
  readonly userId: string;
}
export const DepartmentMemberParams: z.ZodType<DepartmentMemberParams> =
  z.object({ departmentId: nonEmpty, userId: nonEmpty });

export interface PositionParams {
  readonly positionId: string;
}
export const PositionParams: z.ZodType<PositionParams> = z.object({
  positionId: nonEmpty,
});

export interface GradeParams {
  readonly gradeId: string;
}
export const GradeParams: z.ZodType<GradeParams> = z.object({
  gradeId: nonEmpty,
});

export interface DutyRoleParams {
  readonly code: string;
}
export const DutyRoleParams: z.ZodType<DutyRoleParams> = z.object({
  code: nonEmpty,
});

export interface DutyRoleMemberParams extends DutyRoleParams {
  readonly userId: string;
}
export const DutyRoleMemberParams: z.ZodType<DutyRoleMemberParams> = z.object({
  code: nonEmpty,
  userId: nonEmpty,
});

export interface OptionsQuery {
  readonly includeInactive?: boolean | undefined;
}
export const OptionsQuery: z.ZodType<OptionsQuery> = z.object({
  includeInactive: z.stringbool().optional().meta({
    description:
      'Also list disabled entries, so a form can show the one a record still names. Defaults to `false`.',
  }),
});

// ---- Bodies --------------------------------------------------------------------------------------------------------

const code = z
  .string()
  .regex(/^[A-Za-z0-9][A-Za-z0-9._-]{0,63}$/u)
  .meta({ description: 'Letters, digits, `.`, `_` and `-`, up to 64.' });
const title = z.string().trim().min(1).max(255);

export interface CreateDepartmentInput {
  readonly title: string;
  readonly code?: string | null | undefined;
  readonly parentId?: string | null | undefined;
  readonly managerId?: string | null | undefined;
  readonly executiveId?: string | null | undefined;
  readonly sortOrder?: number | undefined;
}
export const CreateDepartmentInput: z.ZodType<CreateDepartmentInput> =
  z.strictObject({
    title,
    code: code.nullable().optional(),
    parentId: nonEmpty.nullable().optional(),
    managerId: userId.nullable().optional(),
    executiveId: userId.nullable().optional(),
    sortOrder: z.int().optional(),
  });

export interface UpdateDepartmentInput {
  readonly title?: string | undefined;
  readonly code?: string | null | undefined;
  readonly parentId?: string | null | undefined;
  readonly managerId?: string | null | undefined;
  readonly executiveId?: string | null | undefined;
  readonly sortOrder?: number | undefined;
}
export const UpdateDepartmentInput: z.ZodType<UpdateDepartmentInput> =
  z.strictObject({
    title: title.optional(),
    code: code.nullable().optional(),
    parentId: nonEmpty.nullable().optional().meta({
      description:
        'Moves the department; `null` makes it top-level. A parent below the department itself is refused (`PARENT_CYCLE`).',
    }),
    managerId: userId.nullable().optional(),
    executiveId: userId.nullable().optional(),
    sortOrder: z.int().optional(),
  });

export interface AddMemberInput {
  readonly userId: string;
  readonly primary?: boolean | undefined;
}
export const AddMemberInput: z.ZodType<AddMemberInput> = z.strictObject({
  userId,
  primary: z.boolean().optional().meta({
    description:
      "Make this the user's primary department, clearing any other. Omitted: primary only when the user has none.",
  }),
});

export interface CreatePositionInput {
  readonly code: string;
  readonly title: string;
  readonly sortOrder?: number | undefined;
}
export const CreatePositionInput: z.ZodType<CreatePositionInput> =
  z.strictObject({ code, title, sortOrder: z.int().optional() });

export interface UpdatePositionInput {
  readonly code?: string | undefined;
  readonly title?: string | undefined;
  readonly sortOrder?: number | undefined;
}
export const UpdatePositionInput: z.ZodType<UpdatePositionInput> =
  z.strictObject({
    code: code.optional(),
    title: title.optional(),
    sortOrder: z.int().optional(),
  });

export interface CreateGradeInput {
  readonly code: string;
  readonly title: string;
  readonly rank: number;
}
export const CreateGradeInput: z.ZodType<CreateGradeInput> = z.strictObject({
  code,
  title,
  rank: z.int().meta({ description: 'Higher is more senior.' }),
});

export interface UpdateGradeInput {
  readonly code?: string | undefined;
  readonly title?: string | undefined;
  readonly rank?: number | undefined;
}
export const UpdateGradeInput: z.ZodType<UpdateGradeInput> = z.strictObject({
  code: code.optional(),
  title: title.optional(),
  rank: z.int().optional(),
});

export interface AddDutyRoleMemberInput {
  readonly userId: string;
}
export const AddDutyRoleMemberInput: z.ZodType<AddDutyRoleMemberInput> =
  z.strictObject({ userId });

// ---- Responses -----------------------------------------------------------------------------------------------------

/** Plain text, or the translation descriptor a seeded row stores. */
const Title: z.ZodType<AuthorizationTitle> = z
  .union([z.string(), z.object({ key: z.string(), ns: z.string() })])
  .meta({
    ref: 'OrgTitle',
    description:
      "Plain text, or a `{ key, ns }` translation descriptor rendered in the reader's language.",
  });

/** A user named by a record, resolved server-side so a picker can show its name. */
export interface OrgUserBody {
  readonly id: string;
  readonly name: string;
  readonly username?: string | null | undefined;
  readonly email?: string | null | undefined;
}
export const OrgUser: z.ZodType<OrgUserBody> = z
  .object({
    id: z.string(),
    name: z
      .string()
      .meta({ description: 'Display name; the id when the user is gone.' }),
    username: z.string().nullable().optional(),
    email: z.string().nullable().optional(),
  })
  .meta({ ref: 'OrgUser' });

export interface DepartmentBody {
  readonly id: string;
  readonly title: string;
  readonly code: string | null;
  readonly parentId: string | null;
  readonly managerId: string | null;
  readonly manager: OrgUserBody | null;
  readonly executiveId: string | null;
  readonly executive: OrgUserBody | null;
  readonly active: boolean;
  readonly sortOrder: number;
  readonly memberCount: number;
}
export const Department: z.ZodType<DepartmentBody> = z
  .object({
    id: z.string(),
    title: z.string(),
    code: z.string().nullable(),
    parentId: z
      .string()
      .nullable()
      .meta({ description: 'The parent department; `null` at the top.' }),
    managerId: z.string().nullable().meta({
      description: "The head's user id. The head need not be a member.",
    }),
    manager: OrgUser.nullable(),
    executiveId: z.string().nullable().meta({
      description:
        'The executive in charge (分管副总); usually set on top-level departments only, and inherited below.',
    }),
    executive: OrgUser.nullable(),
    active: z.boolean().meta({
      description:
        'The stored flag. A department also counts as disabled while any ancestor is.',
    }),
    sortOrder: z.number().int(),
    memberCount: z
      .number()
      .int()
      .meta({ description: 'Active direct members.' }),
  })
  .meta({ ref: 'OrgDepartment' });

export interface DepartmentOptionBody {
  readonly id: string;
  readonly title: string;
  readonly code: string | null;
  readonly parentId: string | null;
  readonly active: boolean;
}
export const DepartmentOption: z.ZodType<DepartmentOptionBody> = z
  .object({
    id: z.string(),
    title: z.string(),
    code: z.string().nullable(),
    parentId: z.string().nullable(),
    active: z.boolean().meta({
      description: 'Whether the department and every ancestor are active.',
    }),
  })
  .meta({ ref: 'OrgDepartmentOption' });

export interface DepartmentMemberBody {
  readonly userId: string;
  readonly user: OrgUserBody;
  readonly primary: boolean;
}
export const DepartmentMember: z.ZodType<DepartmentMemberBody> = z
  .object({
    userId: z.string(),
    user: OrgUser,
    primary: z.boolean().meta({
      description: "Whether this is the user's primary department.",
    }),
  })
  .meta({ ref: 'OrgDepartmentMember' });

export interface PositionBody {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly active: boolean;
  readonly sortOrder: number;
}
export const Position: z.ZodType<PositionBody> = z
  .object({
    id: z.string(),
    code: z.string(),
    title: z.string(),
    active: z.boolean(),
    sortOrder: z.number().int(),
  })
  .meta({ ref: 'OrgPosition' });

export interface GradeBody {
  readonly id: string;
  readonly code: string;
  readonly title: string;
  readonly rank: number;
  readonly active: boolean;
}
export const Grade: z.ZodType<GradeBody> = z
  .object({
    id: z.string(),
    code: z.string(),
    title: z.string(),
    rank: z.number().int().meta({ description: 'Higher is more senior.' }),
    active: z.boolean(),
  })
  .meta({ ref: 'OrgGrade' });

export interface DutyRoleBody {
  readonly code: string;
  readonly title: AuthorizationTitle;
  readonly description: string | null;
  readonly active: boolean;
  readonly sortOrder: number;
  readonly memberCount: number;
}
export const DutyRole: z.ZodType<DutyRoleBody> = z
  .object({
    code: z.string().meta({
      description: 'The stable code approval resolution looks up.',
    }),
    title: Title,
    description: z.string().nullable(),
    active: z.boolean(),
    sortOrder: z.number().int(),
    memberCount: z.number().int().meta({ description: 'Active members.' }),
  })
  .meta({ ref: 'OrgDutyRole' });

export interface DutyRoleMemberBody {
  readonly userId: string;
  readonly user: OrgUserBody;
}
export const DutyRoleMember: z.ZodType<DutyRoleMemberBody> = z
  .object({ userId: z.string(), user: OrgUser })
  .meta({ ref: 'OrgDutyRoleMember' });
