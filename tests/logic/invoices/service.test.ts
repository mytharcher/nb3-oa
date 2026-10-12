// @vitest-environment node
import { randomUUID } from 'node:crypto';
import { describe, expect, vi } from 'vitest';
import { databaseManagerToken } from '@nocobase/db';
import { auditServiceToken } from '../../../server/providers/audit/index.ts';
import {
  createInvoiceService,
  normalizeInvoiceNumber,
} from '../../../server/providers/invoices/service.ts';
import { createPlatformAppTest } from '../platform/helpers.ts';
const test = createPlatformAppTest();
const command = (documentId = randomUUID()) => ({
  documentId,
  actorId: 'finance-test',
  reason: 'Invoice test',
  requestKey: randomUUID(),
});
const line = (invoiceNumber = randomUUID(), cents = 100) => ({
  invoiceNumber,
  cents,
  lineId: randomUUID(),
  attachmentIds: [randomUUID()],
});
describe('global invoice reservations', () => {
  test('normalization preserves numeric identities and blocks whitespace/case/fullwidth bypass', () => {
    expect(
      normalizeInvoiceNumber(' ０００１２３４５６７８９０１２３４５６７ '),
    ).toBe('00012345678901234567');
    expect(normalizeInvoiceNumber(' ab\u200b - 001 ')).toBe('AB-001');
    expect(() => normalizeInvoiceNumber(' \u200b ')).toThrow();
    expect(() => normalizeInvoiceNumber('票据')).toThrow();
  });
  test('concurrent documents cannot occupy one normalized invoice and opposite swaps fail atomically', async ({
    app,
  }) => {
    const db = app.container.resolve(databaseManagerToken),
      service = createInvoiceService(
        db,
        app.container.resolve(auditServiceToken),
      );
    const a = {
        ...command(),
        applicantId: 'employee',
        lines: [line('AB-001')],
      },
      b = { ...command(), applicantId: 'other', lines: [line(' ab - 001 ')] };
    const result = await Promise.allSettled([
      db.transaction((tx) => service.reserveLines(a, tx)),
      db.transaction((tx) => service.reserveLines(b, tx)),
    ]);
    expect(result.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const owner = result[0].status === 'fulfilled' ? a : b;
    const other = {
      ...command(),
      applicantId: 'another',
      lines: [line('SECOND')],
    };
    await db.transaction((tx) => service.reserveLines(other, tx));
    const swaps = await Promise.allSettled([
      db.transaction((tx) =>
        service.reserveLines(
          {
            ...owner,
            requestKey: randomUUID(),
            lines: [{ ...owner.lines[0], invoiceNumber: 'SECOND' }],
          },
          tx,
        ),
      ),
      db.transaction((tx) =>
        service.reserveLines(
          {
            ...other,
            requestKey: randomUUID(),
            lines: [{ ...other.lines[0], invoiceNumber: 'AB-001' }],
          },
          tx,
        ),
      ),
    ]);
    expect(swaps.every((r) => r.status === 'rejected')).toBe(true);
    expect((await service.forDocument(owner.documentId))[0].number).toBe(
      'AB-001',
    );
    expect((await service.forDocument(other.documentId))[0].number).toBe(
      'SECOND',
    );
  });
  test('revision releases deleted lines, payment retains immutable evidence and stale replay never restores used or terminal documents', async ({
    app,
  }) => {
    const db = app.container.resolve(databaseManagerToken),
      audit = app.container.resolve(auditServiceToken),
      service = createInvoiceService(db, audit);
    const input = {
      ...command(),
      applicantId: 'employee',
      lines: [line(), line()],
    };
    await db.transaction((tx) => service.reserveLines(input, tx));
    const revised = {
      ...input,
      requestKey: randomUUID(),
      lines: [{ ...input.lines[0], cents: 101 }],
    };
    await db.transaction((tx) => service.reserveLines(revised, tx));
    const another = {
      ...command(),
      applicantId: 'employee',
      lines: [input.lines[1]],
    };
    await db.transaction((tx) => service.reserveLines(another, tx));
    const payment = command(input.documentId);
    await expect(
      db.transaction(async (tx) => {
        await service.useDocument(payment, tx);
        throw new Error('cash rollback');
      }),
    ).rejects.toThrow('cash rollback');
    expect((await service.forDocument(input.documentId))[0].state).toBe('held');
    const spy = vi
      .spyOn(audit, 'record')
      .mockRejectedValueOnce(new Error('audit failure'));
    await expect(
      db.transaction((tx) => service.useDocument(payment, tx)),
    ).rejects.toThrow('audit failure');
    spy.mockRestore();
    await db.transaction((tx) => service.useDocument(payment, tx));
    expect(
      (await db.transaction((tx) => service.reserveLines(revised, tx)))[0],
    ).toMatchObject({
      state: 'used',
      cents: 101,
      attachmentIds: input.lines[0].attachmentIds,
    });
    await expect(
      db.transaction((tx) =>
        service.reserveLines(
          {
            ...revised,
            requestKey: randomUUID(),
            lines: [{ ...revised.lines[0], cents: 102 }],
          },
          tx,
        ),
      ),
    ).rejects.toMatchObject({ code: 'INVOICE_DOCUMENT_TERMINAL' });
    await expect(
      db.transaction((tx) =>
        service.releaseDocument(command(input.documentId), tx),
      ),
    ).rejects.toMatchObject({ code: 'INVOICE_DOCUMENT_TERMINAL' });
    await db.transaction((tx) =>
      service.releaseDocument(command(another.documentId), tx),
    );
    await expect(
      db.transaction((tx) =>
        service.reserveLines({ ...another, requestKey: randomUUID() }, tx),
      ),
    ).rejects.toMatchObject({ code: 'INVOICE_DOCUMENT_TERMINAL' });
    const draft = command();
    await db.transaction((tx) => service.releaseDocument(draft, tx));
    await expect(
      db.transaction((tx) =>
        service.reserveLines(
          {
            ...draft,
            requestKey: randomUUID(),
            applicantId: 'employee',
            lines: [line()],
          },
          tx,
        ),
      ),
    ).rejects.toMatchObject({ code: 'INVOICE_DOCUMENT_TERMINAL' });
    const events = await db
      .connection()
      .repository('invoiceEvents')
      .findMany({ filter: { documentId: input.documentId } });
    expect(events.some((e) => e.kind === 'used')).toBe(true);
    await expect(
      db.transaction((tx) =>
        service.reserveLines(
          {
            ...command(),
            applicantId: 'employee',
            lines: [line('TOOBIG', Number.MAX_SAFE_INTEGER), line('EXTRA', 1)],
          },
          tx,
        ),
      ),
    ).rejects.toMatchObject({ code: 'INVOICE_INVALID_AMOUNT' });
  });
});
