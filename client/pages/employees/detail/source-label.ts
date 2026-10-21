/** Translate the business origin without exposing its internal record reference. */
export function employeeSourceKey(source: string | null): string | null {
  if (!source) return null;
  const kind = /^oa\.(onboarding|departure|transfer|probation)(?=:)/.exec(
    source,
  )?.[1];
  return `employees.history.sources.${kind ?? 'other'}`;
}
