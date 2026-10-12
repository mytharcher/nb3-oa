import { ApprovalRecipientPicker } from '#components/approval-recipient-picker';
export function RecipientPicker({
  leaveId,
  ...props
}: {
  id: string;
  leaveId: string;
  taskId: string;
  action: string;
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  return (
    <ApprovalRecipientPicker
      {...props}
      requestPath='leaveRequests'
      recordId={leaveId}
    />
  );
}
