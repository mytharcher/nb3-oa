const inProgressStates = new Set([
  'hrbp',
  'hrDirector',
  'legal',
  'financeManager',
  'stamping',
  'returning',
  'returnException',
  'dispatch',
  'usage',
  'manager',
  'sourceHead',
  'targetHead',
  'pendingEffective',
  'cancellationReview',
  'head',
  'hr',
  'extra',
  'issuing',
  'booking',
  'unbooking',
  'cashier',
  'finance',
  'executive',
  'cfo',
  'gm',
]);

/** Preserve the workbench's business categories independently of index status. */
export function applicationCategory(state: string) {
  if (state === 'draft') return 'drafts';
  if (state === 'revision' || state === 'exception') return 'revisions';
  return inProgressStates.has(state) ? 'inProgress' : 'other';
}
