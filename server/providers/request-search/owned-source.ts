import type { Application } from '@nocobase/app-server/application';
import { databaseManagerToken, type RepositoryPolicy } from '@nocobase/db';
import {
  requestSearchRegistryToken,
  type RequestSearchSource,
} from './contract.js';

/** Matches beyond this skip the expansion; the source's own fields still match. */
export const searchExpansionLimit = 500;
export function readableSearchField(policy: RepositoryPolicy, field: string) {
  if (!policy.read) return false;
  if (policy.read === true) return true;
  const fields = policy.read.fields;
  return (
    fields !== false &&
    (!Array.isArray(fields) || fields.includes('*') || fields.includes(field))
  );
}
/** Called only by the owning provider. The public registry never accepts a
 * collection or field name from HTTP; each module owns this fixed projection. */
export function registerOwnedRequestSearch(
  app: Application,
  definition: {
    kind: string;
    resource?: string;
    collection: string;
    titleField: string;
    applicantField?: string;
    titleType?: 'string' | 'text';
    numberField?: string | null;
    validate: RequestSearchSource['validate'];
    relatedNumber?: {
      referenceField: string;
      matchingRequestIds(query: string): Promise<string[]>;
      value(
        record: Record<string, string | null | undefined>,
      ): Promise<string | null>;
    };
  },
) {
  const database = app.container.resolve(databaseManagerToken);
  const applicantField = definition.applicantField ?? 'applicantId';
  app.container.resolve(requestSearchRegistryToken).register({
    kind: definition.kind,
    resource: definition.resource ?? definition.kind,
    collection: definition.collection,
    validate: definition.validate,
    async reportingCandidates({
      before,
      applicantIds,
      afterId,
      limit,
      policy,
    }) {
      if (
        !['id', applicantField, 'createdAt'].every((field) =>
          readableSearchField(policy, field),
        )
      )
        return [];
      if (applicantIds?.length === 0) return [];
      const numberField =
        definition.numberField === undefined
          ? 'number'
          : definition.numberField;
      const number =
        numberField && readableSearchField(policy, numberField)
          ? numberField
          : null;
      const rows = await database
        .repository<Record<string, string | null>>(definition.collection)
        .withPolicy(policy)
        .findMany({
          select: (s) =>
            s.fields('id', applicantField, ...(number ? [number] : [])),
          filter: (f) =>
            f.and([
              f.date('createdAt').before(before),
              ...(applicantIds
                ? [
                    f.or(
                      applicantIds.map((id) => f.string(applicantField).eq(id)),
                    ),
                  ]
                : []),
            ]),
          sort: (s) => s.field('id').desc(),
          cursor: afterId ? { id: afterId } : undefined,
          direction: afterId ? 'forward' : undefined,
          limit,
        });
      return rows.map((row) => ({
        id: String(row.id),
        kind: definition.kind,
        applicantId: String(row[applicantField]),
        number: number ? (row[number] ?? null) : null,
        title: null,
      }));
    },
    async candidates({
      query,
      applicantIds,
      afterId,
      limit,
      policy,
      onSkippedMatch,
    }) {
      if (!readableSearchField(policy, 'id')) return [];
      const numberField =
        definition.numberField === undefined
          ? 'number'
          : definition.numberField;
      const number =
        numberField && readableSearchField(policy, numberField)
          ? numberField
          : null;
      const title = readableSearchField(policy, definition.titleField)
        ? definition.titleField
        : null;
      const applicant = readableSearchField(policy, applicantField);
      const related =
        definition.relatedNumber &&
        readableSearchField(policy, definition.relatedNumber.referenceField)
          ? definition.relatedNumber
          : undefined;
      let relatedIds = related ? await related.matchingRequestIds(query) : [];
      if (relatedIds.length > searchExpansionLimit) {
        relatedIds = [];
        onSkippedMatch?.('relatedNumber');
      }
      if (
        !number &&
        !title &&
        !(applicant && applicantIds.length) &&
        !relatedIds.length
      )
        return [];
      const fields = [
        ...new Set([
          ...(number ? [number] : []),
          ...(title ? [title] : []),
          ...(applicant ? [applicantField] : []),
          ...(related ? [related.referenceField] : []),
        ]),
      ];
      const rows = await database
        .repository<Record<string, string | null>>(definition.collection)
        .withPolicy(policy)
        .findMany({
          select: (s) => s.fields('id', ...fields),
          filter: (f) =>
            f.and([
              f.or([
                ...(number
                  ? [f.string(number).includes(query, { mode: 'insensitive' })]
                  : []),
                ...(title
                  ? [
                      (definition.titleType === 'string'
                        ? f.string(title)
                        : f.text(title)
                      ).includes(query, { mode: 'insensitive' }),
                    ]
                  : []),
                ...(applicant
                  ? applicantIds.map((id) => f.string(applicantField).eq(id))
                  : []),
                ...relatedIds.map((id) => f.string('id').eq(id)),
              ]),
            ]),
          sort: (s) => [s.field('id').desc()],
          cursor: afterId ? { id: afterId } : undefined,
          direction: afterId ? 'forward' : undefined,
          limit,
        });
      return Promise.all(
        rows.map(async (row) => ({
          id: String(row.id),
          kind: definition.kind,
          title:
            title && typeof row[title] === 'string'
              ? row[title].replace(/\s+/gu, ' ').trim().slice(0, 240)
              : null,
          number:
            number && typeof row[number] === 'string'
              ? row[number]
              : related
                ? await related.value(row)
                : null,
          applicantId:
            applicant && typeof row[applicantField] === 'string'
              ? row[applicantField]
              : null,
        })),
      );
    },
  });
}
