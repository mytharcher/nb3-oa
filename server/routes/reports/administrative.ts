import { z } from 'zod';
import type { Hono, Context } from 'hono';
import type { AuthEnv } from '@nocobase/app-plugin-authentication';
import type { AuthorizationEnv } from '@nocobase/app-plugin-authorization/server';
import type { Application } from '@nocobase/app-server/application';
import {
  ApiError,
  apiValidator,
  describeRoute,
  listResponse,
  apiErrorResponses,
} from '@nocobase/app-server/router';
import { databaseManagerToken, type RepositoryPolicy } from '@nocobase/db';
import { i18nToken } from '@nocobase/app-server/i18n';
import { getRequestLocale } from '@nocobase/i18n/server';
import { supplyServiceToken } from '../../providers/supplies/index.js';
import {
  sealServiceToken,
  SEAL_LEDGER_FIELDS,
  SEAL_PRINT_REQUEST_FIELDS,
  SEAL_PRINT_RECEIPT_FIELDS,
} from '../../providers/seals/contract.js';
import { allRows, xlsx } from './export.js';
type Env = AuthEnv & AuthorizationEnv;
const supplyFields = [
  'id',
  'applicationId',
  'recipientId',
  'issuerId',
  'recipientName',
  'issuerName',
  'createdAt',
  'number',
  'itemCode',
  'requestedQuantity',
  'actualQuantity',
];
const querySchema = z.strictObject({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce
    .number()
    .int()
    .refine((n) => [10, 20, 50, 100].includes(n))
    .default(20),
});
const columns = {
  'supply-ledger': [
    'number',
    'itemCode',
    'requestedQuantity',
    'actualQuantity',
    'recipient',
    'operator',
    'recordedAt',
  ],
  'seal-ledger': [
    'number',
    'sealName',
    'approvedCopies',
    'actualCopies',
    'applicant',
    'operator',
    'recordedAt',
    'sealedAt',
  ],
} as const;
type Dataset = keyof typeof columns;
async function sourcePolicy(
  ctx: Context<Env>,
  resource: string,
  action: string,
  collection: string,
  fields: readonly string[],
): Promise<RepositoryPolicy> {
  const d = await ctx
    .get('authz')
    .authorize({ resource: { type: 'composite', id: resource }, action });
  const p = d.conditions?.database?.[collection];
  const read = p && p.read;
  const allowed = typeof read === 'object' ? read.fields : undefined;
  if (
    d.effect === 'deny' ||
    !p ||
    !read ||
    allowed === false ||
    (Array.isArray(allowed) &&
      !allowed.includes('*') &&
      fields.some((field) => !allowed.includes(field)))
  )
    throw new ApiError({
      status: 'PERMISSION_DENIED',
      domain: 'reports',
      reason: 'SOURCE_ACCESS_DENIED',
      message:
        'The ledger fields or records are outside the current granted scope.',
    });
  return p;
}
async function access(ctx: Context<Env>, dataset: Dataset) {
  if (dataset === 'supply-ledger')
    return {
      supply: await sourcePolicy(
        ctx,
        'oa.supplies',
        'ledger',
        'supplyIssueLedger',
        supplyFields,
      ),
    };
  return {
    seals: undefined,
    ledger: await sourcePolicy(
      ctx,
      'oa.sealLedger',
      'view',
      'sealLedger',
      SEAL_LEDGER_FIELDS,
    ),
    receipts: await sourcePolicy(ctx, 'oa.sealLedger', 'view', 'sealReceipts', [
      ...SEAL_PRINT_RECEIPT_FIELDS,
      'reason',
    ]),
    requests: await sourcePolicy(
      ctx,
      'oa.sealRequests',
      'view',
      'sealRequests',
      SEAL_PRINT_REQUEST_FIELDS,
    ),
  };
}
export async function administrativeDatasets(ctx: Context<Env>) {
  const available: Dataset[] = [];
  for (const dataset of Object.keys(columns) as Dataset[]) {
    try {
      await access(ctx, dataset);
      available.push(dataset);
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
    }
  }
  return available;
}
export function registerAdministrativeReports(
  router: Hono<Env>,
  app: Application,
) {
  const c = app.container,
    db = c.resolve(databaseManagerToken);
  async function rows(
    ctx: Context<Env>,
    dataset: Dataset,
    query: z.infer<typeof querySchema>,
  ) {
    const permissions = await access(ctx, dataset);
    if ('supply' in permissions && permissions.supply) {
      const result = await c
        .resolve(supplyServiceToken)
        .ledger(
          { offset: (query.page - 1) * query.pageSize, limit: query.pageSize },
          permissions.supply,
        );
      return {
        data: result.items.map((row) => ({
          id: row.id,
          number: row.number,
          itemCode: row.itemCode,
          requestedQuantity: row.requestedQuantity,
          actualQuantity: row.actualQuantity,
          recipient: row.recipient.name,
          operator: row.issuer.name,
          recordedAt: row.createdAt,
        })),
        meta: result.meta,
      };
    }
    if (
      !('ledger' in permissions) ||
      !permissions.ledger ||
      !permissions.requests ||
      !permissions.receipts
    )
      throw new Error('Invalid report source');
    let seals: RepositoryPolicy | undefined;
    try {
      seals = await sourcePolicy(ctx, 'oa.seals', 'view', 'seals', [
        'id',
        'name',
      ]);
    } catch (error) {
      if (!(error instanceof ApiError)) throw error;
    }
    const result = await db.transaction((tx) =>
      c.resolve(sealServiceToken).ledgerPage(
        ctx.get('auth')!.user.id,
        tx,
        {
          ledger: permissions.ledger,
          requests: permissions.requests,
          receipts: permissions.receipts,
          seals,
        },
        query,
      ),
    );
    return {
      data: result.data.map((row) => ({
        id: row.id,
        number: row.requestNumber ?? null,
        sealName: row.sealName ?? null,
        approvedCopies: row.approvedCopies,
        actualCopies: row.actualCopies,
        applicant: row.applicant.name,
        operator: row.registeredBy.name,
        recordedAt: row.registeredAt,
        sealedAt: row.sealedAt,
      })),
      meta: result.meta,
    };
  }
  for (const dataset of Object.keys(columns) as Dataset[]) {
    router.get(
      `/${dataset}`,
      describeRoute({
        tags: ['Reports'],
        operationId: `list-${dataset}`,
        summary: 'List the authorized administrative ledger',
        responses: {
          200: listResponse(
            z.record(z.string(), z.union([z.string(), z.number(), z.null()])),
            z.object({
              page: z.number(),
              pageSize: z.number(),
              total: z.number(),
            }),
          ),
          ...apiErrorResponses,
        },
      }),
      apiValidator('query', querySchema),
      async (ctx) => ctx.json(await rows(ctx, dataset, ctx.req.valid('query'))),
    );
    router.get(
      `/${dataset}.xlsx`,
      describeRoute({
        tags: ['Reports'],
        operationId: `export-${dataset}`,
        summary: 'Export up to 10,000 authorized administrative ledger rows',
        responses: {
          200: {
            description: 'Excel workbook',
            content: {
              'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet':
                { schema: { type: 'string', format: 'binary' } },
            },
          },
          ...apiErrorResponses,
        },
      }),
      apiValidator('query', querySchema),
      async (ctx) => {
        const values = await allRows<Record<string, unknown>>((page) =>
          rows(ctx, dataset, { page, pageSize: 100 }),
        );
        const i18n = c.resolve(i18nToken),
          locale = getRequestLocale(ctx) ?? i18n.getDefaultLocale();
        await i18n.ensureLocaleLoaded(locale);
        return xlsx(
          values,
          columns[dataset].map((key) => ({
            key,
            header: i18n.getFixedT(
              'nb3-oa',
              locale,
            )(`reports.administrativeColumns.${key}`),
          })),
          `${dataset}.xlsx`,
          {
            locale,
            sheetName: i18n.getFixedT('nb3-oa', locale)('reportExports.sheet'),
          },
        );
      },
    );
  }
}
