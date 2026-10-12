import { ApiClientError } from '@nocobase/app-client';
export function violationPaths(error: unknown): string[] {
  if (!(error instanceof ApiClientError)) return [];
  const payload = error.payload as
    { error?: { fieldViolations?: { field?: string }[] } } | undefined;
  return (payload?.error?.fieldViolations ?? [])
    .map((v) => v.field)
    .filter((v): v is string => !!v);
}
export function reasonOf(error: unknown) {
  return error instanceof ApiClientError ? error.reason : undefined;
}

export function violations(error: unknown): string[] {
  return violationPaths(error).map((v) => v.split('.').at(-1)!);
}
export function actionField(
  path: string,
):
  | 'comment'
  | 'person'
  | 'appraisalOpinion'
  | 'mode'
  | 'place'
  | `serials.${number}`
  | undefined {
  const normalized = path.replace(/\[(\d+)\]/g, '.$1');
  const serial = normalized.match(/(?:^|\.)units\.(\d+)\.serialNumber$/);
  if (serial) return `serials.${Number(serial[1])}`;
  const leaf = normalized.split('.').at(-1);
  if (leaf === 'reason' || leaf === 'comment') return 'comment';
  if (leaf === 'to' || leaf === 'person') return 'person';
  if (leaf === 'appraisalOpinion' || leaf === 'mode' || leaf === 'place')
    return leaf;
  return undefined;
}
