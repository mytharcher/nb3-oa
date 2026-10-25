import { useRef, useState, type FormEvent, type KeyboardEvent } from 'react';
import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { createRequestKey } from '#lib/request-key';
export interface DraftRecord {
  id: string;
  lifecycleVersion: number;
  status: string;
}
export interface SubmitAdapter {
  resource: string;
  /** Standalone confirmation forms always submit; draft editors capture the button intent. */
  initialIntent?: 'save' | 'submit';
  /** Only owners with durable create commands may replay an unknown creation. */
  replayUnknownCreate?: boolean;
  suffix?: 'transition' | 'transitions' | 'submit';
  nameField?: 'transition' | 'name';
  keyField?: 'requestId' | 'requestKey';
  versionField?: 'version' | 'expectedVersion';
  includeInput?: boolean;
  recordResult?: 'direct';
}

/** The owner still writes and validates its draft. This coordinates the two
 * writes without forgetting a committed draft when the second write fails. */
export function useRequestFormSubmission<R extends DraftRecord>(
  adapter: SubmitAdapter,
) {
  const api = useApiClient();
  const intentRef = useRef<'save' | 'submit'>(adapter.initialIntent ?? 'save');
  const recordRef = useRef<R | undefined>(undefined);
  const savedInputRef = useRef<string | undefined>(undefined);
  const pendingRef = useRef<
    { id: string; version: number; key: string; unknown: boolean } | undefined
  >(undefined);
  const [submitFailed, setSubmitFailed] = useState(false);
  const [submitUnknown, setSubmitUnknown] = useState(false);
  const draftCommandRef = useRef<
    | {
        signature: string;
        run: () => Promise<R>;
        unknown: boolean;
        replayable: boolean;
      }
    | undefined
  >(undefined);
  const { t } = useTranslation();

  function captureIntent(event: FormEvent<HTMLFormElement>) {
    const submitter = (event.nativeEvent as SubmitEvent).submitter;
    intentRef.current =
      submitter instanceof HTMLButtonElement &&
      submitter.name === 'requestIntent' &&
      submitter.value === 'submit'
        ? 'submit'
        : 'save';
  }

  async function save(
    input: unknown,
    existing: R | undefined,
    write: (record: R | undefined) => Promise<R>,
  ) {
    const signature = JSON.stringify(input);
    if (
      draftCommandRef.current?.unknown &&
      draftCommandRef.current.signature !== signature
    )
      throw new Error(t('approvals.creationUnknown'));
    if (
      pendingRef.current?.unknown &&
      (signature !== savedInputRef.current || intentRef.current !== 'submit')
    )
      throw new Error(t('approvals.submissionUnknown'));
    if (draftCommandRef.current?.unknown && !draftCommandRef.current.replayable)
      throw new Error(t('approvals.creationUnknown'));
    if (recordRef.current && savedInputRef.current === signature)
      return recordRef.current;
    if (!draftCommandRef.current?.unknown) {
      const base = recordRef.current ?? existing;
      draftCommandRef.current = {
        signature,
        run: () => write(base),
        unknown: false,
        replayable: !!base || adapter.replayUnknownCreate === true,
      };
    }
    const command = draftCommandRef.current;
    let record: R;
    try {
      record = await command.run();
    } catch (error) {
      command.unknown =
        !(error instanceof ApiClientError) || error.status >= 500;
      if (!command.unknown) draftCommandRef.current = undefined;
      throw error;
    }
    draftCommandRef.current = undefined;
    recordRef.current = record;
    savedInputRef.current = signature;
    pendingRef.current = undefined;
    setSubmitFailed(false);
    setSubmitUnknown(false);
    return record;
  }

  async function finish(
    record: R,
    write?: (record: R, key: string) => Promise<R>,
  ): Promise<R> {
    recordRef.current = record;
    if (intentRef.current !== 'submit') return record;
    if (
      !pendingRef.current ||
      pendingRef.current.id !== record.id ||
      pendingRef.current.version !== record.lifecycleVersion
    )
      pendingRef.current = {
        id: record.id,
        version: record.lifecycleVersion,
        key: createRequestKey(),
        unknown: false,
      };
    const command = pendingRef.current;
    try {
      if (write) {
        const submitted = await write(record, command.key);
        recordRef.current = submitted;
        pendingRef.current = undefined;
        setSubmitFailed(false);
        setSubmitUnknown(false);
        return submitted;
      }
      // The form may have just corrected facts that blocked the loaded offer.
      // The owner endpoint evaluates grants, scope and current eligibility after
      // the acknowledged save; its blocker response remains in this form.
      const { data } = await api.request<{ data: { record: R } | R }>({
        method: 'POST',
        path: `${adapter.resource}/${encodeURIComponent(record.id)}/${adapter.suffix ?? 'transition'}`,
        json: {
          ...(adapter.suffix === 'submit'
            ? {}
            : { [adapter.nameField ?? 'transition']: 'submit' }),
          [adapter.versionField ?? 'version']: command.version,
          [adapter.keyField ?? 'requestId']: command.key,
          ...(adapter.suffix === 'submit' || adapter.includeInput === false
            ? {}
            : { input: {} }),
        },
      });
      const submitted =
        adapter.recordResult === 'direct'
          ? (data as R)
          : (data as { record: R }).record;
      recordRef.current = submitted;
      pendingRef.current = undefined;
      setSubmitFailed(false);
      setSubmitUnknown(false);
      return submitted;
    } catch (error) {
      command.unknown =
        !(error instanceof ApiClientError) || error.status >= 500;
      setSubmitFailed(true);
      setSubmitUnknown(command.unknown);
      throw error;
    }
  }
  function adopt(record: R) {
    if (pendingRef.current?.unknown) return;
    recordRef.current = record;
    savedInputRef.current = undefined;
    draftCommandRef.current = undefined;
    pendingRef.current = undefined;
  }
  return {
    captureIntent,
    save,
    finish,
    adopt,
    current: recordRef,
    intent: intentRef,
    submitFailed,
    submitUnknown,
  };
}

export function preventComposingSubmit(event: KeyboardEvent<HTMLFormElement>) {
  if (
    event.key === 'Enter' &&
    (event.nativeEvent.isComposing || event.nativeEvent.keyCode === 229)
  )
    event.preventDefault();
}
