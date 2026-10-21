// @vitest-environment node
import { expect, it, vi } from 'vitest';
import type { DatabaseConnection, RepositoryPolicy } from '@nocobase/db';
import { createContractLedgerService } from '../../../server/providers/contracts/ledger.js';
import { createSealLedger } from '../../../server/providers/seals/ledger.js';
import { readSealRelatedNames } from '../../../server/routes/seals/related-names.js';
import { readLoanTravelName } from '../../../server/routes/loan-requests/travel-name.js';
import { SealError } from '../../../server/providers/seals/errors.js';

const policy: RepositoryPolicy = {
  read: { fields: ['id', 'number'], scope: true },
};

it('contract identities require view fields and batch only the requested scoped numbers', async () => {
  const findMany = vi.fn().mockResolvedValue([
    { id: 'c1', number: 'CON-42' },
    { id: 'c2', number: null },
    { id: 'other', number: 'PRIVATE' },
  ]);
  const withPolicy = vi.fn().mockReturnValue({ findMany });
  const repository = vi.fn().mockReturnValue({ withPolicy });
  const connection = { repository } as unknown as DatabaseConnection;
  const service = createContractLedgerService(undefined!, undefined!);
  for (const denied of [
    undefined,
    { read: false },
    { read: { fields: ['id'] } },
  ] as (RepositoryPolicy | undefined)[]) {
    expect(await service.names(['c1'], denied, connection)).toEqual(new Map());
  }
  expect(repository).not.toHaveBeenCalled();
  expect(await service.names(['c1', 'c1', 'c2'], policy, connection)).toEqual(
    new Map([['c1', 'CON-42']]),
  );
  expect(repository).toHaveBeenCalledWith('contracts');
  expect(withPolicy).toHaveBeenCalledWith(policy);
  expect(findMany).toHaveBeenCalledTimes(1);
  const fields = vi.fn();
  findMany.mock.calls[0]![0].select({ fields });
  expect(fields).toHaveBeenCalledWith('id', 'number');
});

it('seal names have a separate name-field policy and never read request-visible private instances', async () => {
  const findMany = vi.fn().mockResolvedValue([
    { id: 's1', name: 'Company seal' },
    { id: 'other', name: 'Private seal' },
  ]);
  const withPolicy = vi.fn().mockReturnValue({ findMany });
  const repository = vi.fn().mockReturnValue({ withPolicy });
  const connection = { repository } as unknown as DatabaseConnection;
  const service = createSealLedger({
    users: undefined!,
    audit: undefined!,
    org: undefined!,
    dictionaries: undefined!,
  }).publicService;
  expect(await service.instanceNames(['s1'], connection, policy)).toEqual(
    new Map(),
  );
  expect(repository).not.toHaveBeenCalled();
  const sealPolicy: RepositoryPolicy = {
    read: { fields: ['id', 'name'], scope: true },
  };
  expect(
    await service.instanceNames(['s1', 's1'], connection, sealPolicy),
  ).toEqual(new Map([['s1', 'Company seal']]));
  expect(withPolicy).toHaveBeenCalledWith(sealPolicy);
  expect(findMany).toHaveBeenCalledTimes(1);
});

it('travel identity forwards independent view scope and skips denied fields', async () => {
  const names = vi.fn().mockResolvedValue(new Map([['t1', 'TR-42']]));
  expect(
    await readLoanTravelName({ names }, 't1', 'owner', undefined),
  ).toBeNull();
  expect(names).not.toHaveBeenCalled();
  expect(await readLoanTravelName({ names }, 't1', 'owner', policy)).toBe(
    'TR-42',
  );
  expect(names).toHaveBeenCalledWith(['t1'], policy);
});

it('seal related DTO keeps optional identities null and does not manufacture a ledger number', async () => {
  const ledgerDetail = vi.fn();
  const names = vi.fn().mockResolvedValue(new Map());
  const instanceNames = vi.fn().mockResolvedValue(new Map());
  const services = {
    contracts: { names },
    seals: { instanceNames, ledgerDetail },
  };
  const record = { id: 'r1', contractId: 'c1', sealId: 's1', ledgerId: 'l1' };
  const connection = undefined!;
  expect(
    await readSealRelatedNames(record, 'owner', connection, services, {}),
  ).toEqual({
    contractName: null,
    sealName: null,
    registrationSourceNumber: null,
  });
  expect(ledgerDetail).not.toHaveBeenCalled();
  const access = { requests: policy, ledger: policy, receipts: policy };
  ledgerDetail.mockResolvedValue({
    record: { id: 'l1' },
    request: { id: 'other', number: 'PRIVATE' },
  });
  expect(
    (
      await readSealRelatedNames(record, 'owner', connection, services, {
        ledger: access,
      })
    ).registrationSourceNumber,
  ).toBeNull();
  ledgerDetail.mockResolvedValue({
    record: { id: 'l1' },
    request: { id: 'r1', number: 'SEAL-42' },
  });
  expect(
    (
      await readSealRelatedNames(record, 'owner', connection, services, {
        ledger: access,
      })
    ).registrationSourceNumber,
  ).toBe('SEAL-42');
  ledgerDetail.mockRejectedValue(new SealError('ACCESS_DENIED'));
  expect(
    (
      await readSealRelatedNames(record, 'owner', connection, services, {
        ledger: access,
      })
    ).registrationSourceNumber,
  ).toBeNull();
  ledgerDetail.mockRejectedValue(new Error('Database unavailable'));
  await expect(
    readSealRelatedNames(record, 'owner', connection, services, {
      ledger: access,
    }),
  ).rejects.toThrow('Database unavailable');
});

it('loan ledger identity exposes only a scoped number and never resolves denied fields', async () => {
  const { readLoanLedgerName } =
    await import('../../../server/providers/loan-requests/related-names.js');
  const get = vi
    .fn()
    .mockResolvedValue({ sourceId: 'loan-request-1', principalCents: 900000 });
  const findOne = vi.fn().mockResolvedValue(null);
  const withPolicy = vi.fn().mockReturnValue({ findOne });
  const repository = vi.fn().mockReturnValue({ withPolicy });
  const db = { repository } as unknown as Parameters<
    typeof readLoanLedgerName
  >[0];
  for (const denied of [
    undefined,
    { read: false },
    { read: { fields: ['id'] } },
  ] as (RepositoryPolicy | undefined)[])
    expect(
      await readLoanLedgerName(db, { get }, 'ledger-private', denied),
    ).toBeNull();
  expect(get).not.toHaveBeenCalled();
  expect(repository).not.toHaveBeenCalled();
  expect(
    await readLoanLedgerName(db, { get }, 'ledger-private', policy),
  ).toBeNull();
  expect(withPolicy).toHaveBeenCalledWith(policy);
  expect(findOne).toHaveBeenCalledWith(
    expect.objectContaining({ filter: { id: 'loan-request-1' } }),
  );
  findOne.mockResolvedValue({ id: 'loan-request-1', number: 'LOAN-7' });
  expect(await readLoanLedgerName(db, { get }, 'ledger-private', policy)).toBe(
    'LOAN-7',
  );
  get.mockResolvedValue(null);
  expect(await readLoanLedgerName(db, { get }, 'missing', policy)).toBeNull();
  get.mockRejectedValue(new Error('Storage failed'));
  await expect(
    readLoanLedgerName(db, { get }, 'broken', policy),
  ).rejects.toThrow('Storage failed');
});
