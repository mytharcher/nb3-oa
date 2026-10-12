/**
 * The dictionary types the application's flows read, with the shape of each type's `extra`. Types are code: a flow
 * that reads `leaveType` depends on its `deductsBalance` and `maxDays` meaning what this file says, so administrators
 * maintain entries but never add, rename or reshape a type. Adding a type: add it here, add its title under
 * `platform.dictionaries.types` in the client locales, and seed its entries in a new seed.
 */
import { z } from 'zod';

/** One `extra` field, as the settings page renders its editor. */
export interface DictionaryExtraField {
  readonly name: string;
  readonly type: 'boolean' | 'integer' | 'number' | 'enum';
  /** A number field that may be left empty (`null`), such as a leave type with no maximum. */
  readonly nullable: boolean;
  readonly min?: number;
  readonly options?: readonly string[];
}

export interface DictionaryTypeDefinition {
  readonly type: string;
  readonly extraFields: readonly DictionaryExtraField[];
}

const bool = (name: string): DictionaryExtraField => ({
  name,
  type: 'boolean',
  nullable: false,
});
const int = (
  name: string,
  options: { nullable?: boolean; min?: number } = {},
): DictionaryExtraField => ({
  name,
  type: 'integer',
  nullable: options.nullable ?? false,
  min: options.min ?? 0,
});
const num = (
  name: string,
  options: { nullable?: boolean; min?: number } = {},
): DictionaryExtraField => ({
  name,
  type: 'number',
  nullable: options.nullable ?? false,
  min: options.min ?? 0,
});

export const DICTIONARY_TYPES: readonly DictionaryTypeDefinition[] = [
  {
    type: 'leaveType',
    extraFields: [
      bool('deductsBalance'),
      bool('requiresAttachment'),
      num('attachmentAboveDays', { nullable: true }),
      num('maxDays', { nullable: true }),
      bool('requiresHr'),
    ],
  },
  { type: 'annualLeaveTier', extraFields: [num('minYears'), num('days')] },
  {
    type: 'expenseCategory',
    extraFields: [
      {
        name: 'travelStandardKind',
        type: 'enum',
        nullable: false,
        options: ['none', 'lodging', 'allowance'],
      },
    ],
  },
  { type: 'paymentMethod', extraFields: [] },
  { type: 'expensePlanType', extraFields: [] },
  { type: 'budgetSubject', extraFields: [] },
  { type: 'officeItem', extraFields: [bool('requiresPrintInfo')] },
  { type: 'sealType', extraFields: [] },
  { type: 'contractType', extraFields: [] },
  { type: 'assetCategory', extraFields: [] },
  { type: 'supplierCategory', extraFields: [] },
  { type: 'vehicleType', extraFields: [] },
  { type: 'departureType', extraFields: [] },
  { type: 'resignationReason', extraFields: [bool('voluntary')] },
  { type: 'recruitmentReason', extraFields: [bool('replacement')] },
  { type: 'certificateType', extraFields: [bool('involvesSalary')] },
  {
    type: 'travelStandard',
    extraFields: [
      int('minRank'),
      num('lodgingPerNight'),
      num('allowancePerDay'),
    ],
  },
];

const typesByName = new Map(DICTIONARY_TYPES.map((type) => [type.type, type]));

export function dictionaryTypeOf(
  type: string,
): DictionaryTypeDefinition | undefined {
  return typesByName.get(type);
}

/** The schema `extra` of the type must satisfy: every declared field present, nothing else; `null` without fields. */
export function dictionaryExtraSchema(
  definition: DictionaryTypeDefinition,
): z.ZodType<Record<string, unknown> | null> {
  if (definition.extraFields.length === 0) return z.null();
  const shape: Record<string, z.ZodType> = {};
  for (const field of definition.extraFields) {
    let schema: z.ZodType;
    if (field.type === 'boolean') schema = z.boolean();
    else if (field.type === 'enum')
      schema = z.enum(field.options as [string, ...string[]]);
    else {
      let number = z.number().min(field.min ?? 0);
      if (field.type === 'integer') number = number.int();
      schema = field.nullable ? number.nullable() : number;
    }
    shape[field.name] = schema;
  }
  return z.strictObject(shape);
}

/** The languages a label carries: the languages the application offers. */
export const LABEL_LOCALES = ['zh-CN', 'en-US'] as const;
export type LabelLocale = (typeof LABEL_LOCALES)[number];
export type DictionaryLabel = Partial<Record<LabelLocale, string>>;

/** The label in `locale`, else in the other offered language, else the code. */
export function localizeLabel(
  label: DictionaryLabel | null | undefined,
  locale: string | undefined,
  fallback: string,
): string {
  const preferred = label?.[locale as LabelLocale];
  if (preferred) return preferred;
  for (const other of LABEL_LOCALES) if (label?.[other]) return label[other];
  return fallback;
}
