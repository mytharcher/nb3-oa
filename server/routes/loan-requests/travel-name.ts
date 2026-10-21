import type { RepositoryPolicy } from '@nocobase/db';
import type { TravelService } from '../../providers/travel/service.js';

/** Missing optional source access must not hide the loan itself. */
export async function readLoanTravelName(
  service: Pick<TravelService, 'names'>,
  id: string | null,
  _actorId: string,
  policy: RepositoryPolicy | undefined,
): Promise<string | null> {
  const read = policy?.read;
  if (
    !id ||
    !read ||
    (read !== true &&
      (!Array.isArray(read.fields) ||
        !read.fields.includes('id') ||
        !read.fields.includes('number')))
  )
    return null;
  return (await service.names([id], policy)).get(id) ?? null;
}
