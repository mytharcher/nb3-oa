import { randomUUID } from 'node:crypto';
import type { DatabaseConnection, DatabaseManager } from '@nocobase/db';
import type { AuditService } from '../audit/index.js';
import type { Invoice, InvoiceCommand, InvoiceService } from './contract.js';
export class InvoiceError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
  }
}
function fail(code: string, message: string): never {
  throw new InvoiceError(`INVOICE_${code}`, message);
}
/** Includes numeric 20-digit e-invoices and legacy/other receipt tokens; leading zeros and punctuation remain meaningful. */
export function normalizeInvoiceNumber(value: string): string {
  const normalized = value
    .normalize('NFKC')
    .replace(/[\p{White_Space}\u200B-\u200D\uFEFF]/gu, '')
    .toUpperCase();
  if (!/^[A-Z0-9][A-Z0-9._:/-]{0,63}$/.test(normalized))
    fail(
      'INVALID_NUMBER',
      'Use a nonempty invoice number or supported ASCII receipt token.',
    );
  return normalized;
}
interface Doc {
  id: string;
  applicantId: string | null;
  state: 'held' | 'used' | 'released';
  version: number;
}
const invoice = (v: Invoice): Invoice => ({
  ...v,
  cents: Number(v.cents),
  attachmentIds: v.attachmentIds ?? [],
});
function validate(input: InvoiceCommand) {
  if (
    !input.documentId ||
    input.documentId.length > 64 ||
    !input.actorId ||
    input.actorId.length > 64 ||
    !input.reason?.trim() ||
    input.reason.length > 4000 ||
    !input.requestKey ||
    input.requestKey.length > 255
  )
    fail(
      'INVALID_COMMAND',
      'A business document, actor, reason and request key are required.',
    );
}
export function createInvoiceService(
  db: DatabaseManager,
  audit: AuditService,
): InvoiceService {
  async function forDocument(documentId: string, tx = db.connection()) {
    return (
      await tx.repository<Invoice>('invoices').findMany({
        filter: { documentId },
        sort: (s) => s.field('number').asc(),
      })
    ).map(invoice);
  }
  async function lockDocument(
    input: InvoiceCommand,
    tx: DatabaseConnection,
    applicantId?: string,
    allowEmpty = false,
  ) {
    const repo = tx.repository<Doc>('invoiceDocuments');
    let r = await repo.updateMany({
      filter: { id: input.documentId },
      values: { version: { increment: 1 } },
    });
    if (!r.updatedCount) {
      if (!applicantId && !allowEmpty)
        fail('DOCUMENT_NOT_FOUND', 'No invoice reservation document exists.');
      try {
        await tx.transaction(async (savepoint) => {
          await savepoint.repository<Doc>('invoiceDocuments').createOne({
            values: {
              id: input.documentId,
              applicantId: applicantId ?? null,
              state: 'held',
              version: 1,
            },
          });
        });
      } catch (error) {
        r = await repo.updateMany({
          filter: { id: input.documentId },
          values: { version: { increment: 1 } },
        });
        if (!r.updatedCount) throw error;
      }
    }
    const doc = (await repo.findOne({ filter: { id: input.documentId } }))!;
    if (applicantId && doc.state === 'held' && doc.applicantId !== applicantId)
      fail(
        'APPLICANT_CONFLICT',
        'The invoice document applicant is immutable.',
      );
    return doc;
  }
  async function op(
    input: InvoiceCommand,
    kind: string,
    payload: unknown,
    tx: DatabaseConnection,
  ) {
    const repo = tx.repository('invoiceOperations'),
      fingerprint = JSON.stringify({
        kind,
        payload,
        actorId: input.actorId,
        reason: input.reason,
      }),
      old = await repo.findOne({
        filter: { documentId: input.documentId, requestKey: input.requestKey },
      });
    if (old) {
      if (old.fingerprint !== fingerprint)
        fail(
          'IDEMPOTENCY_CONFLICT',
          'This request key already identifies another invoice operation.',
        );
      return true;
    }
    await repo.createOne({
      values: {
        id: randomUUID(),
        documentId: input.documentId,
        requestKey: input.requestKey,
        fingerprint,
      },
    });
    return false;
  }
  async function lockNumber(number: string, tx: DatabaseConnection) {
    const repo = tx.repository<Invoice>('invoices');
    let r = await repo.updateMany({
      filter: { number },
      values: { version: { increment: 1 } },
    });
    if (!r.updatedCount) {
      try {
        await tx.transaction(async (savepoint) => {
          await savepoint.repository<Invoice>('invoices').createOne({
            values: {
              id: randomUUID(),
              number,
              state: 'available',
              documentId: null,
              lineId: null,
              applicantId: null,
              cents: 0,
              attachmentIds: [],
              version: 1,
            },
          });
        });
      } catch (error) {
        r = await repo.updateMany({
          filter: { number },
          values: { version: { increment: 1 } },
        });
        if (!r.updatedCount) throw error;
      }
    }
    return invoice((await repo.findOne({ filter: { number } }))!);
  }
  async function write(
    before: Invoice,
    values: Partial<Invoice>,
    kind: string,
    input: InvoiceCommand,
    tx: DatabaseConnection,
  ) {
    const after = invoice(
      (
        await tx
          .repository<Invoice>('invoices')
          .updateOne({ filter: { id: before.id }, values: { ...values } })
      ).record,
    );
    await tx.repository('invoiceEvents').createOne({
      values: {
        id: randomUUID(),
        invoiceId: before.id,
        documentId: input.documentId,
        lineId: values.lineId ?? before.lineId ?? '',
        kind,
        actorId: input.actorId,
        reason: input.reason.trim(),
        requestKey: input.requestKey,
        before: { ...before },
        after: { ...after },
        at: new Date(),
      },
    });
    await audit.record(
      {
        actorId: input.actorId,
        action: `invoice.${kind}`,
        targetType: 'invoices',
        targetId: before.id,
        before,
        after,
        reason: input.reason,
      },
      tx,
    );
    return after;
  }
  async function terminal(
    input: InvoiceCommand,
    state: 'used' | 'released',
    connection: DatabaseConnection,
  ) {
    validate(input);
    return connection.transaction(async (tx) => {
      const doc = await lockDocument(
        input,
        tx,
        undefined,
        state === 'released',
      );
      if (await op(input, state, {}, tx))
        return forDocument(input.documentId, tx);
      if (doc.state === state) return forDocument(input.documentId, tx);
      if (doc.state !== 'held')
        fail(
          'DOCUMENT_TERMINAL',
          'This invoice document is terminal and cannot change.',
        );
      const owned = await forDocument(input.documentId, tx);
      for (const row of [...owned].sort((a, b) =>
        a.number < b.number ? -1 : a.number > b.number ? 1 : 0,
      )) {
        const locked = await lockNumber(row.number, tx);
        if (locked.state !== 'held' || locked.documentId !== input.documentId)
          fail('OWNERSHIP_CHANGED', 'The reserved invoice ownership changed.');
        await write(
          locked,
          state === 'used'
            ? { state: 'used' }
            : {
                state: 'available',
                documentId: null,
                lineId: null,
                applicantId: null,
                cents: 0,
                attachmentIds: [],
              },
          state,
          input,
          tx,
        );
      }
      await tx
        .repository<Doc>('invoiceDocuments')
        .updateOne({ filter: { id: input.documentId }, values: { state } });
      await audit.record(
        {
          actorId: input.actorId,
          action: `invoiceDocument.${state}`,
          targetType: 'invoiceDocuments',
          targetId: input.documentId,
          before: doc,
          after: { ...doc, state },
          reason: input.reason,
        },
        tx,
      );
      return forDocument(input.documentId, tx);
    });
  }
  return {
    forDocument,
    async reserveLines(input, connection) {
      validate(input);
      if (
        !input.applicantId ||
        input.applicantId.length > 64 ||
        !input.lines.length ||
        input.lines.length > 1000
      )
        fail(
          'INVALID_LINES',
          'An applicant and 1–1000 invoice lines are required.',
        );
      let total = 0n;
      const lines = input.lines
        .map((line) => {
          if (
            !line.lineId ||
            line.lineId.length > 64 ||
            !Number.isSafeInteger(line.cents) ||
            line.cents <= 0 ||
            !line.attachmentIds.length ||
            line.attachmentIds.some((id) => !id || id.length > 64)
          )
            fail(
              'INVALID_LINE',
              'Each line needs a stable id, positive integer cents and linked evidence.',
            );
          total += BigInt(line.cents);
          return {
            ...line,
            invoiceNumber: normalizeInvoiceNumber(line.invoiceNumber),
            attachmentIds: [...new Set(line.attachmentIds)].sort(),
          };
        })
        .sort((a, b) => a.invoiceNumber.localeCompare(b.invoiceNumber));
      if (total > BigInt(Number.MAX_SAFE_INTEGER))
        fail('INVALID_AMOUNT', 'The invoice total exceeds safe integer cents.');
      if (
        new Set(lines.map((l) => l.invoiceNumber)).size !== lines.length ||
        new Set(lines.map((l) => l.lineId)).size !== lines.length
      )
        fail(
          'DUPLICATE_LINE',
          'Invoice numbers and line ids must be unique within a document.',
        );
      return connection.transaction(async (tx) => {
        const doc = await lockDocument(input, tx, input.applicantId);
        if (
          await op(
            input,
            'reserve',
            { applicantId: input.applicantId, lines },
            tx,
          )
        )
          return forDocument(input.documentId, tx);
        if (doc.state !== 'held')
          fail(
            'DOCUMENT_TERMINAL',
            'Paid or released invoice documents cannot reserve again.',
          );
        const old = await forDocument(input.documentId, tx);
        // Lock the complete union in one global order, including deleted/replaced invoices, before any ownership write.
        const numbers = [
          ...new Set([
            ...old.map((i) => i.number),
            ...lines.map((l) => l.invoiceNumber),
          ]),
        ].sort();
        const locked = new Map<string, Invoice>();
        for (const number of numbers)
          locked.set(number, await lockNumber(number, tx));
        for (const line of lines) {
          const row = locked.get(line.invoiceNumber)!;
          if (
            row.state === 'used' ||
            (row.state === 'held' &&
              (row.documentId !== input.documentId ||
                row.lineId !== line.lineId))
          )
            fail(
              'ALREADY_OCCUPIED',
              'This invoice is already reserved or used by another line.',
            );
        }
        for (const prior of old)
          if (!lines.some((l) => l.invoiceNumber === prior.number)) {
            const row = locked.get(prior.number)!;
            if (row.state !== 'held')
              fail('DOCUMENT_TERMINAL', 'A used invoice cannot be removed.');
            await write(
              row,
              {
                state: 'available',
                documentId: null,
                lineId: null,
                applicantId: null,
                cents: 0,
                attachmentIds: [],
              },
              'released',
              input,
              tx,
            );
          }
        for (const line of lines) {
          const row = locked.get(line.invoiceNumber)!;
          await write(
            row,
            {
              state: 'held',
              documentId: input.documentId,
              lineId: line.lineId,
              applicantId: input.applicantId,
              cents: line.cents,
              attachmentIds: line.attachmentIds,
            },
            'held',
            input,
            tx,
          );
        }
        return forDocument(input.documentId, tx);
      });
    },
    useDocument: (input, tx) => terminal(input, 'used', tx),
    releaseDocument: (input, tx) => terminal(input, 'released', tx),
  };
}
