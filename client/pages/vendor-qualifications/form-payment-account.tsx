import {
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
  type Ref,
} from 'react';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { ApiClientError, useApiClient } from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
  FieldSet,
  FieldLegend,
} from '#components/ui/field';
import { Input } from '#components/ui/input';
import { usePrivateAccount } from './private-account.js';
import type { BankResult, QualificationRecord } from './types.js';
export interface FormPaymentAccountControl {
  save(record: QualificationRecord, submitting: boolean): Promise<void>;
}
const empty = { bankName: '', bankAccount: '', bankAccountName: '' };
/** Private banking uses its own facade and stays out of public draft commands
 * and durable journals. It can be prepared before the first submission. */
export function FormPaymentAccount({
  record,
  controlRef,
  disabled,
  createAllowed,
  onDirty,
}: {
  record?: QualificationRecord;
  controlRef: Ref<FormPaymentAccountControl>;
  disabled: boolean;
  createAllowed: boolean;
  onDirty: () => void;
}) {
  const account = usePrivateAccount(record);
  const write = useCan({
    resource: { type: 'composite', id: 'oa.vendorQualification' },
    action: 'updatePaymentAccount',
  });
  const api = useApiClient();
  const { t } = useTranslation();
  const [values, setValues] = useState(empty);
  const [reason, setReason] = useState('');
  const [invalid, setInvalid] = useState(false);
  const [unknown, setUnknown] = useState(false);
  const dirtyRef = useRef(false);
  const loadedRef = useRef<string | undefined>(undefined);
  const unknownRef = useRef<
    | {
        id: string;
        version: number;
        values: typeof empty;
        reason: string;
        lifecycleVersion: number;
      }
    | undefined
  >(undefined);
  const writable =
    account.allowed &&
    write.can &&
    !write.isPending &&
    !write.error &&
    (createAllowed || account.canWrite);
  useEffect(() => {
    if (!record || !account.data?.account || loadedRef.current === record.id)
      return;
    loadedRef.current = record.id;
    if (dirtyRef.current) return;
    const current = account.data.account;
    queueMicrotask(() =>
      setValues({
        bankName: current.bankName,
        bankAccount: current.bankAccount,
        bankAccountName: current.bankAccountName,
      }),
    );
  }, [record, account.data]);
  useImperativeHandle(controlRef, () => ({
    async save(current, submitting) {
      if (current.operation !== 'qualify' || (!dirtyRef.current && !submitting))
        return;
      if (!dirtyRef.current && !account.allowed) return;
      // Reading and writing each retain the independent protected policies.
      if (!account.allowed || (!writable && dirtyRef.current))
        throw new Error(t('vendorQualifications.account.denied'));
      const { data: fresh } = await api.request<{ data: BankResult }>({
        path: `vendorQualifications/${current.id}/paymentAccount`,
      });
      if (!fresh.account)
        throw new Error(t('vendorQualifications.account.missing'));
      const input = dirtyRef.current ? values : fresh.account;
      if (
        submitting &&
        (Object.keys(empty) as (keyof typeof empty)[]).some(
          (key) => !input[key].trim(),
        )
      ) {
        setInvalid(true);
        document.getElementById('qualification-form-bankName')?.focus();
        throw new Error(t('vendorQualifications.account.missing'));
      }
      if (!dirtyRef.current) return;
      const pending = unknownRef.current;
      if (pending) {
        const matches =
          pending.id === current.id &&
          fresh.account.version === pending.version + 1 &&
          (Object.keys(empty) as (keyof typeof empty)[]).every(
            (key) => fresh.account![key] === pending.values[key].trim(),
          );
        if (matches) {
          unknownRef.current = undefined;
          setUnknown(false);
          dirtyRef.current = false;
          return;
        }
        if (
          pending.id !== current.id ||
          fresh.account.version !== pending.version
        )
          throw new Error(t('approvals.creationUnknown'));
      }
      const auditReason =
        pending?.reason ?? (reason.trim() || current.reason.trim());
      if (!auditReason) {
        setInvalid(true);
        throw new Error(t('approvals.required'));
      }
      const captured = pending?.values ?? { ...values };
      unknownRef.current = {
        id: current.id,
        version: fresh.account.version,
        values: captured,
        reason: auditReason,
        lifecycleVersion: pending?.lifecycleVersion ?? fresh.lifecycleVersion,
      };
      try {
        await api.request({
          method: 'PATCH',
          path: `vendorQualifications/${current.id}/paymentAccount`,
          json: {
            lifecycleVersion: unknownRef.current.lifecycleVersion,
            bankVersion: fresh.account.version,
            reason: auditReason,
            account: captured,
          },
        });
        unknownRef.current = undefined;
        dirtyRef.current = false;
        setUnknown(false);
        account.reload();
      } catch (error) {
        const uncertain =
          !(error instanceof ApiClientError) || error.status >= 500;
        if (!uncertain) unknownRef.current = undefined;
        setUnknown(uncertain);
        throw error;
      }
    },
  }));
  if (!account.allowed || !writable) return null;
  return (
    <FieldSet>
      <FieldLegend>{t('vendorQualifications.account.title')}</FieldLegend>
      {unknown ? <p>{t('approvals.creationUnknown')}</p> : null}
      <FieldGroup>
        {(Object.keys(empty) as (keyof typeof empty)[]).map((key) => (
          <Field key={key} data-invalid={invalid && !values[key].trim()}>
            <FieldLabel htmlFor={`qualification-form-${key}`}>
              {t(`vendorQualifications.account.${key}`)}
            </FieldLabel>
            <Input
              id={`qualification-form-${key}`}
              value={values[key]}
              maxLength={255}
              disabled={disabled || unknown}
              onChange={(event) => {
                dirtyRef.current = true;
                onDirty();
                setValues((old) => ({ ...old, [key]: event.target.value }));
              }}
            />
            {invalid && !values[key].trim() ? (
              <FieldError>
                {t('vendorQualifications.account.missing')}
              </FieldError>
            ) : null}
          </Field>
        ))}
        <Field>
          <FieldLabel htmlFor='qualification-form-bankReason'>
            {t('vendorQualifications.account.reason')}
          </FieldLabel>
          <Input
            id='qualification-form-bankReason'
            value={reason}
            maxLength={4000}
            disabled={disabled || unknown}
            onChange={(event) => {
              dirtyRef.current = true;
              onDirty();
              setReason(event.target.value);
            }}
          />
        </Field>
      </FieldGroup>
    </FieldSet>
  );
}
