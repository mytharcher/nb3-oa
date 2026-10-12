import { randomUUID } from 'node:crypto';
import type {
  DatabaseConnection,
  DatabaseManager,
  RepositoryPolicy,
} from '@nocobase/db';
import type { AuditService } from '../audit/index.js';
import type { Vendor, VendorInput, VendorService } from './contract.js';
import { VendorError } from './contract.js';
export { VendorError } from './contract.js';
function fail(
  code: string,
  message: string,
  kind: 'invalid' | 'notFound' | 'conflict' = 'invalid',
): never {
  throw new VendorError(`VENDOR_${code}`, message, kind);
}
function validate(input: VendorInput): VendorInput {
  const limits: Record<keyof VendorInput, number> = {
    code: 64,
    name: 255,
    category: 255,
    contactName: 255,
    contactPhone: 64,
    contactEmail: 255,
    bankName: 255,
    bankAccount: 128,
    bankAccountName: 255,
  };
  const normalized = {} as VendorInput;
  for (const key of Object.keys(limits) as (keyof VendorInput)[]) {
    if (typeof input[key] !== 'string' || input[key].length > limits[key])
      fail('INVALID_INPUT', `Invalid vendor ${key}.`);
    normalized[key] = input[key].trim();
  }
  if (
    !/^[A-Za-z0-9][A-Za-z0-9_.-]*$/.test(normalized.code) ||
    !normalized.name ||
    !normalized.category
  )
    fail('INVALID_INPUT', 'A stable code, name and category are required.');
  if (
    normalized.contactEmail &&
    !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized.contactEmail)
  )
    fail('INVALID_INPUT', 'Enter a valid contact email.');
  if (
    normalized.contactPhone &&
    !/^[+\d()\s.-]{3,64}$/.test(normalized.contactPhone)
  )
    fail('INVALID_INPUT', 'Enter a valid contact phone number.');
  if (
    normalized.bankAccount &&
    !/^[A-Za-z0-9 -]{3,128}$/.test(normalized.bankAccount)
  )
    fail(
      'INVALID_INPUT',
      'Enter a textual bank account without separators other than spaces or hyphens.',
    );
  return normalized;
}
function command(input: { actorId: string; reason: string }) {
  if (
    !input.actorId ||
    input.actorId.length > 64 ||
    !input.reason?.trim() ||
    input.reason.length > 5000
  )
    fail('INVALID_COMMAND', 'An actor and audit reason are required.');
}
export function createVendorService(d: {
  db: DatabaseManager;
  audit: AuditService;
}): VendorService {
  const get = async (
    id: string,
    connection = d.db.connection(),
    policy?: RepositoryPolicy,
  ) => {
    const repo = connection.repository<Vendor>('vendors');
    return (
      (await (policy ? repo.withPolicy(policy) : repo).findOne({
        filter: { id },
      })) ?? null
    );
  };
  async function active(id: string, tx: DatabaseConnection) {
    const row = (await get(id, tx)) as Vendor | null;
    if (!row) fail('NOT_FOUND', 'Vendor not found.', 'notFound');
    if (!row.active || row.status === 'disabled')
      fail('INACTIVE', 'Choose an active vendor.');
    return row;
  }
  return {
    get,
    async options(connection = d.db.connection(), policy) {
      const repository = connection.repository<Vendor>('vendors');
      const rows = await (
        policy ? repository.withPolicy(policy) : repository
      ).findMany({
        sort: (s) => [s.field('name').asc(), s.field('id').asc()],
      });
      return rows.map((row) => {
        const { id, name, category, active, status } = row;
        if (
          typeof id !== 'string' ||
          typeof name !== 'string' ||
          typeof category !== 'string' ||
          typeof active !== 'boolean' ||
          !status
        )
          fail(
            'OPTIONS_FIELDS_REQUIRED',
            'Vendor identity, category and status read access are required.',
          );
        return { id, name, category, active, status };
      });
    },
    async list(query, policy, connection = d.db.connection()) {
      const rows = await connection
        .repository<Vendor>('vendors')
        .withPolicy(policy)
        .findMany({
          ...(query.active === undefined
            ? {}
            : { filter: { active: query.active } }),
          sort: (s) =>
            query.direction === 'asc'
              ? [s.field(query.sort).asc(), s.field('id').asc()]
              : [s.field(query.sort).desc(), s.field('id').desc()],
        });
      // The permitted read projection is searched, never hidden bank/contact fields.
      const term = query.search?.trim().toLocaleLowerCase();
      const data = term
        ? rows.filter((r) =>
            [r.name, r.code, r.category].some(
              (v) =>
                typeof v === 'string' && v.toLocaleLowerCase().includes(term),
            ),
          )
        : rows;
      const page = Math.min(
        query.page,
        Math.max(1, Math.ceil(data.length / query.pageSize)),
      );
      return {
        data: data.slice((page - 1) * query.pageSize, page * query.pageSize),
        meta: { page, pageSize: query.pageSize, total: data.length },
      };
    },
    async create(input, connection, policy) {
      command(input);
      const values = validate(input);
      return connection.transaction(async (tx) => {
        const repo = tx.repository<Vendor>('vendors');
        if (await repo.findOne({ filter: { code: values.code } }))
          fail(
            'CODE_EXISTS',
            'A vendor with this code already exists.',
            'conflict',
          );
        const now = new Date();
        const row = (
          await (policy ? repo.withPolicy(policy) : repo).createOne({
            values: {
              ...values,
              id: randomUUID(),
              status: 'manual',
              active: true,
              version: 1,
              createdById: input.actorId,
              createdAt: now,
              updatedAt: now,
            },
          })
        ).record;
        if (typeof row.id !== 'string')
          fail(
            'FIELDS_RESTRICTED',
            'The grant does not expose the created vendor.',
          );
        await d.audit.record(
          {
            actorId: input.actorId,
            action: 'vendor.create',
            targetType: 'vendors',
            targetId: row.id,
            after: row,
            reason: input.reason.trim(),
          },
          tx,
        );
        return row as Vendor;
      });
    },
    async update(id, input, connection, policy) {
      command(input);
      return connection.transaction(async (tx) => {
        const repo = tx.repository<Vendor>('vendors');
        const before = await repo.findOne({ filter: { id } });
        if (!before) fail('NOT_FOUND', 'Vendor not found.', 'notFound');
        if (
          !Number.isSafeInteger(input.version) ||
          before.version !== input.version
        )
          fail(
            'VERSION_CONFLICT',
            'This vendor changed; load the latest version.',
            'conflict',
          );
        const keys = [
          'code',
          'name',
          'category',
          'contactName',
          'contactPhone',
          'contactEmail',
          'bankName',
          'bankAccount',
          'bankAccountName',
        ] as const;
        const patch: Partial<VendorInput> = {};
        for (const k of keys) if (input[k] !== undefined) patch[k] = input[k];
        const clean = validate({ ...before, ...patch });
        if (
          clean.code !== before.code &&
          (await repo.findOne({ filter: { code: clean.code } }))
        )
          fail(
            'CODE_EXISTS',
            'A vendor with this code already exists.',
            'conflict',
          );
        if (input.active !== undefined && typeof input.active !== 'boolean')
          fail('INVALID_INPUT', 'Active must be a boolean.');
        const values: Partial<Vendor> = {
          version: input.version + 1,
          updatedAt: new Date(),
        };
        for (const k of keys) if (k in patch) values[k] = clean[k];
        if (input.active !== undefined) {
          values.active = input.active;
          values.status = input.active
            ? before.status === 'qualified'
              ? 'qualified'
              : 'manual'
            : 'disabled';
        }
        const scoped = policy ? repo.withPolicy(policy) : repo;
        const changed = await scoped.updateMany({
          filter: { id, version: input.version },
          values,
        });
        if (!changed.updatedCount)
          fail(
            'VERSION_CONFLICT',
            'This vendor changed or is outside the granted scope.',
            'conflict',
          );
        const after = (await repo.findOne({ filter: { id } }))!;
        await d.audit.record(
          {
            actorId: input.actorId,
            action: input.active === false ? 'vendor.disable' : 'vendor.update',
            targetType: 'vendors',
            targetId: id,
            before,
            after,
            reason: input.reason.trim(),
          },
          tx,
        );
        const projected = await scoped.findOne({ filter: { id } });
        if (!projected)
          fail(
            'FIELDS_RESTRICTED',
            'The updated vendor is outside the read scope.',
          );
        return projected as Vendor;
      });
    },
    async qualificationSource(id, tx) {
      const row = (await get(id, tx)) as Vendor | null;
      if (!row) return null;
      // Acquire a write lock through the public repository without changing vendor facts.
      const locked = await tx.repository<Vendor>('vendors').updateMany({
        filter: { id, version: row.version },
        values: { version: row.version },
      });
      if (!locked.updatedCount)
        fail(
          'VERSION_CONFLICT',
          'Vendor changed while acquiring its qualification lock.',
          'conflict',
        );
      const latest = (await get(id, tx)) as Vendor;
      const {
        version,
        name,
        category,
        status,
        active,
        contactName,
        contactPhone,
        contactEmail,
        qualificationExpiry,
      } = latest;
      return {
        id,
        version,
        name,
        category,
        status,
        active,
        contactName,
        contactPhone,
        contactEmail,
        qualificationExpiry: qualificationExpiry ?? null,
        qualificationId: latest.qualificationId ?? null,
      };
    },
    async applyQualification(input, tx) {
      command(input);
      if (
        !input.qualificationId ||
        !Number.isSafeInteger(input.expectedVersion) ||
        input.expectedVersion < 1 ||
        !['qualified', 'removed'].includes(input.outcome)
      )
        fail(
          'INVALID_INPUT',
          'A qualification identity, vendor version and valid outcome are required.',
        );
      if (input.outcome === 'qualified') {
        const date = input.qualificationExpiry;
        if (
          !date ||
          !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
          !Number.isFinite(Date.parse(`${date}T00:00:00Z`)) ||
          new Date(`${date}T00:00:00Z`).toISOString().slice(0, 10) !== date
        )
          fail('INVALID_INPUT', 'A valid qualification expiry is required.');
      }
      const repo = tx.repository<Vendor>('vendors');
      const before = await repo.findOne({ filter: { id: input.vendorId } });
      if (!before) fail('NOT_FOUND', 'Vendor not found.', 'notFound');
      if (before.version !== input.expectedVersion)
        fail(
          'VERSION_CONFLICT',
          'Vendor changed; restart review using its current facts.',
          'conflict',
        );
      const proposal = input.proposal
        ? validate({ ...before, ...input.proposal, ...input.account })
        : null;
      const values: Partial<Vendor> = {
        version: before.version + 1,
        updatedAt: new Date(),
        status: input.outcome === 'qualified' ? 'qualified' : 'disabled',
        active: input.outcome === 'qualified',
        qualificationId: input.qualificationId,
        qualificationExpiry:
          input.outcome === 'qualified'
            ? input.qualificationExpiry
            : before.qualificationExpiry,
      };
      if (proposal && input.outcome === 'qualified') {
        for (const key of [
          'name',
          'category',
          'contactName',
          'contactPhone',
          'contactEmail',
        ] as const)
          values[key] = proposal[key];
      }
      if (input.account && input.outcome === 'qualified') {
        const account = validate({ ...before, ...input.account });
        for (const key of [
          'bankName',
          'bankAccount',
          'bankAccountName',
        ] as const)
          values[key] = account[key];
      }
      const changed = await repo.updateMany({
        filter: { id: input.vendorId, version: input.expectedVersion },
        values,
      });
      if (!changed.updatedCount)
        fail(
          'VERSION_CONFLICT',
          'Vendor changed; restart review using its current facts.',
          'conflict',
        );
      await d.audit.record(
        {
          actorId: input.actorId,
          action: `vendor.qualification.${input.outcome}`,
          targetType: 'vendors',
          targetId: input.vendorId,
          reason: input.reason.trim(),
          before: {
            version: before.version,
            status: before.status,
            qualificationId: before.qualificationId ?? null,
            qualificationExpiry: before.qualificationExpiry ?? null,
          },
          after: {
            version: values.version,
            status: values.status,
            active: values.active,
            qualificationId: values.qualificationId,
            qualificationExpiry: values.qualificationExpiry,
            accountChanged: !!input.account,
          },
        },
        tx,
      );
    },
    async snapshotForPurchase(id, tx) {
      const { code, name, category } = await active(id, tx);
      return { id, code, name, category };
    },
    async snapshotForContract(id, tx) {
      const before = await active(id, tx);
      const lock = await tx.repository<Vendor>('vendors').updateMany({
        filter: { id, version: before.version },
        values: { version: before.version },
      });
      if (lock.updatedCount !== 1)
        fail(
          'VERSION_CONFLICT',
          'The supplier changed; reload its qualification facts.',
        );
      const row = await active(id, tx);
      if (row.status !== 'qualified')
        fail(
          'QUALIFICATION_REQUIRED',
          'Contract suppliers must have approved qualification.',
        );
      return { id, code: row.code, name: row.name, category: row.category };
    },
    async paymentAccountOf(id, tx) {
      const row = await active(id, tx);
      if (!row.bankName || !row.bankAccount || !row.bankAccountName)
        fail(
          'PAYMENT_ACCOUNT_REQUIRED',
          'The vendor payment account is incomplete.',
        );
      return {
        id: row.id,
        name: row.name,
        bankName: row.bankName,
        bankAccount: row.bankAccount,
        bankAccountName: row.bankAccountName,
      };
    },
  };
}
