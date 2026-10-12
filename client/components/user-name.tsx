import { Fragment, type ReactElement } from 'react';
import { cn } from 'cn';
import { Avatar, AvatarFallback } from '#components/ui/avatar';

import { userAvatarColor, userInitials } from '#lib/user-identity';

export function UserAvatar({
  name,
  size = 'sm',
}: {
  readonly name: string;
  readonly size?: 'sm' | 'default' | 'lg';
}): ReactElement {
  return (
    <Avatar size={size} aria-hidden='true' className='shrink-0'>
      <AvatarFallback
        style={{ backgroundColor: userAvatarColor(name), color: '#fff' }}
      >
        {userInitials(name)}
      </AvatarFallback>
    </Avatar>
  );
}

/** Display only: editable name inputs and plain-text labels retain their string values. */
export function UserName({
  name,
  className,
}: {
  readonly name?: string | null;
  readonly className?: string;
}): ReactElement {
  if (!name?.trim() || name === '—')
    return <span className='text-muted-foreground'>—</span>;
  return (
    <span
      className={cn(
        'inline-flex max-w-full min-w-0 items-center gap-2 align-middle',
        className,
      )}
    >
      <UserAvatar name={name} />
      <span className='truncate' title={name}>
        {name}
      </span>
    </span>
  );
}

/** Keep translated prose and record labels intact, decorating only the interpolated person's name. */
export function UserNameText({
  text,
  name,
}: {
  readonly text: string;
  readonly name?: string | null;
}): ReactElement {
  if (!name || !text.includes(name)) return <>{text}</>;
  const pieces = text.split(name).map((piece, index, parts) => ({
    piece,
    position: parts
      .slice(0, index)
      .reduce((length, part) => length + part.length + name.length, 0),
  }));
  return (
    <>
      {pieces.map(({ piece, position }) => (
        <Fragment key={position}>
          {position ? <UserName name={name} /> : null}
          {piece}
        </Fragment>
      ))}
    </>
  );
}
