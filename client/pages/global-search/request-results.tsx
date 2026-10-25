import { useEffect } from 'react';
import { Link } from 'react-router';
import { useApiClient } from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import {
  useAuthorizationRevision,
  useCan,
} from '@nocobase/app-plugin-authorization/client';
import { useInfiniteQuery } from '@tanstack/react-query';
import { useTranslation } from '@nocobase/i18n/client';
import { Card, CardHeader, CardTitle, CardContent } from '#components/ui/card';
import { Button } from '#components/ui/button';
import { Skeleton } from '#components/ui/skeleton';
import { ErrorState } from '../approvals/states.js';
import { approvalBusiness } from '../approvals/business-metadata.js';
import type { CenterRecord } from '../approvals/use-center-resource.js';
interface RequestPage {
  data: {
    id: string;
    kind: CenterRecord['kind'];
    title: string | null;
    number: string | null;
    applicant: { id: string; name: string } | null;
  }[];
  meta: {
    nextCursor: string | null;
    hasMore: boolean;
    skippedMatches?: ('applicant' | 'relatedNumber')[];
  };
}
/** Each page inspects a bounded candidate window, so a page can be empty while matches remain. */
const autoContinueLimit = 5;

export function RequestResults({ q }: { q: string }) {
  const { t } = useTranslation();
  const api = useApiClient();
  const { session } = useAuthentication();
  const revision = useAuthorizationRevision();
  const page = useCan({
    resource: { type: 'page', id: 'oa.approvals' },
    action: 'access',
  });
  const result = useInfiniteQuery({
    queryKey: ['oa-request-search', session?.user.id, revision, q],
    enabled: !!session && q.length >= 2,
    initialPageParam: undefined as string | undefined,
    queryFn: ({ pageParam, signal }) =>
      api.request<RequestPage>({
        path: 'requestSearch',
        query: {
          q,
          pageSize: '10',
          ...(pageParam ? { cursor: pageParam } : {}),
        },
        signal,
      }),
    getNextPageParam: (last) =>
      last.meta.hasMore ? (last.meta.nextCursor ?? undefined) : undefined,
  });
  const all = result.isError
    ? []
    : (result.data?.pages.flatMap((part) => part.data) ?? []);
  const pages = result.data?.pages ?? [];
  let emptyTail = 0;
  while (
    emptyTail < pages.length &&
    !pages[pages.length - 1 - emptyTail].data.length
  )
    emptyTail++;
  // Keep scanning windows that held nothing visible; after a few, let the viewer decide.
  const scanning =
    !result.isError &&
    result.hasNextPage &&
    emptyTail > 0 &&
    emptyTail <= autoContinueLimit;
  const { fetchNextPage, isFetchingNextPage } = result;
  useEffect(() => {
    if (scanning && !isFetchingNextPage) void fetchNextPage();
  }, [scanning, isFetchingNextPage, fetchNextPage, pages.length]);
  const skipped = new Set(
    pages.flatMap((part) => part.meta.skippedMatches ?? []),
  );
  const rows = all.filter(
    (row, index) =>
      all.findIndex(
        (other) => other.kind === row.kind && other.id === row.id,
      ) === index,
  );
  return (
    <Card className='min-w-0'>
      <CardHeader>
        <CardTitle>{t('globalSearch.requests')}</CardTitle>
      </CardHeader>
      <CardContent className='space-y-3'>
        {result.isError ? (
          <ErrorState
            context='query'
            error={result.error}
            retry={() => {
              void result.refetch();
            }}
          />
        ) : result.isPending ? (
          <Skeleton className='h-24' />
        ) : (
          <>
            <p className='text-sm text-muted-foreground'>
              {t('globalSearch.loaded', { count: rows.length })}
            </p>
            {[...skipped].map((match) => (
              <p key={match} className='text-sm text-muted-foreground'>
                {t(`globalSearch.skipped.${match}`)}
              </p>
            ))}
            {!rows.length && !result.hasNextPage ? (
              <p className='text-sm text-muted-foreground'>
                {t('globalSearch.empty')}
              </p>
            ) : null}
            {!rows.length && result.hasNextPage && !scanning ? (
              <p className='text-sm text-muted-foreground'>
                {t('globalSearch.notFoundYet')}
              </p>
            ) : null}
            <ul className='space-y-3'>
              {rows.map((row) => {
                const business = approvalBusiness(row.kind);
                const label =
                  [row.number, row.title].filter(Boolean).join(' · ') ||
                  t(`approvalCenter.kinds.${business.label}`);
                return (
                  <li key={`${row.kind}:${row.id}`} className='min-w-0'>
                    {page.can && !page.isPending && !page.error ? (
                      <Link
                        className='block break-words font-medium text-primary underline-offset-4 hover:underline'
                        to={`/approvals/mine/${business.detail}/${encodeURIComponent(row.id)}`}
                      >
                        {label}
                      </Link>
                    ) : (
                      <p className='break-words font-medium'>{label}</p>
                    )}
                    <p className='break-words text-sm text-muted-foreground'>
                      {[
                        t(`approvalCenter.kinds.${business.label}`),
                        row.applicant?.name,
                      ]
                        .filter(Boolean)
                        .join(' · ')}
                    </p>
                  </li>
                );
              })}
            </ul>
            {scanning ? (
              <p role='status' className='text-sm text-muted-foreground'>
                {t('globalSearch.scanning')}
              </p>
            ) : result.hasNextPage ? (
              <Button
                variant='outline'
                size='sm'
                disabled={result.isFetching}
                onClick={() => {
                  void result.fetchNextPage();
                }}
              >
                {t('globalSearch.more')}
              </Button>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
