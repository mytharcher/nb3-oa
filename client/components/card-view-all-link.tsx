import { ArrowRight } from 'lucide-react';
import { Link, type LinkProps } from 'react-router';

export function CardViewAllLink({
  to,
  label,
}: {
  to: LinkProps['to'];
  label: string;
}) {
  return (
    <Link
      to={to}
      className='inline-flex shrink-0 items-center gap-1 rounded-sm text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline focus-visible:outline-2 focus-visible:outline-ring'
    >
      {label}
      <ArrowRight className='size-4' aria-hidden='true' />
    </Link>
  );
}
