import { describe, it, expect, beforeEach } from 'vitest';
import {
  centsOf,
  money,
  decimalOf,
  validateProposal,
  needsLegalOpinion,
} from '../../../client/pages/contracts/model.js';
import {
  keyOf,
  loadCommand,
  saveCommand,
  clearOtherActors,
  clearActor,
} from '../../../client/pages/contracts/journal.js';
import {
  EMPTY,
  completeRecord,
  proposalOf,
  type ContractDetail,
} from '../../../client/pages/contracts/types.js';
import { sourcePath } from '../../../client/pages/contracts/breadcrumb.js';
import { validFile } from '../../../client/pages/contracts/file-model.js';
describe('contract proposal safety', () => {
  it('uses exact integer decimal conversion and rejects rounding or overflow', () => {
    expect(centsOf('100.01')).toBe(10001);
    expect(centsOf('0.01')).toBe(1);
    expect(centsOf('90071992547409.91')).toBe(Number.MAX_SAFE_INTEGER);
    for (const value of ['1.001', '1e2', '-1', '90071992547409.92'])
      expect(centsOf(value)).toBeNull();
    expect(decimalOf(10001)).toBe('100.01');
    expect(money(Number.MAX_SAFE_INTEGER, 'en-US')).toBe(
      '90,071,992,547,409.91',
    );
  });
  it('rejects incomplete proposal replacement and never copies SDK data', () => {
    expect(
      completeRecord({
        ...EMPTY,
        operation: 'new',
        contractId: 'c',
        baseVersion: 0,
        lifecycleVersion: 1,
      }),
    ).toBe(true);
    const partial = { ...EMPTY };
    delete (partial as Partial<typeof partial>).reason;
    expect(completeRecord(partial)).toBe(false);
    expect(
      proposalOf({ ...EMPTY, secret: 'hidden' } as typeof EMPTY),
    ).not.toHaveProperty('secret');
  });
  it('allows a draft without text but requires full submit evidence and real calendar dates', () => {
    const proposal = {
      ...EMPTY,
      contractType: 'sales',
      counterparty: { kind: 'customer' as const, name: 'Customer' },
      startsOn: '2026-10-01',
      endsOn: '2026-10-31',
    };
    expect(validateProposal(proposal, '1.00')).toEqual({});
    expect(validateProposal(proposal, '1.00', true)).toEqual({
      paymentTerms: 'required',
      reason: 'required',
      textVersionId: 'textRequired',
    });
    expect(
      validateProposal({ ...proposal, startsOn: '2026-02-30' }, '1'),
    ).toHaveProperty('startsOn');
    expect(
      validateProposal({ ...proposal, endsOn: '2026-09-30' }, '1'),
    ).toHaveProperty('endsOn', 'dateInvalid');
  });
  it('requires the original legal seat, excluding finance and added signer opinions', () => {
    const make = (order: number, depth = 0, via = 'plan') =>
      ({
        runs: [
          {
            tasks: [
              {
                id: 't',
                stage: 'legalFinance',
                order,
                depth,
                via,
                kind: 'decide',
              },
            ],
          },
        ],
      }) as unknown as ContractDetail;
    expect(needsLegalOpinion(make(0), 't')).toBe(true);
    expect(needsLegalOpinion(make(1), 't')).toBe(false);
    expect(needsLegalOpinion(make(0, 1, 'addSigner'), 't')).toBe(false);
  });
  it('validates purpose, actual MIME/extension and size before upload', () => {
    expect(
      validFile(
        new File(['pdf'], 'a.pdf', { type: 'application/pdf' }),
        'text',
      ),
    ).toBe(true);
    expect(
      validFile(new File(['png'], 'a.png', { type: 'image/png' }), 'text'),
    ).toBe(false);
    expect(
      validFile(new File(['png'], 'a.png', { type: 'image/png' }), 'evidence'),
    ).toBe(true);
    expect(
      validFile(new File(['png'], 'a.pdf', { type: 'image/png' }), 'evidence'),
    ).toBe(false);
    expect(
      validFile(new File([], 'a.pdf', { type: 'application/pdf' }), 'text'),
    ).toBe(false);
  });
});
describe('actor-scoped uncertain command journal', () => {
  beforeEach(() => sessionStorage.clear());
  it('restores the exact body after remount and refuses another actor', () => {
    const key = keyOf(
        'owner',
        '/approvals/done/contract/1/action/approve/t',
        'action',
      ),
      command = {
        actorId: 'owner',
        path: 'contractRequests/1/action',
        body: {
          requestId: 'original',
          contentHash: 'seen',
          comment: 'original reason',
          input: { data: { nonStandard: true } },
        },
      };
    saveCommand(key, command);
    expect(loadCommand(key, 'owner')).toEqual(command);
    expect(loadCommand(key, 'other')).toBeNull();
  });
  it('clears private envelopes when identity or access changes', () => {
    const old = keyOf('old', '/a', 'edit'),
      current = keyOf('current', '/a', 'edit');
    saveCommand(old, {
      actorId: 'old',
      path: 'x',
      body: { requestId: 'key', private: 'secret' },
    });
    saveCommand(current, {
      actorId: 'current',
      path: 'x',
      body: { requestId: 'key' },
    });
    clearOtherActors('current');
    expect(sessionStorage.getItem(old)).toBeNull();
    expect(loadCommand(current, 'current')).not.toBeNull();
    clearActor('current');
    expect(loadCommand(current, 'current')).toBeNull();
  });
});

it('keeps nested ledger and nondefault approval views as their own record sources', () => {
  expect(sourcePath('/contracts/contractLedger/id/newContract')).toBe(
    '/contracts/contractLedger/id',
  );
  expect(sourcePath('/contracts/contractLedger/id/contract/request/edit')).toBe(
    '/contracts/contractLedger/id',
  );
  expect(
    sourcePath('/approvals/done/contract/request/action/approve/task'),
  ).toBe('/approvals/done');
});
