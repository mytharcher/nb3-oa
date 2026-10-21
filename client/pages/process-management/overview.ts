/** Definition diagrams explain forward business progress, not every lifecycle operation.
 * Audited against all registered process owners. New fulfillment actions must opt in;
 * auxiliary actions appear only in actual execution history. */
const progressActions = new Set([
  'submit',
  'approved',
  'issued',
  'booked',
  'unbooked',
  'paid',
  'cashCompleted',
  'priced',
  'dispatched',
  'registered',
  'appraised',
  'issueCompleted',
  'returnCompleted',
  'stamped',
  'returnedPhysical',
  'execute',
  'settle',
  'historicalEntry',
]);
const auxiliaryStates = new Set([
  'revision',
  'exception',
  'rejected',
  'withdrawn',
  'terminated',
  'cancelled',
  'forcedClosed',
]);
export function isProcessOverviewEdge(edge: {
  name: string;
  from: string;
  to: string;
}): boolean {
  const isProgress =
    progressActions.has(edge.name) ||
    (edge.name.endsWith('Approved') &&
      !['cancelApproved', 'cancellationApproved'].includes(edge.name));
  return (
    isProgress &&
    edge.from !== edge.to &&
    edge.to !== 'draft' &&
    ![edge.from, edge.to].some(
      (state) => auxiliaryStates.has(state) || /Exception$/.test(state),
    )
  );
}
