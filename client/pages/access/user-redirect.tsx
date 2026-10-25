import { Navigate, useParams, useLocation } from 'react-router';
import { legacyUserLink } from './user-url.js';
export default function UserRedirect() {
  const { userId } = useParams();
  const location = useLocation();
  return (
    <Navigate
      replace
      to={legacyUserLink(
        location.pathname,
        new URLSearchParams(location.search),
        userId,
      )}
    />
  );
}
