/** Built-in OA schedules translate at render time; unknown schedules retain their supplied title. */
const titleKeys: Readonly<Record<string, string>> = {
  'oa.annual-leave.daily-reconciliation': 'annualLeave',
  'oa.assets.borrow-reminders': 'assetBorrow',
  'oa.departure.daily-execution': 'departure',
  'oa.probation.daily-reconciliation': 'probation',
  'oa.seals.return-reminders': 'sealReturn',
  'oa.vendor-qualification.expiry': 'vendorQualification',
  'oa.expense-authorizations.expire': 'expenseAuthorization',
  'oa.loanRequests.reminders': 'loan',
};

export function scheduleTitle(
  item: { readonly key: string; readonly title: string },
  translate: (key: string) => string,
): string {
  const key = titleKeys[item.key];
  return key ? translate(`page.scheduleNames.${key}`) : item.title;
}
