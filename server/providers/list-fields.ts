import { RepositoryError, type RepositoryPolicy } from '@nocobase/db';

/** Intersect a fixed list whitelist with field visibility for APIs that allow partial rows.
 * Keep the original repository policy for record scope and authorization enforcement.
 */
export function readableListFields<T extends string>(
  fields: readonly T[],
  policy: RepositoryPolicy,
): T[] {
  const read = policy.read;
  const selected =
    read === true
      ? [...fields]
      : read && Array.isArray(read.fields)
        ? fields.filter((field) => read.fields && read.fields.includes(field))
        : [];
  // An empty projection becomes SELECT * in the SQL adapter. Fail before querying.
  if (selected.length === 0) {
    throw new RepositoryError(
      'FIELD_READ_FORBIDDEN',
      'No list fields are readable.',
    );
  }
  return selected;
}
