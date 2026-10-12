import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useEffect, useReducer, useState } from 'react';
import { SessionExpiredAlert } from '#components/session-expired-alert';
import { Alert, AlertAction, AlertDescription } from '#components/ui/alert';
import { Button } from '#components/ui/button';
import {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
} from '#components/ui/combobox';

type Position = { id: string; title: string; code: string; active: boolean };
const label = (position: Position) => `${position.title} (${position.code})`;
const same = (left: Position, right: Position) => left.id === right.id;

/** Public signed-in metadata only; report rows still enforce their independent source policy. */
export function PositionFilter({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const api = useApiClient();
  const { t } = useTranslation();
  const [generation, retry] = useReducer((n: number) => n + 1, 0);
  const [result, setResult] = useState<{
    generation: number;
    data?: Position[];
    error?: unknown;
  }>();
  useEffect(() => {
    const abort = new AbortController();
    api
      .request<{ data: Position[] }>({
        path: 'positions/options',
        // Historical account filters also need disabled catalogue entries.
        query: { includeInactive: 'true' },
        signal: abort.signal,
      })
      .then(
        ({ data }) => !abort.signal.aborted && setResult({ generation, data }),
        (error: unknown) =>
          !abort.signal.aborted && setResult({ generation, error }),
      );
    return () => abort.abort();
  }, [api, generation]);
  const current = result?.generation === generation ? result : undefined;
  if (current?.error) {
    if (current.error instanceof ApiClientError && current.error.status === 401)
      return <SessionExpiredAlert />;
    const denied =
      current.error instanceof ApiClientError &&
      [403, 404].includes(current.error.status);
    return (
      <Alert variant='destructive'>
        <AlertDescription>
          {t('reports.filters.positionFailed')}
        </AlertDescription>
        {!denied ? (
          <AlertAction>
            <Button variant='outline' onClick={retry}>
              {t('reports.retry')}
            </Button>
          </AlertAction>
        ) : null}
      </Alert>
    );
  }
  const items = current?.data ?? [];
  const selected = items.find((position) => position.id === value) ?? null;
  return (
    <Combobox
      items={items}
      value={selected}
      onValueChange={(position: Position | null) =>
        onChange(position?.id ?? '')
      }
      itemToStringLabel={label}
      isItemEqualToValue={same}
      disabled={!current?.data}
    >
      <ComboboxInput
        id={id}
        className='w-full sm:w-56'
        showClear={!!selected}
        placeholder={
          current?.data ? t('reports.filters.position') : t('status.loading')
        }
      />
      <ComboboxContent>
        <ComboboxEmpty>{t('reports.filters.positionEmpty')}</ComboboxEmpty>
        <ComboboxList>
          {(position: Position) => (
            <ComboboxItem key={position.id} value={position}>
              {label(position)}
            </ComboboxItem>
          )}
        </ComboboxList>
      </ComboboxContent>
    </Combobox>
  );
}
