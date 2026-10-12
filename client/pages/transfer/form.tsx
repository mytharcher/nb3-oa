import { createRequestKey } from '#lib/request-key';
import { UserName } from '#components/user-name';
import {
  useRequestFormSubmission,
  preventComposingSubmit,
} from '#hooks/use-request-form-submission';
import {
  RequestFormButtons,
  RequestSubmissionFeedback,
} from '#components/request-form-submission';
import { useEffect, useRef, useState } from 'react';
import { Controller, useForm, useWatch } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { FieldsSkeleton } from '../platform/shared/states.js';
import { format, parseISO } from 'date-fns';
import {
  ApiClientError,
  useApiClient,
  useNavigationGuard,
  useToaster,
} from '@nocobase/app-client';
import { useTranslation } from '@nocobase/i18n/client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import {
  useAuthorizationRevision,
  useCan,
} from '@nocobase/app-plugin-authorization/client';
import {
  useLocation,
  useNavigate,
  useOutletContext,
  useParams,
} from 'react-router';
import { RouteFormPage } from '#components/route-form-page';
import { PageContainer } from '#components/page-container';
import { PageHeader } from '#components/page-header';
import { BackButton } from '#components/back-button';
import { DatePicker } from '#components/date-picker';
import {
  Field,
  FieldGroup,
  FieldLabel,
  FieldError,
} from '#components/ui/field';
import { Input } from '#components/ui/input';
import { Textarea } from '#components/ui/textarea';
import { Button } from '#components/ui/button';
import { Checkbox } from '#components/ui/checkbox';
import { Alert, AlertDescription } from '#components/ui/alert';
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectGroup,
  SelectItem,
} from '#components/ui/select';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from '#components/ui/alert-dialog';
import { useTransferResource } from './resource.js';
import { TransferError } from './states.js';
import {
  transferPolicy,
  type Context,
  type Detail,
  type Options,
  type Proposal,
  type Person,
} from './types.js';
import type { EmployeeList } from '../employees/types.js';
export default function TransferForm() {
  const { requestId } = useParams(),
    { session } = useAuthentication(),
    revision = useAuthorizationRevision();
  return (
    <TransferFormContent
      key={`${session?.user.id}:${revision}:${requestId ?? 'new'}`}
    />
  );
}
function TransferFormContent() {
  const { requestId } = useParams(),
    location = useLocation(),
    { t } = useTranslation(),
    api = useApiClient(),
    notify = useToaster(),
    navigate = useNavigate(),
    parent = useOutletContext<Context>();
  const mode = location.pathname.endsWith('/reviewEdit')
    ? 'reviewEdit'
    : requestId
      ? 'edit'
      : 'create';
  const options = useTransferResource<{ data: Options }>(
    'transferRequests/formOptions',
    { mode, ...(requestId ? { requestId } : {}) },
  );
  const resource = useTransferResource<{ data: Detail }>(
    requestId ? `transferRequests/${encodeURIComponent(requestId)}` : null,
  );
  const salaryPermission = useCan(transferPolicy('viewSalary'));
  const salary = useTransferResource<{ data: { targetSalary: string } }>(
    requestId &&
      salaryPermission.can &&
      options.data?.data.editableFields.includes('targetSalary')
      ? `transferRequests/${requestId}/salary`
      : null,
  );
  const [employeeSearch, setEmployeeSearch] = useState(''),
    [employeePage, setEmployeePage] = useState(1),
    [error, setError] = useState<unknown>(),
    [discard, setDiscard] = useState(false);
  const employees = useTransferResource<EmployeeList>(
    mode === 'create' && options.data?.data.canCreateAsHR ? 'employees' : null,
    {
      page: String(employeePage),
      pageSize: '20',
      q: employeeSearch,
      active: 'true',
    },
  );
  const focusRef = useRef<keyof Proposal | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  useEffect(() => () => abortRef.current?.abort(), []);
  const savedRef = useRef(false),
    initializedRef = useRef(''),
    commandRef = useRef<{ payload: string; key: string } | undefined>(
      undefined,
    );
  const schema = z.object({
    employeeId: z.string().min(1, t('transfer.required')),
    kinds: z.array(z.string()).min(1, t('transfer.required')),
    targetDepartmentId: z.string().min(1, t('transfer.required')),
    targetPositionId: z.string().min(1, t('transfer.required')),
    targetGradeId: z.string().min(1, t('transfer.required')),
    targetManagerId: z.string().nullable(),
    sourceAccountId: z.string().nullable(),
    targetAccountId: z.string().nullable(),
    effectiveDate: z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, t('transfer.required')),
    targetSalary: z.string(),
    reason: z
      .string()
      .trim()
      .min(1, t('transfer.required'))
      .max(10000, t('transfer.tooLong')),
  });
  const form = useForm<Proposal>({
    resolver: zodResolver(schema),
    defaultValues: {
      employeeId: '',
      kinds: ['transfer'],
      targetDepartmentId: '',
      targetPositionId: '',
      targetGradeId: '',
      targetManagerId: null,
      sourceAccountId: null,
      targetAccountId: null,
      effectiveDate: '',
      targetSalary: '',
      reason: '',
    },
  });
  const values = useWatch({ control: form.control });
  const detail = resource.data?.data,
    choices = options.data?.data;
  const capacity = useTransferResource<{
    data: { sourceAccountId: string | null; targetAccountId: string | null };
  }>(
    choices &&
      values.employeeId &&
      values.targetDepartmentId &&
      values.targetPositionId &&
      values.effectiveDate
      ? 'transferRequests/capacityOptions'
      : null,
    {
      mode,
      employeeId: values.employeeId ?? '',
      targetDepartmentId: values.targetDepartmentId ?? '',
      targetPositionId: values.targetPositionId ?? '',
      effectiveDate: values.effectiveDate ?? '',
      ...(requestId ? { requestId } : {}),
    },
  );
  useEffect(() => {
    if (!detail || !choices || initializedRef.current === detail.record.id)
      return;
    if (
      choices.editableFields.includes('targetSalary') &&
      salaryPermission.can &&
      !salary.data &&
      !salary.error
    )
      return;
    const { record } = detail;
    form.reset({
      ...record,
      targetSalary: salary.data?.data.targetSalary ?? '',
    });
    initializedRef.current = record.id;
  }, [detail, choices, form, salary.data, salary.error, salaryPermission.can]);
  useEffect(() => {
    if ((!salaryPermission.can || salary.error) && mode !== 'create')
      form.setValue('targetSalary', '');
  }, [salaryPermission.can, salary.error, mode, form]);
  useNavigationGuard(() => {
    if (savedRef.current) return true;
    if (form.formState.isSubmitting) return false;
    if (!form.formState.isDirty) return true;
    setDiscard(true);
    return false;
  });
  const goBack = () =>
    navigate(
      { pathname: '..', search: location.search, hash: location.hash },
      { replace: true },
    );
  const busy = form.formState.isSubmitting;
  useEffect(() => {
    if (!busy && focusRef.current) {
      form.setFocus(focusRef.current);
      focusRef.current = null;
    }
  }, [busy, form]);
  const allowed = (field: string) =>
    choices?.editableFields.includes(field) ?? false;
  const submission = useRequestFormSubmission<Detail['record']>({
    resource: 'transferRequests',
    suffix: 'transitions',
    keyField: 'requestKey',
    includeInput: false,
  });
  async function save(input: Proposal) {
    if (
      !choices ||
      options.loading ||
      options.error ||
      !capacity.data ||
      capacity.loading ||
      capacity.error
    )
      return;
    if (
      allowed('targetSalary') &&
      !/^\d+(?:\.\d{1,2})?$/.test(input.targetSalary)
    ) {
      form.setError('targetSalary', { message: t('transfer.errors.salary') });
      return;
    }
    setError(undefined);
    const controller = new AbortController();
    abortRef.current = controller;
    const complete = { ...input, ...capacity.data.data };
    const patch = Object.fromEntries(
      Object.entries(complete).filter(
        ([field, value]) =>
          allowed(field) &&
          field !== 'employeeId' &&
          JSON.stringify(value) !==
            JSON.stringify(
              field === 'targetSalary'
                ? salary.data?.data.targetSalary
                : detail?.record[field as keyof typeof detail.record],
            ),
      ),
    );
    if (mode === 'reviewEdit' && !Object.keys(patch).length) {
      form.setError('reason', { message: t('transfer.noChanges') });
      return;
    }
    const payload = {
      reason: input.reason,
      ...(mode === 'reviewEdit'
        ? { patch, version: detail!.record.lifecycleVersion }
        : {
            proposal: complete,
            ...(detail ? { version: detail.record.lifecycleVersion } : {}),
          }),
    };
    const signature = JSON.stringify(payload);
    if (commandRef.current?.payload !== signature)
      commandRef.current = { payload: signature, key: createRequestKey() };
    try {
      const draftKey = commandRef.current.key;
      let savedDetail: Detail | undefined;
      const savedRecord = await submission.save(
        payload,
        detail?.record,
        async (current) => {
          const response = await api.request<{ data: Detail }>({
            signal: controller.signal,
            method: mode !== 'reviewEdit' && current ? 'PATCH' : 'POST',
            path:
              mode === 'reviewEdit'
                ? `transferRequests/${requestId}/reviewEdit`
                : current
                  ? `transferRequests/${current.id}`
                  : 'transferRequests',
            json: {
              ...payload,
              ...(current ? { version: current.lifecycleVersion } : {}),
              requestKey: draftKey,
            },
          });
          savedDetail = response.data;
          return response.data.record;
        },
      );
      const completed = await submission.finish(
        savedRecord,
        async (record, key) => {
          const { data } = await api.request<{
            data: { record: Detail['record'] };
          }>({
            method: 'POST',
            path: `transferRequests/${record.id}/transitions`,
            json: {
              transition: 'submit',
              version: record.lifecycleVersion,
              requestKey: key,
              reason: record.reason,
            },
          });
          return data.record;
        },
      );
      if (controller.signal.aborted) return;
      if (savedDetail && submission.intent.current !== 'submit')
        parent?.update?.(savedDetail);
      savedRef.current = true;
      form.reset(complete);
      parent?.reload();
      notify.show({
        type: 'success',
        title: t(
          submission.intent.current === 'submit'
            ? 'approvals.submitted'
            : 'transfer.saved',
          { name: completed.employee?.name ?? t('approvals.draft') },
        ),
      });
      await navigate(
        {
          pathname:
            mode === 'create' && submission.intent.current !== 'submit'
              ? `../${location.pathname.endsWith('/newTransfer') ? 'transfer/' : ''}${completed.id}`
              : '..',
          search: location.search,
          hash: location.hash,
        },
        { replace: true },
      );
    } catch (error) {
      if (!controller.signal.aborted) {
        setError(error);
        if (
          error instanceof ApiClientError &&
          error.payload &&
          typeof error.payload === 'object' &&
          'error' in error.payload
        ) {
          const body = error.payload.error;
          if (
            body &&
            typeof body === 'object' &&
            'fieldViolations' in body &&
            Array.isArray(body.fieldViolations)
          ) {
            let first = true;
            for (const violation of body.fieldViolations as unknown[]) {
              if (
                !violation ||
                typeof violation !== 'object' ||
                !('field' in violation) ||
                typeof violation.field !== 'string'
              )
                continue;
              const field = violation.field.split('.').at(-1);
              if (field && field in schema.shape && allowed(field)) {
                form.setError(
                  field as keyof Proposal,
                  {
                    type: 'server',
                    message: t(
                      field === 'targetSalary'
                        ? 'transfer.errors.salary'
                        : 'transfer.required',
                    ),
                  },
                  { shouldFocus: false },
                );
                if (first) focusRef.current = field as keyof Proposal;
                first = false;
              }
            }
          }
        }
      }
    }
  }
  const picker = (
    field:
      | 'targetDepartmentId'
      | 'targetPositionId'
      | 'targetGradeId'
      | 'targetManagerId',
    items: Person[],
  ) =>
    allowed(field) ? (
      <Controller
        key={field}
        name={field}
        control={form.control}
        render={({ field: input, fieldState }) => (
          <Field data-invalid={fieldState.invalid}>
            <FieldLabel htmlFor={`transfer-${field}`}>
              {t(`transfer.fields.${field}`)}
            </FieldLabel>
            <Select
              value={input.value ?? 'none'}
              onValueChange={(value) =>
                input.onChange(value === 'none' ? null : value)
              }
              disabled={busy}
            >
              <SelectTrigger
                id={`transfer-${field}`}
                ref={input.ref}
                onBlur={input.onBlur}
                aria-invalid={fieldState.invalid}
              >
                <SelectValue>
                  {items.find((item) => item.id === input.value)?.name ??
                    (field === 'targetManagerId' && !input.value
                      ? t('transfer.none')
                      : t('transfer.select'))}
                </SelectValue>
              </SelectTrigger>
              <SelectContent className='min-w-(--anchor-width) max-w-(--available-width)'>
                <SelectGroup>
                  {field === 'targetManagerId' ? (
                    <SelectItem value='none'>{t('transfer.none')}</SelectItem>
                  ) : null}
                  {items.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.name}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
            <FieldError errors={[fieldState.error]} />
          </Field>
        )}
      />
    ) : null;
  return (
    <RouteFormPage
      printable
      title={t(
        mode === 'create' ? 'transfer.create' : `transfer.operations.${mode}`,
      )}
    >
      <PageContainer className='mx-auto max-w-4xl'>
        <BackButton />
        <PageHeader
          title={t(
            mode === 'create'
              ? 'transfer.create'
              : `transfer.operations.${mode}`,
          )}
          actions={
            <>
              {mode === 'reviewEdit' ? (
                <Button
                  type='submit'
                  form='transfer-form'
                  disabled={
                    busy ||
                    !capacity.data ||
                    capacity.loading ||
                    !!capacity.error ||
                    !!salary.error
                  }
                >
                  {busy ? t('transfer.saving') : t('transfer.save')}
                </Button>
              ) : (
                <RequestFormButtons
                  revision={detail?.record.status === 'revision'}
                  resource='oa.transfer'
                  form='transfer-form'
                  busy={busy}
                  disabled={
                    !capacity.data ||
                    capacity.loading ||
                    !!capacity.error ||
                    !!salary.error
                  }
                />
              )}
              <Button
                type='button'
                variant='outline'
                disabled={busy}
                onClick={() => void goBack()}
              >
                {t('transfer.cancel')}
              </Button>
            </>
          }
        />
        {options.error ? (
          <TransferError error={options.error} retry={options.reload} />
        ) : null}
        {resource.error ? (
          <TransferError error={resource.error} retry={resource.reload} />
        ) : null}
        {salary.error ? (
          <TransferError error={salary.error} retry={salary.reload} />
        ) : null}
        {error ? (
          <TransferError
            error={error}
            retry={() => {
              resource.reload();
              options.reload();
              salary.reload();
            }}
          />
        ) : null}
        {options.loading ||
        (requestId &&
          form.formState.defaultValues?.employeeId !==
            detail?.record.employeeId) ? (
          <FieldsSkeleton fields={10} />
        ) : choices ? (
          <form
            id='transfer-form'
            onSubmitCapture={submission.captureIntent}
            onKeyDown={preventComposingSubmit}
            onSubmit={(event) => {
              void form.handleSubmit(save)(event);
            }}
            className='space-y-6'
          >
            {mode === 'reviewEdit' ? (
              <Alert>
                <AlertDescription>
                  {t('transfer.reviewEditWarning')}
                </AlertDescription>
              </Alert>
            ) : null}
            <RequestSubmissionFeedback
              failed={submission.submitFailed}
              unknown={submission.submitUnknown}
            />
            <FieldGroup inert={submission.submitUnknown || undefined}>
              {mode === 'create' ? (
                <Field>
                  <FieldLabel htmlFor='transfer-employee'>
                    {t('transfer.fields.employeeId')}
                  </FieldLabel>
                  <Input
                    aria-label={t('transfer.searchEmployees')}
                    value={employeeSearch}
                    placeholder={t('transfer.searchEmployees')}
                    onChange={(event) => {
                      setEmployeeSearch(event.target.value);
                      setEmployeePage(1);
                    }}
                    disabled={busy}
                  />
                  {employees.error ? (
                    <TransferError
                      error={employees.error}
                      retry={employees.reload}
                    />
                  ) : null}
                  <Controller
                    name='employeeId'
                    control={form.control}
                    render={({ field, fieldState }) => (
                      <>
                        <Select
                          value={field.value}
                          onValueChange={(value) => {
                            field.onChange(value);
                            const employee = employees.data?.data.find(
                              (row) => row.id === value,
                            );
                            if (employee) {
                              form.setValue(
                                'targetDepartmentId',
                                employee.primaryDepartment?.id ?? '',
                              );
                              form.setValue(
                                'targetPositionId',
                                employee.positionId ?? '',
                              );
                              form.setValue(
                                'targetGradeId',
                                employee.gradeId ?? '',
                              );
                              form.setValue(
                                'targetManagerId',
                                employee.managerId ?? null,
                              );
                            }
                          }}
                          disabled={busy || employees.loading}
                        >
                          <SelectTrigger
                            id='transfer-employee'
                            ref={field.ref}
                            onBlur={field.onBlur}
                            aria-invalid={fieldState.invalid}
                          >
                            <SelectValue>
                              {employees.data?.data.find(
                                (employee) => employee.id === field.value,
                              )?.name ?? t('transfer.select')}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent className='min-w-(--anchor-width) max-w-(--available-width)'>
                            <SelectGroup>
                              {employees.data?.data
                                .filter(
                                  (employee) =>
                                    employee.active &&
                                    ['regular', 'probation'].includes(
                                      employee.status ?? '',
                                    ),
                                )
                                .map((employee) => (
                                  <SelectItem
                                    key={employee.id}
                                    value={employee.id}
                                  >
                                    <UserName
                                      name={
                                        employee.name ?? employee.user?.name
                                      }
                                    />
                                  </SelectItem>
                                ))}
                            </SelectGroup>
                          </SelectContent>
                        </Select>
                        <FieldError errors={[fieldState.error]} />
                      </>
                    )}
                  />
                  <div className='flex gap-2'>
                    <Button
                      type='button'
                      variant='outline'
                      disabled={employeePage === 1 || busy}
                      onClick={() => setEmployeePage((page) => page - 1)}
                    >
                      {t('transfer.previous')}
                    </Button>
                    <Button
                      type='button'
                      variant='outline'
                      disabled={
                        busy ||
                        employeePage * 20 >= (employees.data?.meta.total ?? 0)
                      }
                      onClick={() => setEmployeePage((page) => page + 1)}
                    >
                      {t('transfer.next')}
                    </Button>
                  </div>
                </Field>
              ) : (
                <Field>
                  <FieldLabel>{t('transfer.fields.employeeId')}</FieldLabel>
                  <p>
                    <UserName name={choices.employee?.name} />
                  </p>
                </Field>
              )}
              {allowed('kinds') ? (
                <Controller
                  name='kinds'
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel>{t('transfer.fields.kinds')}</FieldLabel>
                      <div className='flex flex-wrap gap-4'>
                        {['transfer', 'salaryChange', 'promotion'].map(
                          (kind) => (
                            <label
                              key={kind}
                              className='flex items-center gap-2'
                            >
                              <Checkbox
                                checked={field.value.includes(kind)}
                                disabled={busy}
                                onCheckedChange={(checked) =>
                                  field.onChange(
                                    checked
                                      ? [...field.value, kind]
                                      : field.value.filter(
                                          (value) => value !== kind,
                                        ),
                                  )
                                }
                              />
                              {t(`transfer.kinds.${kind}`)}
                            </label>
                          ),
                        )}
                      </div>
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
              ) : null}
              {picker('targetDepartmentId', choices.departments)}
              {picker('targetPositionId', choices.positions)}
              {picker('targetGradeId', choices.grades)}
              {picker('targetManagerId', choices.managers)}
              {allowed('effectiveDate') ? (
                <Controller
                  name='effectiveDate'
                  control={form.control}
                  render={({ field, fieldState }) => (
                    <Field>
                      <FieldLabel htmlFor='transfer-date'>
                        {t('transfer.fields.effectiveDate')}
                      </FieldLabel>
                      <DatePicker
                        id='transfer-date'
                        value={field.value ? parseISO(field.value) : undefined}
                        onChange={(date) =>
                          field.onChange(date ? format(date, 'yyyy-MM-dd') : '')
                        }
                        disabled={busy}
                        invalid={fieldState.invalid}
                      />
                      <FieldError errors={[fieldState.error]} />
                    </Field>
                  )}
                />
              ) : null}
              {allowed('targetSalary') &&
              (mode === 'create' || salaryPermission.can) ? (
                <Field>
                  <FieldLabel htmlFor='transfer-salary'>
                    {t('transfer.fields.targetSalary')}
                  </FieldLabel>
                  <Input
                    id='transfer-salary'
                    inputMode='decimal'
                    {...form.register('targetSalary')}
                    disabled={busy || salary.loading || !!salary.error}
                    autoComplete='off'
                    aria-invalid={!!form.formState.errors.targetSalary}
                  />
                  <FieldError errors={[form.formState.errors.targetSalary]} />
                </Field>
              ) : null}
              {allowed('reason') ? (
                <Field>
                  <FieldLabel htmlFor='transfer-reason'>
                    {t('transfer.fields.reason')}
                  </FieldLabel>
                  <Textarea
                    id='transfer-reason'
                    {...form.register('reason')}
                    disabled={busy}
                    maxLength={10000}
                  />
                  <FieldError errors={[form.formState.errors.reason]} />
                </Field>
              ) : null}
              {capacity.error ? (
                <TransferError error={capacity.error} retry={capacity.reload} />
              ) : null}
              <p className='text-sm text-muted-foreground'>
                {t(
                  capacity.data
                    ? 'transfer.capacityResolved'
                    : 'transfer.capacityRequired',
                )}
              </p>
            </FieldGroup>
          </form>
        ) : null}
        <AlertDialog open={discard} onOpenChange={setDiscard}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>{t('transfer.discardTitle')}</AlertDialogTitle>
              <AlertDialogDescription>
                {t('transfer.discardDescription')}
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>{t('transfer.keepEditing')}</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  savedRef.current = true;
                  void goBack();
                }}
              >
                {t('transfer.discard')}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </PageContainer>
    </RouteFormPage>
  );
}
