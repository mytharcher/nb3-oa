import type { Application } from '@nocobase/app-server/application';
import { databaseManagerToken } from '@nocobase/db';
import { scenarios } from '../../../cli/commands/lib/trial-data/scenarios.js';
import { cloneScenario } from '../../../cli/commands/lib/trial-data/follow-ups.js';
import {
  advance,
  populateScenario,
  performOffered,
  trialPdf,
  type ScenarioResult,
  type TrialSessions,
} from '../../../cli/commands/lib/trial-data/engine.js';
import { dataOf, recordOf } from '../../../cli/commands/lib/trial-data/http.js';
import type { TrialFacts } from '../../../cli/commands/lib/trial-data/bootstrap.js';
import { currentDemo } from './context.js';

/** Completed connected stories complement the live approval examples. */
export async function completedStories(
  app: Application,
  sessions: TrialSessions,
  f: TrialFacts,
  saved: Record<string, ScenarioResult>,
  checkpoint: (r: ScenarioResult) => Promise<void>,
) {
  const scope = currentDemo()!,
    en = scope.locale === 'en-US',
    db = app.container.resolve(databaseManagerToken);
  const catalog = scenarios(f);
  const scene = (
    source: string,
    key: string,
    role: 'purchasing' | 'cashier' | 'admin' | 'hr' | 'sealKeeper',
  ) =>
    cloneScenario(
      catalog.find((s) => s.key === source)!,
      key,
      { stopAt: role },
    );
  const refresh = async (r: ScenarioResult) => {
    const record = recordOf(
      await sessions[r.actor].request(`${r.path}/${r.id}`),
    );
    const result = { ...r, status: String(record.status) };
    await checkpoint(result);
    return result;
  };
  const claim = async (
    role: keyof TrialSessions,
    r: ScenarioResult,
    suffix = 'action',
  ) => {
    try {
      await performOffered(
        sessions[role],
        r.path,
        r.id,
        'claim',
        undefined,
        undefined,
        suffix,
      );
    } catch (error) {
      if (!(
        error instanceof Error &&
        error.message.includes('no current claim offer')
      ))
        throw error;
    }
  };
  const purchase = scene('purchase-head', 'purchase-delivered', 'purchasing');
  purchase.body.estimatedCents = 118000;
  purchase.body.expectedDate = scope.baseDate;
  let bought = await populateScenario(
    app,
    sessions,
    f,
    purchase,
    saved[purchase.key],
  );
  if (bought.status === 'purchasing') {
    await claim('purchasing', bought);
    await performOffered(
      sessions.purchasing,
      bought.path,
      bought.id,
      'complete',
      { actualCents: 118000, selectedVendorId: f.vendorId, quotes: [] },
    );
  }
  await advance(
    sessions,
    { ...purchase, stopAt: undefined, complete: true },
    bought.id,
  );
  bought = await refresh(bought);
  const detail = dataOf(
    await sessions.employee.request(`${bought.path}/${bought.id}`),
  );
  const order = detail.order as {
    id: string;
    version: number;
    status: string;
  } | null;
  if (!order?.id) throw new Error('DEMO_ORDER_MISSING');
  if (order.status === 'awaitingReceipt')
    await sessions.employee.request(`/purchaseOrders/${order.id}/accept`, {
      version: order.version,
      receiptDate: scope.baseDate,
      requestKey: `${scope.id}-order-receipt`,
      reason: en
        ? 'Equipment delivered and checked against the order.'
        : '设备已交付，按采购订单清点验收。',
    });
  const accepted = recordOf(
    await sessions.employee.request(`/purchaseOrders/${order.id}`),
  );
  await checkpoint({
    key: 'purchase-order-delivered',
    title: en ? 'Equipment delivery and receipt' : '办公设备交付验收',
    path: '/purchaseOrders',
    id: order.id,
    status: String(accepted.status),
    actor: 'employee',
  });

  const payment = scene('payment-head', 'payment-order-paid', 'cashier');
  Object.assign(payment.body, {
    sourceMode: 'purchase',
    purchaseOrderId: order.id,
    noPriorApprovalReason: '',
    amountCents: 118000,
    invoiceNumber: `${scope.id}-ORDER-INVOICE`,
  });
  let paid = await populateScenario(
    app,
    sessions,
    f,
    payment,
    saved[payment.key],
  );
  if (paid.status === 'cashier') {
    await claim('cashier', paid);
    const voucher = recordOf(
      await sessions.cashier.upload(
        '/paymentAttachments/uploadOne',
        trialPdf(),
        {
          'x-payment-request-id': paid.id,
          'x-payment-file-purpose': 'voucher',
        },
      ),
    );
    await performOffered(sessions.cashier, paid.path, paid.id, 'complete', {
      voucherNumber: `DEMO-${scope.id.slice(-8)}-001`,
      voucherAttachments: [voucher.id],
    });
  }
  paid = await refresh(paid);
  if (paid.status !== 'paid') throw new Error('DEMO_PAYMENT_NOT_PAID');

  const asset = scene('asset-use', 'asset-issued-complete', 'admin');
  asset.body.assetIds = [f.assetIds[4]];
  let issued = await populateScenario(
    app,
    sessions,
    f,
    asset,
    saved[asset.key],
  );
  if (issued.status === 'issuing') {
    await claim('admin', issued);
    const unit = await db
      .repository('assets')
      .findOne({ filter: { id: f.assetIds[4] } });
    if (typeof unit?.serialNumber !== 'string')
      throw new Error('DEMO_ASSET_SERIAL_MISSING');
    await performOffered(sessions.admin, issued.path, issued.id, 'complete', {
      units: [{ assetId: f.assetIds[4], serialNumber: unit.serialNumber }],
    });
  }
  issued = await refresh(issued);
  if (issued.status !== 'issued') throw new Error('DEMO_ASSET_NOT_ISSUED');

  const supply = scene('supply-head', 'supply-issued-complete', 'admin');
  let supplied = await populateScenario(
    app,
    sessions,
    f,
    supply,
    saved[supply.key],
  );
  if (supplied.status === 'issuing') {
    await claim('admin', supplied);
    await performOffered(
      sessions.admin,
      supplied.path,
      supplied.id,
      'complete',
    );
  }
  supplied = await refresh(supplied);
  if (supplied.status !== 'issued') throw new Error('DEMO_SUPPLIES_NOT_ISSUED');

  const certificate = scene(
    'certificate-head',
    'certificate-issued-complete',
    'hr',
  );
  let certified = await populateScenario(
    app,
    sessions,
    f,
    certificate,
    saved[certificate.key],
  );
  if (certified.status !== 'issued') {
    await claim('hr', certified, 'actions');
    const template = await db
      .repository('printTemplates')
      .findOne({ filter: { id: saved['print-certificates'].id } });
    const prepared = dataOf(
      await sessions.hr.request(`${certified.path}/${certified.id}/prepare`, {
        templateId: template!.id,
        revisionId: template!.currentRevisionId,
        issueDate: scope.baseDate,
        requestKey: `${scope.id}-certificate-preparation`,
      }),
    );
    await sessions.hr.request(
      `/certificatePreparations/${String(prepared.id)}/generate`,
      {},
    );
    await performOffered(
      sessions.hr,
      certified.path,
      certified.id,
      'complete',
      { preparationId: prepared.id },
      undefined,
      'actions',
    );
  }
  certified = await refresh(certified);
  if (certified.status !== 'issued')
    throw new Error('DEMO_CERTIFICATE_NOT_ISSUED');
  const seal = scene('seal-head', 'seal-completed', 'sealKeeper');
  let stamped = await populateScenario(app, sessions, f, seal, saved[seal.key]);
  if (stamped.status === 'stamping') {
    await claim('sealKeeper', stamped, 'actions');
    const instance = await db
      .repository('seals')
      .findOne({ filter: { code: `${scope.id}-seal` } });
    if (typeof instance?.id !== 'string') throw new Error('DEMO_SEAL_MISSING');
    await performOffered(
      sessions.sealKeeper,
      stamped.path,
      stamped.id,
      'complete',
      {
        sealId: instance.id,
        actualCopies: 2,
        sealedAt: new Date().toISOString(),
        borrowedAt: null,
        returnedAt: null,
      },
      undefined,
      'actions',
    );
  }
  stamped = await refresh(stamped);
  if (stamped.status !== 'completed')
    throw new Error('DEMO_SEAL_NOT_COMPLETED');
  // Ensure the source order checkpoint reflects subsequent payment counters.
  const finalOrder = recordOf(
    await sessions.employee.request(`/purchaseOrders/${order.id}`),
  );
  await checkpoint({
    ...saved['purchase-order-delivered'],
    status: String(finalOrder.status),
  });
}
