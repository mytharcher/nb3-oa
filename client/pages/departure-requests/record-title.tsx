import { UserName } from '#components/user-name';

export function DepartureRecordTitle({
  name,
  number,
}: {
  name: string;
  number: string;
}) {
  return (
    <span className='inline-flex max-w-full flex-wrap items-center gap-x-2 gap-y-1'>
      <UserName name={name} />
      <span className='min-w-0 break-words'>· {number}</span>
    </span>
  );
}
