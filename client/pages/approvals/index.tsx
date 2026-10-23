import { Navigate, useLocation } from 'react-router';

/** Keep published bookmarks and nested business links while retiring the table center. */
export default function ApprovalsPage() {
  const location = useLocation();
  const [, , tab, ...detail] = location.pathname.split('/');
  const params = new URLSearchParams(location.search);
  if (params.get('category') === 'drafts') {
    params.delete('category');
    params.delete('status');
    params.delete('page');
  }
  params.set(
    'source',
    tab === 'mine'
      ? 'approval.application'
      : tab === 'copied'
        ? 'approval.cc'
        : 'approval.task',
  );
  if (tab === 'done') params.set('status', 'closed');
  if (params.has('kind')) {
    params.set('subject', params.get('kind')!);
    params.delete('kind');
  }
  return (
    <Navigate
      replace
      to={{
        pathname: `/taskCenter${detail.length ? `/${detail.join('/')}` : ''}`,
        search: `?${params}`,
      }}
    />
  );
}
