import { useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useApiClient } from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import {
  useAuthorizationRevision,
  useCan,
} from '@nocobase/app-plugin-authorization/client';
import { useQuery } from '@tanstack/react-query';
import { RequestResults } from './request-results.js';
import { useTranslation } from '@nocobase/i18n/client';
import { ApplicationSearch } from '#components/application-search';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { Button } from '#components/ui/button';
import { Card, CardHeader, CardTitle, CardContent } from '#components/ui/card';
import { Skeleton } from '#components/ui/skeleton';
import { ErrorState } from '../approvals/states.js';
import {
  searchSources,
  type SearchSource,
  type SearchResponse,
} from './sources.js';

export default function GlobalSearchPage() {
  const { t } = useTranslation();
  const [params, setParams] = useSearchParams();
  const q = (params.get('q') ?? '').trim().slice(0, 100);
  const [draft, setDraft] = useState({ q, value: q });
  const input = draft.q === q ? draft.value : q;
  const setInput = (value: string) => setDraft({ q, value });
  const composingRef = useRef(false);
  return (
    <PageContainer className='flex flex-col gap-4'>
      <PageHeader
        title={t('globalSearch.title')}
        description={t('globalSearch.description')}
      />
      <form
        className='flex flex-wrap gap-2'
        onSubmit={(event) => {
          event.preventDefault();
          if (composingRef.current) return;
          setParams(input.trim() ? { q: input.trim().slice(0, 100) } : {});
        }}
      >
        <ApplicationSearch
          className='w-full min-w-0 sm:flex-1'
          placeholder={t('globalSearch.placeholder')}
          value={input}
          maxLength={100}
          minLength={2}
          onChange={(event) => setInput(event.target.value)}
          onCompositionStart={() => {
            composingRef.current = true;
          }}
          onCompositionEnd={() => {
            composingRef.current = false;
          }}
        />
        <Button type='submit'>{t('globalSearch.search')}</Button>
        {q ? (
          <Button
            type='button'
            variant='outline'
            onClick={() => {
              setInput('');
              setParams({});
            }}
          >
            {t('globalSearch.clear')}
          </Button>
        ) : null}
      </form>
      {q.length >= 2 ? (
        <div className='grid min-w-0 gap-4 lg:grid-cols-2'>
          <RequestResults q={q} />
          {searchSources.map((source) => (
            <SourceResults key={source.key} source={source} q={q} />
          ))}
        </div>
      ) : (
        <p className='text-sm text-muted-foreground'>
          {t('globalSearch.start')}
        </p>
      )}
    </PageContainer>
  );
}
function SourceResults({ source, q }: { source: SearchSource; q: string }) {
  const { t } = useTranslation();
  const api = useApiClient();
  const { session } = useAuthentication();
  const revision = useAuthorizationRevision();
  const grant = useCan({ resource: source.resource, action: source.action });
  const [params, setParams] = useSearchParams();
  const value = Number(params.get(`${source.key}Page`));
  const page = Number.isSafeInteger(value) && value > 0 ? value : 1;
  const allowed = !!session && grant.can && !grant.error && !grant.isPending;
  const result = useQuery({
    queryKey: [
      'oa-global-search',
      session?.user.id,
      revision,
      source.key,
      q,
      page,
    ],
    enabled: allowed,
    queryFn: ({ signal }) =>
      api.request<SearchResponse>({
        path: source.path,
        query: { ...source.query(q), page: String(page), pageSize: '10' },
        signal,
      }),
  });
  if (grant.isPending) return <Skeleton className='h-32' />;
  if (!allowed) return null;
  const rows = result.isError
    ? []
    : (result.data?.data ?? []).map((row) => source.hit(row));
  const total = result.data?.meta.total ?? 0;
  const move = (next: number) =>
    setParams((previous) => {
      const updated = new URLSearchParams(previous);
      updated.set(`${source.key}Page`, String(next));
      return updated;
    });
  return (
    <Card className='min-w-0'>
      <CardHeader>
        <CardTitle>{t(`globalSearch.sources.${source.key}`)}</CardTitle>
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
              {t('globalSearch.count', { count: total })}
            </p>
            {!rows.length ? (
              <p className='text-sm text-muted-foreground'>
                {t('globalSearch.empty')}
              </p>
            ) : (
              <ul className='space-y-3'>
                {rows.map((row) => (
                  <li key={row.id} className='min-w-0'>
                    <Link
                      to={row.to}
                      className='block break-words font-medium text-primary underline-offset-4 hover:underline'
                    >
                      {row.title}
                    </Link>
                    {row.detail ? (
                      <p className='break-words text-sm text-muted-foreground'>
                        {row.detail}
                      </p>
                    ) : null}
                  </li>
                ))}
              </ul>
            )}
            {page > 1 || total > 10 ? (
              <div className='flex flex-wrap items-center gap-2'>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={page <= 1 || result.isFetching}
                  onClick={() => move(page - 1)}
                >
                  {t('globalSearch.previous')}
                </Button>
                <span className='text-sm tabular-nums'>
                  {t('globalSearch.page', { page })}
                </span>
                <Button
                  variant='outline'
                  size='sm'
                  disabled={page * 10 >= total || result.isFetching}
                  onClick={() => move(page + 1)}
                >
                  {t('globalSearch.next')}
                </Button>
              </div>
            ) : null}
          </>
        )}
      </CardContent>
    </Card>
  );
}
