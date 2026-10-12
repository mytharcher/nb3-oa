type Translate = (key: string, options?: Record<string, unknown>) => string;
const ACTIONS = [
  'claim',
  'release',
  'assign',
  'complete',
  'unable',
  'forceComplete',
];
const STATES = ['issuing', 'exception', 'issued', 'forcedClosed'];
export function supplyActionLabel(name: string, t: Translate) {
  return t(
    ACTIONS.includes(name) ? `supplies.actions.${name}` : `approvals.${name}`,
  );
}
export function supplyStateLabel(state: string, t: Translate) {
  return t(
    STATES.includes(state)
      ? `supplies.states.${state}`
      : state === 'extra'
        ? 'general.extraStage'
        : `approvals.states.${state}`,
  );
}
export function supplyApprovalWord(
  key: string,
  t: Translate,
  options?: Record<string, unknown>,
) {
  if (
    key.startsWith('approval.actions.') &&
    ACTIONS.includes(key.slice('approval.actions.'.length))
  )
    return supplyActionLabel(key.slice('approval.actions.'.length), t);
  if (key === 'approval.policies.oa.supplyIssuing')
    return t('supplies.issuingStage');
  return t(key, options);
}
