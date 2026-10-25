type Dataset =
  | 'budget-balances'
  | 'contract-ledger'
  | 'headcount-balances'
  | 'leave-monthly';
export type ReportDataset =
  | Dataset
  | 'leave-approval-efficiency'
  | 'expense-summary'
  | 'supply-ledger'
  | 'seal-ledger';

export function reportTitle(dataset: ReportDataset) {
  return dataset === 'expense-summary'
    ? 'reportsExpense.title'
    : dataset === 'leave-approval-efficiency'
      ? 'reportsEfficiency.title'
      : `reports.datasets.${dataset}.title`;
}

export function reportDescription(dataset: ReportDataset) {
  return dataset === 'expense-summary'
    ? 'reportsExpense.description'
    : dataset === 'leave-approval-efficiency'
      ? 'reportsEfficiency.description'
      : `reports.datasets.${dataset}.description`;
}
