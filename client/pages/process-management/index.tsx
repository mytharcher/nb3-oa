import { Navigate, Outlet, useLocation, useResolvedPath } from 'react-router';
import { PageContainer } from '#components/page-container';
export default function ProcessManagementPage() {
  const location = useLocation(),
    base = useResolvedPath('.');
  if (location.pathname === base.pathname)
    return (
      <Navigate
        replace
        to={{
          pathname: `${base.pathname}/definitions`,
          search: location.search,
          hash: location.hash,
        }}
      />
    );
  return (
    <PageContainer>
      <Outlet />
    </PageContainer>
  );
}
