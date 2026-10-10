import { Navigate, Outlet, useLocation, useResolvedPath } from 'react-router';
import { PageContainer } from '@/components/page-container';
export default function ApprovalsPage() {
  const location = useLocation();
  const base = useResolvedPath('.');
  if (location.pathname === base.pathname)
    return (
      <Navigate
        replace
        to={{ pathname: `${base.pathname}/todo`, search: location.search }}
      />
    );
  return (
    <PageContainer>
      <Outlet />
    </PageContainer>
  );
}
