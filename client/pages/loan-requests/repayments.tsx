import { ApplicationTableSkeleton } from '#components/application-table-skeleton';
import { FieldsSkeleton } from '../platform/shared/states.js';
import { MoreHorizontal } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
} from '#components/ui/dropdown-menu';
import { useEffect, useRef, useState } from 'react';
import { Link, useLocation } from 'react-router';
import { useTranslation } from '@nocobase/i18n/client';
import { useApiClient, useToaster, ApiClientError } from '@nocobase/app-client';
import { useAuthentication } from '@nocobase/app-plugin-authentication/client';
import { useCan } from '@nocobase/app-plugin-authorization/client';
import { DataTable } from '#components/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import { Button } from '#components/ui/button';
import { StatusBadge } from '#components/status-badge';
import { Alert, AlertDescription } from '#components/ui/alert';
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from '#components/ui/alert-dialog';
import { useResource } from '../approvals/use-resource.js';
import { createRequestId } from '../approvals/request-id.js';
import { ErrorState } from './states.js';
import { formatCents } from '#lib/money';
import type { LoanRequestRecord } from './types.js';
export interface Repayment {
  id: string;
  reference: string;
  kind: 'cash' | 'reimbursement';
  cents: number;
  state: 'pending' | 'settled' | 'cancelled';
}
export function LoanFinancialSections({
  record,
  reload,
}: {
  record: LoanRequestRecord;
  reload: () => void;
}) {
  const { t, i18n } = useTranslation(),
    api = useApiClient(),
    toast = useToaster(),
    { session } = useAuthentication();
  const payment = useCan({
      resource: { type: 'composite', id: 'oa.loan' },
      action: 'payment',
    }),
    cash = useCan({
      resource: { type: 'composite', id: 'oa.loan' },
      action: 'cashRepayment',
    }),
    confirmation = useCan({
      resource: { type: 'composite', id: 'oa.loan' },
      action: 'confirmRepayment',
    });
  const location = useLocation();
  const [showBank, setShowBank] = useState(false);
  const bank = useResource<{
    bankName: string;
    bankAccountName: string;
    bankAccount: string;
  } | null>(
    showBank && payment.can && !payment.isPending && !payment.error
      ? `loanRequests/${record.id}/paymentAccount`
      : null,
    { viewer: session?.user.id ?? '' },
  );
  const repayments = useResource<{ reservations: Repayment[] }>(
    record.status === 'paid' ? `loanRequests/${record.id}/repayments` : null,
  );
  const [command, setCommand] = useState<{
      row: Repayment;
      operation: 'confirm' | 'cancel';
      key: string;
    } | null>(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState<unknown>();
  const previousVersionRef = useRef(record.lifecycleVersion);
  useEffect(() => {
    if (previousVersionRef.current !== record.lifecycleVersion) {
      previousVersionRef.current = record.lifecycleVersion;
      repayments.reload();
      bank.reload();
    }
  }, [record.lifecycleVersion, repayments, bank]);
  async function perform() {
    if (!command || busy) return;
    setBusy(true);
    setError(undefined);
    try {
      await api.request({
        method: 'POST',
        path: `loanRequests/${record.id}/repayments`,
        json: {
          operation: command.operation,
          receiptId: command.row.reference.replace(/^cash:/, ''),
          reason: t(
            command.operation === 'confirm'
              ? 'loanRequests.confirmReason'
              : 'loanRequests.cancelReason',
          ),
          requestKey: command.key,
        },
      });
      toast.show({
        type: 'success',
        title: t(
          command.operation === 'confirm'
            ? 'loanRequests.repaymentConfirmed'
            : 'loanRequests.repaymentCancelled',
          { receipt: command.row.reference },
        ),
      });
      setCommand(null);
      repayments.reload();
      reload();
    } catch (e) {
      setError(e);
    } finally {
      setBusy(false);
    }
  }
  const invalidRepayments = repayments.data?.reservations.some(
    (row) => !Number.isSafeInteger(row.cents) || row.cents <= 0,
  );
  const columns: ColumnDef<Repayment>[] = [
    { accessorKey: 'reference', header: t('loanRequests.receipt') },
    {
      accessorKey: 'cents',
      header: t('loanRequests.amount'),
      cell: ({ row }) => (
        <span className='block text-right tabular-nums'>
          {formatCents(row.original.cents, i18n.language)}
        </span>
      ),
    },
    {
      accessorKey: 'state',
      header: t('loanRequests.status'),
      cell: ({ row }) => (
        <StatusBadge
          tone={
            row.original.state === 'settled'
              ? 'success'
              : row.original.state === 'pending'
                ? 'warning'
                : 'neutral'
          }
        >
          {t(`loanRequests.repaymentStates.${row.original.state}`)}
        </StatusBadge>
      ),
    },
    {
      id: 'actions',
      header: t('loanRequests.actions'),
      cell: ({ row }) =>
        row.original.kind === 'cash' && row.original.state === 'pending' ? (
          (session?.user.id === record.applicantId && confirmation.can) ||
          cash.can ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    size='icon-sm'
                    variant='ghost'
                    disabled={busy}
                    aria-label={t('loanRequests.rowActions', {
                      name: row.original.reference,
                    })}
                  />
                }
              >
                <MoreHorizontal />
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-auto min-w-40'>
                <DropdownMenuGroup>
                  {session?.user.id === record.applicantId &&
                  confirmation.can ? (
                    <DropdownMenuItem
                      onClick={() => {
                        setError(undefined);
                        setCommand({
                          row: row.original,
                          operation: 'confirm',
                          key: createRequestId(),
                        });
                      }}
                    >
                      {t('loanRequests.confirmRepayment')}
                    </DropdownMenuItem>
                  ) : null}
                  {cash.can ? (
                    <DropdownMenuItem
                      onClick={() => {
                        setError(undefined);
                        setCommand({
                          row: row.original,
                          operation: 'cancel',
                          key: createRequestId(),
                        });
                      }}
                    >
                      {t('loanRequests.cancelRepayment')}
                    </DropdownMenuItem>
                  ) : null}
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : null
        ) : null,
    },
  ];
  return (
    <>
      <section className='flex flex-col gap-3 rounded-md border border-border p-4'>
        <h2 className='font-medium'>{t('loanRequests.bank')}</h2>
        {payment.can ? (
          <Button variant='outline' onClick={() => setShowBank((v) => !v)}>
            {t(showBank ? 'loanRequests.hideBank' : 'loanRequests.showBank')}
          </Button>
        ) : (
          <p className='text-sm text-muted-foreground'>
            {t('loanRequests.bankRestricted')}
          </p>
        )}
        {showBank ? (
          bank.error instanceof ApiClientError && bank.error.status === 403 ? (
            <Alert>
              <AlertDescription>
                {t('loanRequests.bankRestricted')}
              </AlertDescription>
            </Alert>
          ) : bank.error ? (
            <ErrorState error={bank.error} retry={bank.reload} />
          ) : bank.data ? (
            <dl className='grid gap-2 sm:grid-cols-[9rem_1fr]'>
              {[
                [t('loanRequests.bankName'), bank.data.bankName],
                [t('loanRequests.bankHolder'), bank.data.bankAccountName],
                [t('loanRequests.bankAccount'), bank.data.bankAccount],
              ].map(([key, value]) => (
                <div className='contents' key={key}>
                  <dt className='text-muted-foreground'>{key}</dt>
                  <dd className='break-all'>{value}</dd>
                </div>
              ))}
            </dl>
          ) : bank.loading ? (
            <FieldsSkeleton />
          ) : (
            <p className='text-sm text-muted-foreground'>
              {t('loanRequests.bankNotSnapshot')}
            </p>
          )
        ) : null}
      </section>
      {record.status === 'paid' ? (
        <section className='flex flex-col gap-3'>
          <div className='flex items-center justify-between gap-3'>
            <h2 className='font-medium'>{t('loanRequests.repayment')}</h2>
            {cash.can && !invalidRepayments && !repayments.error ? (
              <Button
                variant='outline'
                nativeButton={false}
                render={
                  <Link
                    to={{ pathname: 'repayment', search: location.search }}
                  />
                }
              >
                {t('loanRequests.recordCash')}
              </Button>
            ) : null}
          </div>
          {repayments.error ? (
            <ErrorState error={repayments.error} retry={repayments.reload} />
          ) : invalidRepayments ? (
            <Alert variant='destructive'>
              <AlertDescription>
                {t('loanRequests.invalidRepaymentAmount')}
              </AlertDescription>
            </Alert>
          ) : repayments.data ? (
            <DataTable
              columns={columns}
              data={repayments.data.reservations}
              emptyMessage={t('loanRequests.noRepayments')}
            />
          ) : (
            <ApplicationTableSkeleton columns={4} />
          )}
        </section>
      ) : null}
      <AlertDialog
        open={!!command}
        onOpenChange={(open) => {
          if (!open && !busy) setCommand(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t(
                command?.operation === 'confirm'
                  ? 'loanRequests.confirmRepaymentTitle'
                  : 'loanRequests.cancelRepaymentTitle',
                { receipt: command?.row.reference },
              )}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {t(
                command?.operation === 'confirm'
                  ? 'loanRequests.confirmCashWarning'
                  : 'loanRequests.cancelCashWarning',
                {
                  receipt: command?.row.reference,
                  amount: command
                    ? formatCents(command.row.cents, i18n.language)
                    : '',
                },
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error ? (
            <ErrorState
              error={error}
              retry={() => {
                void perform();
              }}
            />
          ) : null}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>
              {t('approvals.cancel')}
            </AlertDialogCancel>
            <Button
              variant={
                command?.operation === 'cancel' ? 'destructive' : 'default'
              }
              disabled={busy}
              onClick={() => {
                void perform();
              }}
            >
              {t(
                command?.operation === 'cancel'
                  ? 'loanRequests.cancelRepayment'
                  : 'loanRequests.confirmRepayment',
              )}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
