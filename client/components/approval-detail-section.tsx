import type { ReactElement, ReactNode } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '#components/ui/card';

/** The same card composition used by the UI Library approval example. */
export function ApprovalDetailSection({
  title,
  children,
}: {
  readonly title: ReactNode;
  readonly children: ReactNode;
}): ReactElement {
  return (
    <Card>
      <CardHeader>
        <CardTitle>
          <h2>{title}</h2>
        </CardTitle>
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  );
}
