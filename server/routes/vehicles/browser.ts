import type { Application } from '@nocobase/app-server/application';
import {
  apiValidator,
  describeRoute,
  dataResponse,
  apiErrorResponses,
} from '@nocobase/app-server/router';
import { z } from 'zod';
import { Hono, type Context } from 'hono';
import {
  userAdministrationServiceToken,
  type AuthEnv,
} from '@nocobase/app-plugin-authentication';
import { type AuthorizationEnv } from '@nocobase/app-plugin-authorization/server';
import {
  databaseManagerToken,
  type RepositoryPolicy,
  type RepositoryRecord,
} from '@nocobase/db';
import { employeeServiceToken } from '../../providers/employees/contract.js';
import { approvalDirectoryServiceToken } from '../../providers/approval-directory/contract.js';
import { calendarServiceToken } from '../../providers/platform/index.js';
import { vehicleRequestServiceToken } from '../../providers/vehicles/index.js';
import { VehicleError } from '../../providers/vehicles/errors.js';
import * as S from './schemas.js';
type Env = AuthEnv & AuthorizationEnv;
const query = z.strictObject({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().max(200).default(''),
  status: z.string().max(32).default(''),
  mode: z.enum(['mine', 'all']).default('mine'),
  sort: z
    .enum([
      'createdAt',
      'startAt',
      'number',
      'name',
      'plateNumber',
      'capacity',
      'version',
    ])
    .optional(),
  direction: z.enum(['asc', 'desc']).default('desc'),
  locale: z.enum(['zh-CN', 'en-US']).default('zh-CN'),
});
const person = z.strictObject({ id: z.string(), name: z.string() });
const requestFields = [
  'id',
  'applicantId',
  'createdById',
  'purpose',
  'destination',
  'startAt',
  'endAt',
  'passengers',
  'needsDriver',
  'number',
  'approvedFingerprint',
  'approvedAt',
  'ruleSnapshot',
  'managerApproverId',
  'status',
  'lifecycleVersion',
  'statusChangedAt',
  'createdAt',
];
const vehicleFields = [
  'id',
  'plateNumber',
  'name',
  'vehicleType',
  'capacity',
  'status',
  'version',
];
const driverFields = ['id', 'employeeId', 'active', 'version'];
function requireFields(row: RepositoryRecord, fields: readonly string[]) {
  if (fields.some((k) => !(k in row)))
    throw new VehicleError(
      'VEHICLE_FIELDS_RESTRICTED',
      'Required fields are not readable.',
    );
}
function fullRead(p: RepositoryPolicy | undefined, fields: readonly string[]) {
  if (!p || p.read === false) return false;
  if (p.read === true) return true;
  return (
    p.read.fields === undefined ||
    (Array.isArray(p.read.fields) &&
      fields.every(
        (k) =>
          p.read !== true &&
          p.read !== false &&
          Array.isArray(p.read.fields) &&
          p.read.fields.includes(k),
      ))
  );
}
/** Browser DTOs always require owner view plus the actual operation policy. No JSON amount appears here. */
export function registerVehicleBrowserRoutes(
  router: Hono<Env>,
  app: Application,
) {
  const c = app.container,
    db = c.resolve(databaseManagerToken),
    users = c.resolve(userAdministrationServiceToken),
    employees = c.resolve(employeeServiceToken),
    service = c.resolve(vehicleRequestServiceToken);
  const actor = (ctx: Context<Env>) => ctx.get('auth')!.user.id;
  const doc = (operationId: string, response: z.ZodType) =>
    describeRoute({
      operationId,
      summary: operationId,
      tags: ['Vehicles'],
      responses: { 200: dataResponse(response), ...apiErrorResponses },
    });
  async function optional(
    ctx: Context<Env>,
    resource: string,
    action: string,
    collection: string,
  ) {
    const d = await ctx
      .get('authz')
      .authorize({ resource: { type: 'composite', id: resource }, action });
    return d.effect === 'deny'
      ? undefined
      : (
          d.conditions?.database as
            Record<string, RepositoryPolicy | false | undefined> | undefined
        )?.[collection] || undefined;
  }
  async function required(
    ctx: Context<Env>,
    resource: string,
    action: string,
    collection: string,
  ) {
    const p = await optional(ctx, resource, action, collection);
    if (!p) throw new VehicleError('VEHICLE_ACCESS_DENIED', 'Access denied.');
    return p;
  }
  async function active(id: string) {
    const [e, u] = await Promise.all([
      employees.getByUserId(id),
      users.get(id),
    ]);
    return Boolean(
      e?.active && e.status !== 'left' && u?.kind === 'person' && !u.disabledAt,
    );
  }
  async function admin(id: string) {
    return (
      (await active(id)) &&
      (await c.resolve(approvalDirectoryServiceToken).snapshot()).hasRole(
        id,
        'admin',
      )
    );
  }
  async function names(ids: readonly string[]) {
    const result = await Promise.all(
      [...new Set(ids)].map((id) => users.get(id)),
    );
    return result
      .filter((u) => u !== undefined)
      .map((u) => ({ id: u.id, name: u.name }));
  }
  async function canWrite(
    p: RepositoryPolicy | undefined,
    collection: string,
    row: RepositoryRecord,
    operation: 'create' | 'update',
  ) {
    if (!p) return false;
    try {
      const repo = db.repository(collection).withPolicy(p);
      const checked =
        operation === 'create'
          ? await repo.validateMutation({ operation: 'createOne', values: row })
          : await repo.validateMutation({
              operation: 'updateOne',
              values: row,
              filter: { id: typeof row.id === 'string' ? row.id : '' },
            });
      return checked.valid;
    } catch {
      return false;
    }
  }
  const optionsSchema = z.strictObject({
    actor: person,
    timeZone: z.string(),
    canCreate: z.boolean(),
    canManage: z.boolean(),
    canManageDrivers: z.boolean(),
  });
  router.get(
    '/vehicleBrowser/options',
    doc('vehicleBrowserOptions', optionsSchema),
    async (ctx) => {
      const id = actor(ctx),
        view = await optional(
          ctx,
          'oa.vehicleRequests',
          'view',
          'vehicleRequests',
        ),
        submit = await optional(
          ctx,
          'oa.vehicleRequests',
          'submit',
          'vehicleRequests',
        ),
        garage = await optional(ctx, 'oa.vehicleGarage', 'manage', 'vehicles');
      const driverManage = await optional(
        ctx,
        'oa.vehicleGarage',
        'manage',
        'vehicleDrivers',
      );
      const isActive = await active(id),
        u = await users.get(id);
      const sample = {
        id: 'browser-capability',
        applicantId: id,
        createdById: id,
        purpose: 'Purpose',
        destination: 'Destination',
        startAt: '2099-01-01T00:00:00Z',
        endAt: '2099-01-01T01:00:00Z',
        passengers: 1,
        needsDriver: false,
        number: null,
        approvedFingerprint: null,
        approvedAt: null,
        ruleSnapshot: null,
        managerApproverId: null,
        status: 'draft',
        lifecycleVersion: 0,
        statusChangedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };
      return ctx.json({
        data: {
          actor: { id, name: u?.name ?? '' },
          timeZone: c.resolve(calendarServiceToken).timeZone(),
          canCreate:
            isActive &&
            fullRead(view, requestFields) &&
            fullRead(submit, requestFields) &&
            (await canWrite(submit, 'vehicleRequests', sample, 'create')),
          canManage:
            (await admin(id)) &&
            fullRead(garage, vehicleFields) &&
            (await canWrite(
              garage,
              'vehicles',
              {
                id: 'browser-capability',
                plateNumber: 'EXAMPLE',
                name: 'Vehicle',
                vehicleType: 'car',
                capacity: 1,
                status: 'active',
                version: 1,
              },
              'create',
            )),
          canManageDrivers:
            (await admin(id)) &&
            fullRead(driverManage, driverFields) &&
            (await canWrite(
              driverManage,
              'vehicleDrivers',
              {
                id: 'browser-capability',
                employeeId:
                  (await employees.getByUserId(id))?.id ?? 'candidate',
                active: true,
                version: 1,
              },
              'create',
            )),
        },
      });
    },
  );
  const browserRow = S.Record.omit({
    approvedFingerprint: true,
    approvedAt: true,
    ruleSnapshot: true,
    managerApproverId: true,
    createdById: true,
  }).extend({ applicant: person });
  router.get(
    '/vehicleBrowser/requests',
    doc(
      'listVehicleBrowserRequests',
      z.strictObject({ items: z.array(browserRow), total: z.number().int() }),
    ),
    apiValidator('query', query),
    async (ctx) => {
      const q = ctx.req.valid('query'),
        p = await required(
          ctx,
          'oa.vehicleRequests',
          'view',
          'vehicleRequests',
        ),
        repo = db
          .repository<z.infer<typeof S.Record>>('vehicleRequests')
          .withPolicy(p),
        sort = q.sort ?? 'createdAt';
      if (!['createdAt', 'startAt', 'number'].includes(sort))
        throw new VehicleError('VEHICLE_INVALID_INPUT', 'Invalid sort.');
      const filter = (f: import('@nocobase/db').FilterBuilder) =>
        f.and([
          ...(q.mode === 'mine'
            ? [f.string('applicantId').eq(actor(ctx))]
            : []),
          ...(q.status ? [f.string('status').eq(q.status)] : []),
          ...(q.search
            ? [
                f.or([
                  f.string('purpose').includes(q.search),
                  f.string('destination').includes(q.search),
                  f.string('number').includes(q.search),
                ]),
              ]
            : []),
        ]);
      const total = await repo.count({ filter });
      if (sort === 'number' && total > 5000)
        throw new VehicleError('VEHICLE_SORT_LIMIT', 'Narrow the search.');
      let rows = await repo.findMany({
        filter,
        ...(sort === 'number'
          ? {}
          : { offset: (q.page - 1) * q.pageSize, limit: q.pageSize }),
        sort: (s) => [
          q.direction === 'asc' ? s.field(sort).asc() : s.field(sort).desc(),
          s.field('id').asc(),
        ],
      });
      rows.forEach((row) => requireFields(row, requestFields));
      if (sort === 'number') {
        rows.sort(
          (a, b) =>
            (q.direction === 'asc' ? 1 : -1) *
              String(a.number ?? '').localeCompare(
                String(b.number ?? ''),
                q.locale,
              ) || String(a['id']).localeCompare(String(b['id'])),
        );
        rows = rows.slice((q.page - 1) * q.pageSize, q.page * q.pageSize);
      }
      const people = await names(rows.map((r) => String(r.applicantId)));
      return ctx.json({
        data: {
          items: rows.map((row) =>
            browserRow.parse({
              ...Object.fromEntries(
                Object.entries(S.Record.parse(row)).filter(
                  ([key]) => key in browserRow.shape,
                ),
              ),
              applicant: people.find((u) => u.id === row.applicantId) ?? {
                id: String(row.applicantId),
                name: '',
              },
            }),
          ),
          total,
        },
      });
    },
  );
  // Authorization is resolved before service lifecycle transactions. Offer responses are intentionally narrow.
  router.get(
    '/vehicleBrowser/requests/:id',
    doc(
      'getVehicleBrowserRequest',
      S.Detail.extend({
        canViewCost: z.boolean(),
        transitions: z.array(z.string()),
      }),
    ),
    apiValidator('param', S.Params),
    async (ctx) => {
      const id = ctx.req.valid('param').id,
        p = await required(
          ctx,
          'oa.vehicleRequests',
          'view',
          'vehicleRequests',
        ),
        submit = await optional(
          ctx,
          'oa.vehicleRequests',
          'submit',
          'vehicleRequests',
        ),
        operate = await optional(
          ctx,
          'oa.vehicleRequests',
          'operate',
          'vehicleRequests',
        ),
        cost = await optional(
          ctx,
          'oa.vehicleRequests',
          'viewCost',
          'vehicleUsageCosts',
        );
      const detail = await service.detail(id, actor(ctx), p),
        isActive = await active(actor(ctx));
      const operationRow =
        operate &&
        fullRead(operate, requestFields) &&
        (await db
          .repository('vehicleRequests')
          .withPolicy(operate)
          .findOne({ filter: { id } }));
      const canSubmit =
        submit &&
        fullRead(submit, requestFields) &&
        (await canWrite(
          submit,
          'vehicleRequests',
          S.Record.parse(detail.record),
          'update',
        ));
      const transitions: string[] = [];
      for (const a of detail.view.available) {
        if (!['edit', 'submit', 'withdraw', 'terminate'].includes(a.name))
          continue;
        const allowed = a.name === 'terminate' ? operationRow : canSubmit;
        if (
          isActive &&
          allowed &&
          (a.allowed ||
            (a.name === 'terminate' &&
              (
                await service.runtime.can(
                  'oa.vehicleRequest',
                  id,
                  'terminate',
                  { id: actor(ctx) },
                  { input: { reason: 'Browser capability check' } },
                )
              ).allowed))
        )
          transitions.push(a.name);
      }
      // Terminate has approval.admin guard, never substitute the ordinary administrative duty role.
      if (
        transitions.includes('terminate') &&
        !detail.view.available.some((a) => a.name === 'terminate' && a.allowed)
      ) {
        const ok = await service.runtime.can(
          'oa.vehicleRequest',
          id,
          'terminate',
          { id: actor(ctx) },
          { input: { reason: 'Browser capability check' } },
        );
        if (!ok.allowed)
          transitions.splice(transitions.indexOf('terminate'), 1);
      }
      const receipt =
        cost &&
        (await db
          .repository<{ id: string; sourceId: string }>('vehicleUsageReceipts')
          .findOne({ filter: { sourceId: id } }));
      const costVisible =
        cost &&
        receipt &&
        fullRead(cost, ['id', 'fuelCents']) &&
        (await db
          .repository('vehicleUsageCosts')
          .withPolicy(cost)
          .findOne({ filter: { id: receipt.id } }));
      const offered = isActive && Boolean(operationRow);
      return ctx.json({
        data: {
          ...detail,
          taskActions: offered ? detail.taskActions : [],
          runActions: offered ? detail.runActions : [],
          view: {
            ...detail.view,
            available: detail.view.available.filter((a) =>
              transitions.includes(a.name),
            ),
          },
          transitions,
          canViewCost: isActive && Boolean(costVisible),
        },
      });
    },
  );
  const factSchema = z.strictObject({
    dispatch: z
      .strictObject({
        id: z.string(),
        vehicle: z.strictObject({
          id: z.string(),
          name: z.string(),
          plateNumber: z.string(),
        }),
        driver: person.nullable(),
        dispatchedBy: person,
        createdAt: z.string(),
      })
      .nullable(),
    usage: z
      .strictObject({
        id: z.string(),
        mileage: z.number().int(),
        exception: z.string(),
        registeredBy: person,
        createdAt: z.string(),
      })
      .nullable(),
  });
  router.get(
    '/vehicleBrowser/requests/:id/facts',
    doc('getVehicleBrowserFacts', factSchema),
    apiValidator('param', S.Params),
    async (ctx) => {
      const id = ctx.req.valid('param').id;
      await service.detail(
        id,
        actor(ctx),
        await required(ctx, 'oa.vehicleRequests', 'view', 'vehicleRequests'),
      );
      const use = await db
          .repository<{
            id: string;
            sourceId: string;
            vehicleId: string;
            driverId: string | null;
            dispatchedById: string;
            createdAt: string;
          }>('vehicleUses')
          .findOne({ filter: { sourceId: id } }),
        receipt = await db
          .repository<{
            id: string;
            sourceId: string;
            mileage: number;
            exception: string;
            registeredById: string;
            createdAt: string;
          }>('vehicleUsageReceipts')
          .findOne({ filter: { sourceId: id } });
      const v =
          use &&
          (await db
            .repository<{ id: string; name: string; plateNumber: string }>(
              'vehicles',
            )
            .findOne({ filter: { id: use.vehicleId } })),
        driver =
          use?.driverId &&
          (await db
            .repository<{ id: string; employeeId: string }>('vehicleDrivers')
            .findOne({ filter: { id: use.driverId } })),
        e = driver && (await employees.getById(driver.employeeId)),
        people = await names([
          ...(use ? [use.dispatchedById] : []),
          ...(receipt ? [receipt.registeredById] : []),
          ...(e ? [e.userId] : []),
        ]),
        personOf = (id: string) =>
          people.find((p) => p.id === id) ?? { id, name: '' };
      return ctx.json({
        data: {
          dispatch:
            use && v
              ? {
                  id: use.id,
                  vehicle: {
                    id: v.id,
                    name: v.name,
                    plateNumber: v.plateNumber,
                  },
                  driver: e ? personOf(e.userId) : null,
                  dispatchedBy: personOf(use.dispatchedById),
                  createdAt: use.createdAt,
                }
              : null,
          usage: receipt
            ? {
                id: receipt.id,
                mileage: receipt.mileage,
                exception: receipt.exception,
                registeredBy: personOf(receipt.registeredById),
                createdAt: receipt.createdAt,
              }
            : null,
        },
      });
    },
  );
  const driverSchema = S.DriverRecord.extend({
    employee: z.strictObject({ id: z.string(), user: person }),
  });
  router.get(
    '/vehicleBrowser/garage',
    doc(
      'listVehicleBrowserGarage',
      z.strictObject({
        items: z.array(S.VehicleRecord),
        total: z.number().int(),
      }),
    ),
    apiValidator('query', query),
    async (ctx) => {
      const q = ctx.req.valid('query'),
        p = await required(ctx, 'oa.vehicleGarage', 'view', 'vehicles'),
        repo = db
          .repository<z.infer<typeof S.VehicleRecord>>('vehicles')
          .withPolicy(p),
        sort = q.sort ?? 'name';
      if (!['name', 'plateNumber', 'capacity', 'version'].includes(sort))
        throw new VehicleError('VEHICLE_INVALID_INPUT', 'Invalid sort.');
      const filter = (f: import('@nocobase/db').FilterBuilder) =>
          f.and([
            ...(q.status ? [f.string('status').eq(q.status)] : []),
            ...(q.search
              ? [
                  f.or([
                    f.string('name').includes(q.search),
                    f.string('plateNumber').includes(q.search),
                  ]),
                ]
              : []),
          ]),
        total = await repo.count({ filter }),
        text = ['name', 'plateNumber'].includes(sort);
      if (text && total > 5000)
        throw new VehicleError('VEHICLE_SORT_LIMIT', 'Narrow the search.');
      let rows = await repo.findMany({
        filter,
        ...(text
          ? {}
          : { offset: (q.page - 1) * q.pageSize, limit: q.pageSize }),
        sort: (s) => [
          q.direction === 'asc' ? s.field(sort).asc() : s.field(sort).desc(),
          s.field('id').asc(),
        ],
      });
      rows.forEach((r) => requireFields(r, vehicleFields));
      if (text) {
        rows.sort(
          (a, b) =>
            (q.direction === 'asc' ? 1 : -1) *
              String(
                a[sort === 'plateNumber' ? 'plateNumber' : 'name'],
              ).localeCompare(
                String(b[sort === 'plateNumber' ? 'plateNumber' : 'name']),
                q.locale,
              ) || String(a['id']).localeCompare(String(b['id'])),
        );
        rows = rows.slice((q.page - 1) * q.pageSize, q.page * q.pageSize);
      }
      return ctx.json({ data: { items: rows, total } });
    },
  );
  router.get(
    '/vehicleBrowser/garage/:id',
    doc(
      'getVehicleBrowserGarage',
      z.strictObject({ record: S.VehicleRecord, canEdit: z.boolean() }),
    ),
    apiValidator('param', S.Params),
    async (ctx) => {
      const id = ctx.req.valid('param').id,
        p = await required(ctx, 'oa.vehicleGarage', 'view', 'vehicles'),
        manage = await optional(ctx, 'oa.vehicleGarage', 'manage', 'vehicles'),
        row = await db
          .repository('vehicles')
          .withPolicy(p)
          .findOne({ filter: { id } });
      if (!row) throw new VehicleError('VEHICLE_NOT_FOUND', 'Not found.');
      requireFields(row, vehicleFields);
      return ctx.json({
        data: {
          record: row,
          canEdit:
            (await admin(actor(ctx))) &&
            fullRead(manage, vehicleFields) &&
            (await canWrite(
              manage,
              'vehicles',
              { ...row, version: Number(row.version) + 1 },
              'update',
            )),
        },
      });
    },
  );
  router.get(
    '/vehicleBrowser/drivers',
    doc(
      'listVehicleBrowserDrivers',
      z.strictObject({ items: z.array(driverSchema), total: z.number().int() }),
    ),
    apiValidator('query', query),
    async (ctx) => {
      const q = ctx.req.valid('query'),
        p = await required(ctx, 'oa.vehicleGarage', 'view', 'vehicleDrivers'),
        rows = await db
          .repository<z.infer<typeof S.DriverRecord>>('vehicleDrivers')
          .withPolicy(p)
          .findMany({ sort: (s) => s.field('id').asc() });
      if (rows.length > 5000)
        throw new VehicleError('VEHICLE_SORT_LIMIT', 'Narrow the search.');
      const items: z.infer<typeof driverSchema>[] = [];
      for (const row of rows) {
        requireFields(row, driverFields);
        const e = await employees.getById(String(row.employeeId)),
          u = e && (await users.get(e.userId));
        if (!e || !u) continue;
        items.push({
          ...S.DriverRecord.parse(row),
          employee: { id: e.id, user: { id: u.id, name: u.name } },
        });
      }
      const matched = items
        .filter(
          (r) =>
            !q.search ||
            r.employee.user.name
              .toLocaleLowerCase(q.locale)
              .includes(q.search.toLocaleLowerCase(q.locale)),
        )
        .sort(
          (a, b) =>
            a.employee.user.name.localeCompare(
              b.employee.user.name,
              q.locale,
            ) || String(a['id']).localeCompare(String(b['id'])),
        );
      return ctx.json({
        data: {
          items: matched.slice((q.page - 1) * q.pageSize, q.page * q.pageSize),
          total: matched.length,
        },
      });
    },
  );
  router.get(
    '/vehicleBrowser/drivers/:id',
    doc(
      'getVehicleBrowserDriver',
      z.strictObject({ record: driverSchema, canEdit: z.boolean() }),
    ),
    apiValidator('param', S.Params),
    async (ctx) => {
      const id = ctx.req.valid('param').id,
        p = await required(ctx, 'oa.vehicleGarage', 'view', 'vehicleDrivers'),
        manage = await optional(
          ctx,
          'oa.vehicleGarage',
          'manage',
          'vehicleDrivers',
        ),
        row = await db
          .repository<z.infer<typeof S.DriverRecord>>('vehicleDrivers')
          .withPolicy(p)
          .findOne({ filter: { id } });
      if (!row) throw new VehicleError('VEHICLE_NOT_FOUND', 'Not found.');
      requireFields(row, driverFields);
      const driver = S.DriverRecord.parse(row),
        e = await employees.getById(driver.employeeId),
        u = e && (await users.get(e.userId));
      if (!e || !u)
        throw new VehicleError('VEHICLE_NOT_FOUND', 'Employee not found.');
      return ctx.json({
        data: {
          record: {
            ...driver,
            employee: { id: e.id, user: { id: u.id, name: u.name } },
          },
          canEdit:
            (await admin(actor(ctx))) &&
            fullRead(manage, driverFields) &&
            (await canWrite(
              manage,
              'vehicleDrivers',
              { ...driver, version: driver.version + 1 },
              'update',
            )),
        },
      });
    },
  );
  router.get(
    '/vehicleBrowser/driverCandidates',
    doc(
      'vehicleDriverEmployeeCandidates',
      z.strictObject({
        items: z.array(z.strictObject({ id: z.string(), user: person })),
      }),
    ),
    apiValidator(
      'query',
      z.strictObject({ search: z.string().trim().max(100).default('') }),
    ),
    async (ctx) => {
      const p = await required(
        ctx,
        'oa.vehicleGarage',
        'manage',
        'vehicleDrivers',
      );
      if (!(await admin(actor(ctx))) || !fullRead(p, driverFields))
        throw new VehicleError(
          'VEHICLE_ACCESS_DENIED',
          'Administrative duty required.',
        );
      // Administrative roster management capability, not a new employee grant. Return safe active person identifiers only.
      const rows = await db
        .repository<{
          id: string;
          userId: string;
          active: boolean;
          status: string;
        }>('employees')
        .findMany({
          select: (s) => s.fields('id', 'userId', 'active', 'status'),
          filter: (f) =>
            f.and([
              f.boolean('active').isTrue(),
              f.string('status').ne('left'),
            ]),
          sort: (s) => s.field('id').asc(),
        });
      const result = [];
      for (const e of rows) {
        const u = await users.get(e.userId);
        if (
          !u ||
          u.disabledAt ||
          u.kind !== 'person' ||
          !u.name
            .toLocaleLowerCase()
            .includes(ctx.req.valid('query').search.toLocaleLowerCase())
        )
          continue;
        if (
          await canWrite(
            p,
            'vehicleDrivers',
            { id: 'candidate', employeeId: e.id, active: true, version: 1 },
            'create',
          )
        )
          result.push({ id: e.id, user: { id: u.id, name: u.name } });
        if (result.length >= 50) break;
      }
      return ctx.json({ data: { items: result } });
    },
  );
  router.get(
    '/vehicleBrowser/requests/:id/dispatchCandidates',
    doc(
      'vehicleBrowserDispatchCandidates',
      S.Candidates.extend({ drivers: z.array(driverSchema) }),
    ),
    apiValidator('param', S.Params),
    async (ctx) => {
      const id = ctx.req.valid('param').id,
        p = await required(
          ctx,
          'oa.vehicleRequests',
          'operate',
          'vehicleRequests',
        );
      await service.detail(
        id,
        actor(ctx),
        await required(ctx, 'oa.vehicleRequests', 'view', 'vehicleRequests'),
      );
      const result = await service.dispatchCandidates(id, actor(ctx), p),
        drivers = [];
      for (const row of result.drivers) {
        const e = await employees.getById(row.employeeId),
          u = e && (await users.get(e.userId));
        if (
          e?.active &&
          e.status !== 'left' &&
          u?.kind === 'person' &&
          !u.disabledAt
        )
          drivers.push({
            ...row,
            employee: { id: e.id, user: { id: u.id, name: u.name } },
          });
      }
      return ctx.json({ data: { ...result, drivers } });
    },
  );
}
