import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useBusinessResource } from '#hooks/use-business-resource';
import { createRequestKey } from '#lib/request-key';
import { RouteFormPage } from '#components/route-form-page';
import { PageContainer } from '#components/page-container';
import { FormActions } from '#components/form-actions';
import { Field, FieldLabel, FieldGroup } from '#components/ui/field';
import { Input } from '#components/ui/input';
import { Button } from '#components/ui/button';
import { Failure, Loading } from '../work-items/states.js';
interface Configuration {
  revision: string;
  windows: { start: string; end: string }[];
}
export default function CalendarForm() {
  const r = useBusinessResource<{ data: Configuration }>('itRepairs/calendar'),
    { t } = useTranslation();
  return (
    <RouteFormPage title={t('itRepairs.calendar')}>
      {r.loading ? (
        <Loading />
      ) : r.error ? (
        <Failure error={r.error} retry={r.reload} module='itRepairs' />
      ) : r.data ? (
        <Editor initial={r.data.data} />
      ) : null}
    </RouteFormPage>
  );
}
function Editor({ initial }: { initial: Configuration }) {
  const [windows, setWindows] = useState(initial.windows),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>(),
    [key, setKey] = useState(createRequestKey),
    api = useApiClient(),
    navigate = useNavigate(),
    { t } = useTranslation();
  async function save() {
    setBusy(true);
    setError(undefined);
    try {
      await api.request({
        method: 'POST',
        path: 'itRepairs/calendar',
        json: { requestKey: key, expectedRevision: initial.revision, windows },
      });
      void navigate('..');
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  return (
    <PageContainer>
      <p className='text-muted-foreground'>{t('itRepairs.calendarHelp')}</p>
      {busy ? <p role='status'>{t('itRepairs.working')}</p> : null}
      {error ? <Failure error={error} module='itRepairs' /> : null}
      <form
        id='repair-calendar-form'
        onSubmit={(event) => {
          event.preventDefault();
          void save();
        }}
      >
        <FieldGroup>
          {windows.map((w, i) => (
            <div
              key={i === 0 ? 'morning' : 'afternoon'}
              className='grid grid-cols-1 gap-4 sm:grid-cols-2'
            >
              {(['start', 'end'] as const).map((field) => (
                <Field key={field}>
                  <FieldLabel htmlFor={`window-${i}-${field}`}>
                    {t(`itRepairs.${i === 0 ? 'morning' : 'afternoon'}`)} ·{' '}
                    {t(`itRepairs.${field}`)}
                  </FieldLabel>
                  <Input
                    id={`window-${i}-${field}`}
                    type='time'
                    value={w[field]}
                    disabled={busy}
                    onChange={(e) => {
                      setWindows(
                        windows.map((item, index) =>
                          index === i
                            ? { ...item, [field]: e.target.value }
                            : item,
                        ),
                      );
                      setKey(createRequestKey());
                    }}
                  />
                </Field>
              ))}
            </div>
          ))}
        </FieldGroup>
      </form>
      <FormActions>
        <Button
          variant='outline'
          disabled={busy}
          onClick={() => void navigate('..')}
        >
          {t('actions.cancel')}
        </Button>
        <Button disabled={busy} type='submit' form='repair-calendar-form'>
          {t('itRepairs.saveConfiguration')}
        </Button>
      </FormActions>
    </PageContainer>
  );
}
