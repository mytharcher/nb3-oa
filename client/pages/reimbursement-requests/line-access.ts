interface FinanceCorrection {
  status: string;
  financeCorrectionLines: readonly { id: string }[];
  financeLineFacts: Readonly<
    Record<string, { outcome: 'approved' | 'returned' | 'pending' }>
  >;
}
/** A finance return grants editing only to explicitly returned original lines.
 * Unknown or missing facts never grant permission. Server validation remains authoritative. */
export function lineAccess(
  record: FinanceCorrection | undefined,
  lineId: string,
) {
  const correcting =
    record?.status === 'revision' && record.financeCorrectionLines.length > 0;
  if (!correcting) return { editable: true, removable: true, addable: true };
  const original = record.financeCorrectionLines.some(
    (line) => line.id === lineId,
  );
  const returned =
    original && record.financeLineFacts[lineId]?.outcome === 'returned';
  return { editable: returned, removable: returned, addable: false };
}
