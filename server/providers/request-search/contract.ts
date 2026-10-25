import { createServiceToken } from '@nocobase/service-provider';
import type { RepositoryPolicy } from '@nocobase/db';
export interface RequestSearchItem {
  id: string;
  kind: string;
  title: string | null;
  number: string | null;
  applicantId: string | null;
}
/** A match path a source skipped because it was too broad; other fields still match. */
export type RequestSearchSkippedMatch = 'applicant' | 'relatedNumber';
export interface RequestSearchSource {
  kind: string;
  resource: string;
  collection: string;
  /** Dedicated authorized reporting projection; not keyword search. */
  reportingCandidates(input: {
    before: string;
    applicantIds?: readonly string[];
    afterId?: string;
    limit: number;
    policy: RepositoryPolicy;
  }): Promise<RequestSearchItem[]>;
  candidates(input: {
    query: string;
    applicantIds: string[];
    afterId?: string;
    limit: number;
    policy: RepositoryPolicy;
    onSkippedMatch?: (match: RequestSearchSkippedMatch) => void;
  }): Promise<RequestSearchItem[]>;
  validate(
    id: string,
    actorId: string,
    policy: RepositoryPolicy,
  ): Promise<unknown>;
}
export interface RequestSearchRegistry {
  register(source: RequestSearchSource): void;
  sources(): readonly RequestSearchSource[];
}
export const requestSearchRegistryToken =
  createServiceToken<RequestSearchRegistry>('oa/request-search');
