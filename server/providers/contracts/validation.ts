import { z } from 'zod';
export const dateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((value) => {
    const date = new Date(`${value}T00:00:00Z`);
    return (
      Number.isFinite(date.getTime()) &&
      date.toISOString().slice(0, 10) === value
    );
  });
export const proposalSchema = z
  .strictObject({
    contractType: z.string().trim().min(1).max(64),
    counterparty: z.discriminatedUnion('kind', [
      z.strictObject({
        kind: z.literal('vendor'),
        id: z.string().uuid(),
        name: z.string().max(255).default(''),
        category: z.string().max(64).default(''),
      }),
      z.strictObject({
        kind: z.literal('customer'),
        name: z.string().trim().min(1).max(255),
      }),
    ]),
    amountCents: z.number().int().min(0).max(Number.MAX_SAFE_INTEGER),
    startsOn: dateSchema,
    endsOn: dateSchema,
    paymentTerms: z.string().trim().max(10000),
    standardTemplate: z.boolean(),
    textVersionId: z.string().uuid().nullable(),
    attachments: z
      .array(z.string().uuid())
      .max(10)
      .refine((ids) => new Set(ids).size === ids.length),
    reason: z.string().trim().max(5000),
  })
  .refine((v) => v.endsOn >= v.startsOn, {
    path: ['endsOn'],
    message: 'The contract term must not end before it starts.',
  });
export const createContractSchema = z
  .strictObject({
    operation: z.enum(['new', 'change', 'renew', 'terminate']),
    contractId: z.string().uuid().nullable(),
    baseVersion: z.number().int().min(0),
    proposal: proposalSchema,
  })
  .refine(
    (v) =>
      v.operation === 'new'
        ? !v.contractId && v.baseVersion === 0
        : !!v.contractId && v.baseVersion > 0,
    {
      message:
        'Changes must identify an approved contract and its immutable base version.',
    },
  );
export type ContractCreate = z.infer<typeof createContractSchema>;
export type ContractProposal = z.infer<typeof proposalSchema>;

/** A legal opinion is the only business output accepted from a native action. */
export function validateActionInput(action: string, input: unknown): void {
  const person = z.string().uuid().optional();
  const schemas: Record<string, z.ZodType> = {
    approve: z.strictObject({
      data: z.strictObject({ nonStandard: z.boolean().optional() }).optional(),
    }),
    reject: z.strictObject({ data: z.strictObject({}).optional() }),
    return: z.strictObject({ to: z.string().optional() }),
    transfer: z.strictObject({ to: person }),
    addSigner: z.strictObject({
      person,
      mode: z.enum(['before', 'after', 'alongside']).optional(),
    }),
    appoint: z.strictObject({ to: person, place: z.string().optional() }),
    reassign: z.strictObject({ to: person, override: z.boolean().optional() }),
  };
  (schemas[action] ?? z.strictObject({})).parse(input ?? {});
}

/** Parse the configured yuan value as decimal digits, without floating rounding. */
export function ruleCents(value: number): number {
  const text = String(value);
  if (!/^(0|[1-9]\d*)(\.\d{1,2})?$/.test(text))
    throw new Error(
      'Contract thresholds must be exact nonnegative yuan with at most two decimals.',
    );
  const [whole, fraction = ''] = text.split('.');
  const result = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'));
  if (result > BigInt(Number.MAX_SAFE_INTEGER))
    throw new Error('Contract threshold exceeds safe integer cents.');
  return Number(result);
}
