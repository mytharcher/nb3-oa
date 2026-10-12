import { useTranslation } from '@nocobase/i18n/client';
import type { ReactElement } from 'react';

import { Button } from '#components/ui/button';
import { Spinner } from '#components/ui/spinner';
import { useRouteOverlay } from '#components/use-route-overlay';

/** "Cancel" or "Close" of a route overlay; rendered inside the overlay, where `useRouteOverlay` works. */
export function OverlayCloseButton({
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

/** "Cancel" and the submit button of a route dialog's form, linked through `formId`. */
export function OverlayFormFooter({
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
      <OverlayCloseButton label={t('actions.cancel')} disabled={submitting} />
      <Button type='submit' form={formId} disabled={submitting}>
        {submitting ? <Spinner data-icon='inline-start' /> : null}
        {submitting ? t('actions.saving') : submitLabel}
      </Button>
    </>
  );
}
