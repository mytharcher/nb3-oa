import { useEffect, useRef } from 'react';
import { ApiClientError, useToaster } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useNavigate } from 'react-router';
import { focusSource } from './breadcrumb.js';
/** A final absence has one exit, never a mutation retry. Release an unsaved-input guard before leaving its now-missing record. */
export function useMissing(
  error: unknown,
  source: string,
  search: string,
  reload?: () => void,
  release?: () => void,
) {
  const handledRef = useRef(false),
    navigate = useNavigate(),
    toaster = useToaster(),
    { t } = useTranslation();
  useEffect(() => {
    if (
      handledRef.current ||
      !(error instanceof ApiClientError) ||
      error.status !== 404
    )
      return;
    handledRef.current = true;
    release?.();
    reload?.();
    toaster.show({ type: 'error', title: t('contracts.missing') });
    void Promise.resolve(
      navigate({ pathname: source, search }, { replace: true }),
    ).then(focusSource);
  }, [error, source, search, reload, release, navigate, toaster, t]);
}
