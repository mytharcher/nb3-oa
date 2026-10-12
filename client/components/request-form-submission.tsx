import { useState } from 'react';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { useTranslation } from '@nocobase/i18n/client';
import { Button } from '#components/ui/button';
import { Spinner } from '#components/ui/spinner';
import { Alert, AlertDescription } from '#components/ui/alert';
export function RequestFormButtons({
  form,
  resource,
  busy,
  disabled,
  revision = false,
  canSubmit = true,
  submitAction = 'submit',
}: {
  form: string;
  resource: string;
  busy: boolean;
  disabled?: boolean;
  revision?: boolean;
  canSubmit?: boolean;
  /** Match the action checked by the owner's submission endpoint. */
  submitAction?: string;
}) {
  const { t } = useTranslation();
  const submitGrant = useCan({
    resource: { type: 'composite', id: resource },
    action: submitAction,
  });
  const [intent, setIntent] = useState<'save' | 'submit'>('save');
  return (
    <>
      <Button
        type='submit'
        form={form}
        name='requestIntent'
        value='save'
        onClick={() => setIntent('save')}
        variant='outline'
        disabled={busy || disabled}
      >
        {busy && intent === 'save' ? (
          <Spinner data-icon='inline-start' />
        ) : null}
        {t(revision ? 'approvals.save' : 'approvals.saveDraft')}
      </Button>
      {canSubmit &&
      submitGrant.can &&
      !submitGrant.isPending &&
      !submitGrant.error ? (
        <Button
          type='submit'
          form={form}
          name='requestIntent'
          value='submit'
          onClick={() => setIntent('submit')}
          disabled={busy || disabled}
        >
          {busy && intent === 'submit' ? (
            <Spinner data-icon='inline-start' />
          ) : null}
          {t(revision ? 'approvals.resubmit' : 'approvals.submit')}
        </Button>
      ) : null}
    </>
  );
}

export function RequestSubmissionFeedback({
  failed,
  unknown = false,
}: {
  failed: boolean;
  unknown?: boolean;
}) {
  const { t } = useTranslation();
  return failed ? (
    <Alert>
      <AlertDescription>
        {t('approvals.draftSavedSubmitFailed')}
        {unknown ? <p>{t('approvals.submissionUnknown')}</p> : null}
      </AlertDescription>
    </Alert>
  ) : null;
}
