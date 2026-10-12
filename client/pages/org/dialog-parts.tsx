import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import { Button } from '#components/ui/button';
import { Spinner } from '#components/ui/spinner';
import { useRouteOverlay } from '#components/use-route-overlay';

/** Cancel and submit, for a form rendered in a route dialog's body (the submit button is linked by `form`). */
export function FormDialogFooter({
  formId,
  submitting,
  submitLabel,
}: {
  readonly formId: string;
  readonly submitting: boolean;
  readonly submitLabel: string;
}): ReactElement {
  const { t } = useTranslation();
  return (
    <>
      <CloseButton label={t('actions.cancel')} disabled={submitting} />
      <Button type='submit' form={formId} disabled={submitting}>
        {submitting ? <Spinner data-icon='inline-start' /> : null}
        {submitting ? t('actions.saving') : submitLabel}
      </Button>
    </>
  );
}

/** Closes the route overlay it is rendered in; it must be rendered inside that overlay. */
export function CloseButton({
  label,
  disabled = false,
}: {
  readonly label: string;
  readonly disabled?: boolean;
}): ReactElement {
  const { close, isClosing } = useRouteOverlay();
  return (
    <Button
      type='button'
      variant='outline'
      disabled={disabled || isClosing}
      onClick={() => void close()}
    >
      {label}
    </Button>
  );
}
